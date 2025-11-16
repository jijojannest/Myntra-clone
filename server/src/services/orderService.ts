import puppeteer from 'puppeteer';
import handlebars from 'handlebars';
import fs from 'fs/promises';
import path from 'path';
import { IOrder } from '../models/Order';
import { sendEmail } from './emailService';

export const generateInvoice = async (order: IOrder): Promise<Buffer> => {
  try {
    // Read HTML template
    const templatePath = path.join(__dirname, '../templates/invoice.html');
    const template = await fs.readFile(templatePath, 'utf-8');

    // Compile template with order data
    const compiledTemplate = handlebars.compile(template);
    const html = compiledTemplate({
      order: order.toJSON(),
      company: {
        name: 'Myntra Clone',
        address: '123 Fashion Street, Mumbai, India',
        email: 'support@myntraclone.com',
        phone: '+91-9876543210',
        gst: '27AAAPL1234C1ZV',
      },
      date: new Date().toLocaleDateString('en-IN'),
    });

    // Generate PDF
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20mm',
        right: '20mm',
        bottom: '20mm',
        left: '20mm',
      },
    });

    await browser.close();
    return pdfBuffer;
  } catch (error) {
    console.error('Invoice generation error:', error);
    throw new Error('Failed to generate invoice');
  }
};

export const sendOrderEmail = async (email: string, order: IOrder, type: 'confirmation' | 'status_update' | 'cancellation' | 'return_request') => {
  const templates = {
    confirmation: {
      subject: `Order Confirmation - ${order.orderNumber}`,
      template: 'order-confirmation',
    },
    status_update: {
      subject: `Order Status Update - ${order.orderNumber}`,
      template: 'order-status-update',
    },
    cancellation: {
      subject: `Order Cancelled - ${order.orderNumber}`,
      template: 'order-cancellation',
    },
    return_request: {
      subject: `Return Request Received - ${order.orderNumber}`,
      template: 'return-request',
    },
  };

  const emailConfig = templates[type];

  await sendEmail({
    to: email,
    subject: emailConfig.subject,
    template: emailConfig.template,
    data: {
      order: order.toJSON(),
      customerName: order.userId as any, // Would be populated in actual implementation
      companyName: 'Myntra Clone',
    },
  });
};

export const calculateShippingCost = (weight: number, distance: number, method: string): number => {
  const baseRates = {
    standard: 40,
    express: 80,
    premium: 120,
  };

  const weightRate = Math.ceil(weight / 500) * 10; // per 500g
  const distanceRate = Math.ceil(distance / 100) * 5; // per 100km

  return baseRates[method as keyof typeof baseRates] + weightRate + distanceRate;
};

export const generateTrackingNumber = (): string => {
  const prefix = 'MYN';
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${prefix}${timestamp}${random}`;
};

export const estimateDeliveryDate = (shippingMethod: string, pincode: string): Date => {
  const baseDays = {
    standard: 5,
    express: 2,
    premium: 1,
  };

  const metros = ['400001', '110001', '560001', '600001', '700001', '500001', '380001', '411001'];
  const additionalDays = metros.includes(pincode.substring(0, 6)) ? 0 : 2;

  const totalDays = baseDays[shippingMethod as keyof typeof baseDays] + additionalDays;
  return new Date(Date.now() + totalDays * 24 * 60 * 60 * 1000);
};

export const validatePincodeServiceability = async (pincode: string): Promise<{ serviceable: boolean; estimatedDays: number }> => {
  // In a real implementation, this would check with shipping partners
  // For now, we'll simulate the check

  const nonServiceablePincodes = ['999999'];

  if (nonServiceablePincodes.includes(pincode)) {
    return { serviceable: false, estimatedDays: 0 };
  }

  // Simulate different delivery times based on pincode ranges
  const metroPincodes = ['400', '110', '560', '600', '700', '500', '380', '411'];
  const isMetro = metroPincodes.some(code => pincode.startsWith(code));

  const estimatedDays = isMetro ? 2 : 5;

  return { serviceable: true, estimatedDays };
};

export const processRefund = async (order: IOrder, refundMethod: string): Promise<{ success: boolean; refundId?: string; error?: string }> => {
  try {
    // In a real implementation, this would integrate with payment gateways
    const refundAmount = order.calculateRefundAmount();

    // Simulate refund processing
    const refundId = `REF${Date.now()}`;

    // Update payment status
    order.paymentInfo.status = 'refunded';
    await order.save();

    return {
      success: true,
      refundId,
    };
  } catch (error) {
    console.error('Refund processing error:', error);
    return {
      success: false,
      error: 'Failed to process refund',
    };
  }
};

export const schedulePickup = async (order: IOrder, pickupAddress: any): Promise<{ success: boolean; pickupId?: string; scheduledDate?: Date }> => {
  try {
    // In a real implementation, this would integrate with logistics partners
    const pickupId = `PK${Date.now()}`;
    const scheduledDate = new Date(Date.now() + 24 * 60 * 60 * 1000); // Next day

    return {
      success: true,
      pickupId,
      scheduledDate,
    };
  } catch (error) {
    console.error('Pickup scheduling error:', error);
    return {
      success: false,
    };
  }
};

export const updateInventory = async (items: any[], operation: 'deduct' | 'restore'): Promise<void> => {
  const Product = require('../models/Product').Product;

  for (const item of items) {
    const updateAmount = operation === 'deduct' ? -item.quantity : item.quantity;

    await Product.findByIdAndUpdate(
      item.productId,
      { $inc: { 'variants.$[elem].stock': updateAmount } },
      {
        arrayFilters: [{ 'elem.size': item.size, 'elem.color': item.color }],
        new: true,
      }
    );
  }
};

export const generateOrderAnalytics = async (userId?: string, startDate?: Date, endDate?: Date): Promise<any> => {
  const Order = require('../models/Order').Order;
  const matchStage: any = {};

  if (userId) {
    matchStage.userId = new mongoose.Types.ObjectId(userId);
  }

  if (startDate || endDate) {
    matchStage.createdAt = {};
    if (startDate) matchStage.createdAt.$gte = startDate;
    if (endDate) matchStage.createdAt.$lte = endDate;
  }

  const analytics = await Order.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: null,
        totalOrders: { $sum: 1 },
        totalRevenue: { $sum: '$pricing.total' },
        averageOrderValue: { $avg: '$pricing.total' },
        ordersByStatus: {
          $push: {
            status: '$status',
            count: 1,
          },
        },
        paymentMethods: {
          $push: {
            method: '$paymentInfo.method',
            count: 1,
          },
        },
      },
    },
    {
      $project: {
        _id: 0,
        totalOrders: 1,
        totalRevenue: 1,
        averageOrderValue: 1,
        ordersByStatus: {
          $arrayToObject: {
            $map: {
              input: { $setUnion: ['$ordersByStatus.status', []] },
              as: 'status',
              in: {
                k: '$$status',
                v: {
                  $size: {
                    $filter: {
                      input: '$ordersByStatus',
                      cond: { $eq: ['$$this.status', '$$status'] },
                    },
                  },
                },
              },
            },
          },
        },
        paymentMethods: {
          $arrayToObject: {
            $map: {
              input: { $setUnion: ['$paymentMethods.method', []] },
              as: 'method',
              in: {
                k: '$$method',
                v: {
                  $size: {
                    $filter: {
                      input: '$paymentMethods',
                      cond: { $eq: ['$$this.method', '$$method'] },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  ]);

  return analytics[0] || {
    totalOrders: 0,
    totalRevenue: 0,
    averageOrderValue: 0,
    ordersByStatus: {},
    paymentMethods: {},
  };
};