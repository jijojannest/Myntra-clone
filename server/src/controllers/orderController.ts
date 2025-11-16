import { Request, Response } from 'express';
import { Order } from '../models/Order';
import { Product } from '../models/Product';
import { User } from '../models/User';
import { Coupon } from '../models/Coupon';
import { redis } from '../config/redis';
import { validateOrder } from '../utils/validation';
import { calculateShipping, calculateTax, applyCoupon } from '../utils/pricing';
import { generateInvoice, sendOrderEmail } from '../services/orderService';
import mongoose from 'mongoose';

export const createOrder = async (req: Request, res: Response) => {
  try {
    const userId = req.user.id;
    const { items, shippingAddress, billingAddress, paymentInfo, shippingMethod, couponCode, giftWrap, giftMessage, notes } = req.body;

    // Validate order data
    const validation = validateOrder(req.body);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        error: validation.error,
      });
    }

    // Get user details
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    // Validate products and calculate pricing
    const orderItems = [];
    let subtotal = 0;

    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product) {
        return res.status(404).json({
          success: false,
          error: `Product ${item.productId} not found`,
        });
      }

      // Check stock
      const variant = product.variants.find(v => v.size === item.size && v.color === item.color);
      if (!variant || variant.stock < item.quantity) {
        return res.status(400).json({
          success: false,
          error: `Insufficient stock for ${product.name} (${item.size}, ${item.color})`,
        });
      }

      const price = item.discountPrice || item.price;
      const itemTotal = price * item.quantity;
      subtotal += itemTotal;

      orderItems.push({
        productId: product._id,
        name: product.name,
        price: item.price,
        discountPrice: item.discountPrice,
        size: item.size,
        color: item.color,
        quantity: item.quantity,
        image: product.images[0],
        maxQuantity: variant.stock,
      });
    }

    // Calculate shipping and tax
    const shipping = calculateShipping(shippingMethod, subtotal);
    const tax = calculateTax(subtotal);

    // Apply coupon if provided
    let discount = 0;
    let discountAmount = 0;
    if (couponCode) {
      const couponResult = await applyCoupon(couponCode, subtotal, userId);
      if (!couponResult.valid) {
        return res.status(400).json({
          success: false,
          error: couponResult.error,
        });
      }
      discount = couponResult.discount;
      discountAmount = couponResult.discountAmount;
    }

    const total = subtotal + shipping + tax - discountAmount;

    // Create order
    const order = new Order({
      userId,
      items: orderItems,
      shippingAddress,
      billingAddress: billingAddress || shippingAddress,
      paymentInfo: {
        ...paymentInfo,
        amount: total,
      },
      pricing: {
        subtotal,
        discount: discountAmount,
        shipping,
        tax,
        total,
      },
      shippingMethod,
      couponCode,
      discountAmount,
      giftWrap: giftWrap || false,
      giftMessage,
      notes,
      estimatedDelivery: new Date(Date.now() + shippingMethod.estimatedDays * 24 * 60 * 60 * 1000),
    });

    // Update product stock
    for (const item of orderItems) {
      await Product.findByIdAndUpdate(
        item.productId,
        { $inc: { 'variants.$[elem].stock': -item.quantity } },
        { arrayFilters: [{ 'elem.size': item.size, 'elem.color': item.color }] }
      );
    }

    await order.save();

    // Clear user's cart
    await redis.del(`cart:${userId}`);

    // Add initial tracking
    order.addTracking('pending', 'Order placed successfully');
    await order.save();

    // Send confirmation email
    await sendOrderEmail(user.email, order, 'confirmation');

    res.status(201).json({
      success: true,
      data: {
        order: order.populate('items.productId'),
        message: 'Order placed successfully',
      },
    });
  } catch (error: any) {
    console.error('Create order error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create order',
    });
  }
};

export const getOrders = async (req: Request, res: Response) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const status = req.query.status as string;

    const query: any = { userId };
    if (status) {
      query.status = status;
    }

    const orders = await Order.find(query)
      .populate('items.productId')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const total = await Order.countDocuments(query);

    res.json({
      success: true,
      data: {
        orders,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error: any) {
    console.error('Get orders error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch orders',
    });
  }
};

export const getOrder = async (req: Request, res: Response) => {
  try {
    const userId = req.user.id;
    const { orderId } = req.params;

    const order = await Order.findOne({ _id: orderId, userId })
      .populate('items.productId');

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found',
      });
    }

    res.json({
      success: true,
      data: { order },
    });
  } catch (error: any) {
    console.error('Get order error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch order',
    });
  }
};

export const updateOrderStatus = async (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;
    const { status, reason, trackingId, location } = req.body;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found',
      });
    }

    // Validate status transition
    const validTransitions: Record<string, string[]> = {
      pending: ['confirmed', 'cancelled'],
      confirmed: ['processing', 'cancelled'],
      processing: ['shipped', 'cancelled'],
      shipped: ['delivered'],
      delivered: ['returned'],
      cancelled: [],
      returned: ['refunded'],
      refunded: [],
    };

    if (!validTransitions[order.status]?.includes(status)) {
      return res.status(400).json({
        success: false,
        error: `Invalid status transition from ${order.status} to ${status}`,
      });
    }

    order.updateStatus(status, reason);

    if (trackingId) {
      order.trackingId = trackingId;
    }

    if (status === 'shipped' && location) {
      order.tracking[order.tracking.length - 1].location = location;
    }

    await order.save();

    // Send status update email
    const user = await User.findById(order.userId);
    if (user) {
      await sendOrderEmail(user.email, order, 'status_update');
    }

    res.json({
      success: true,
      data: { order },
    });
  } catch (error: any) {
    console.error('Update order status error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update order status',
    });
  }
};

export const cancelOrder = async (req: Request, res: Response) => {
  try {
    const userId = req.user.id;
    const { orderId } = req.params;
    const { reason } = req.body;

    const order = await Order.findOne({ _id: orderId, userId });
    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found',
      });
    }

    if (!order.canCancel()) {
      return res.status(400).json({
        success: false,
        error: 'Order cannot be cancelled',
      });
    }

    // Update product stock
    for (const item of order.items) {
      await Product.findByIdAndUpdate(
        item.productId,
        { $inc: { 'variants.$[elem].stock': item.quantity } },
        { arrayFilters: [{ 'elem.size': item.size, 'elem.color': item.color }] }
      );
    }

    order.updateStatus('cancelled', reason);
    order.cancellationReason = reason;
    await order.save();

    // Send cancellation email
    const user = await User.findById(userId);
    if (user) {
      await sendOrderEmail(user.email, order, 'cancellation');
    }

    res.json({
      success: true,
      data: { order },
    });
  } catch (error: any) {
    console.error('Cancel order error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to cancel order',
    });
  }
};

export const returnOrder = async (req: Request, res: Response) => {
  try {
    const userId = req.user.id;
    const { orderId } = req.params;
    const { items, refundMethod } = req.body;

    const order = await Order.findOne({ _id: orderId, userId });
    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found',
      });
    }

    if (!order.canReturn()) {
      return res.status(400).json({
        success: false,
        error: 'Order cannot be returned',
      });
    }

    order.returnRequest = {
      status: 'requested',
      items,
      requestedAt: new Date(),
    };

    order.updateStatus('returned', 'Return requested');
    await order.save();

    // Send return request confirmation email
    const user = await User.findById(userId);
    if (user) {
      await sendOrderEmail(user.email, order, 'return_request');
    }

    res.json({
      success: true,
      data: { order },
    });
  } catch (error: any) {
    console.error('Return order error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process return request',
    });
  }
};

export const rateOrder = async (req: Request, res: Response) => {
  try {
    const userId = req.user.id;
    const { orderId } = req.params;
    const { overall, packaging, delivery, productQuality, comment } = req.body;

    const order = await Order.findOne({ _id: orderId, userId });
    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found',
      });
    }

    if (order.status !== 'delivered') {
      return res.status(400).json({
        success: false,
        error: 'Order must be delivered to be rated',
      });
    }

    order.rating = {
      overall,
      packaging,
      delivery,
      productQuality,
      comment,
      ratedAt: new Date(),
    };

    await order.save();

    // Update product ratings
    for (const item of order.items) {
      await Product.findByIdAndUpdate(item.productId, {
        $push: {
          ratings: {
            userId,
            orderId: order._id,
            rating: overall,
            comment,
            createdAt: new Date(),
          },
        },
      });
    }

    res.json({
      success: true,
      data: { order },
    });
  } catch (error: any) {
    console.error('Rate order error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to rate order',
    });
  }
};

export const downloadInvoice = async (req: Request, res: Response) => {
  try {
    const userId = req.user.id;
    const { orderId } = req.params;

    const order = await Order.findOne({ _id: orderId, userId })
      .populate('items.productId')
      .populate('userId');

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found',
      });
    }

    if (order.status !== 'delivered') {
      return res.status(400).json({
        success: false,
        error: 'Invoice available only for delivered orders',
      });
    }

    const pdfBuffer = await generateInvoice(order);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="invoice-${order.orderNumber}.pdf"`);
    res.send(pdfBuffer);
  } catch (error: any) {
    console.error('Download invoice error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate invoice',
    });
  }
};

export const trackOrder = async (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findById(orderId)
      .select('orderNumber status tracking trackingId estimatedDelivery shippingMethod');

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found',
      });
    }

    res.json({
      success: true,
      data: { order },
    });
  } catch (error: any) {
    console.error('Track order error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to track order',
    });
  }
};