import { Request, Response } from 'express';
import { User } from '../models/User';
import { Product } from '../models/Product';
import { Order } from '../models/Order';
import { Coupon } from '../models/Coupon';
import { Category } from '../models/Category';
import { redis } from '../config/redis';
import mongoose from 'mongoose';

// Dashboard Analytics
export const getDashboardStats = async (req: Request, res: Response) => {
  try {
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
    const lastYear = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());

    // Get counts
    const [
      totalUsers,
      totalProducts,
      totalOrders,
      totalRevenue,
      newUsersThisMonth,
      ordersThisMonth,
      revenueThisMonth,
      topProducts,
      topCategories,
      recentOrders,
      lowStockProducts,
    ] = await Promise.all([
      User.countDocuments(),
      Product.countDocuments(),
      Order.countDocuments(),
      Order.aggregate([
        { $match: { status: { $ne: 'cancelled' } } },
        { $group: { _id: null, total: { $sum: '$pricing.total' } } }
      ]),
      User.countDocuments({ createdAt: { $gte: lastMonth } }),
      Order.countDocuments({ createdAt: { $gte: lastMonth } }),
      Order.aggregate([
        { $match: { createdAt: { $gte: lastMonth }, status: { $ne: 'cancelled' } } },
        { $group: { _id: null, total: { $sum: '$pricing.total' } } }
      ]),
      Order.aggregate([
        { $match: { status: { $ne: 'cancelled' } } },
        { $unwind: '$items' },
        { $group: { _id: '$items.productId', count: { $sum: '$items.quantity' }, name: { $first: '$items.name' } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
        { $lookup: { from: 'products', localField: '_id', foreignField: '_id', as: 'product' } }
      ]),
      Product.aggregate([
        { $group: { _id: '$category', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 }
      ]),
      Order.find()
        .populate('userId', 'name email')
        .sort({ createdAt: -1 })
        .limit(10)
        .lean(),
      Product.find({ 'variants.stock': { $lt: 10 } })
        .select('name brand variants.stock images')
        .limit(20)
        .lean(),
    ]);

    const stats = {
      overview: {
        totalUsers,
        totalProducts,
        totalOrders,
        totalRevenue: totalRevenue[0]?.total || 0,
        newUsersThisMonth,
        ordersThisMonth,
        revenueThisMonth: revenueThisMonth[0]?.total || 0,
      },
      topProducts: topProducts.map((item: any) => ({
        productId: item._id,
        name: item.name,
        sales: item.count,
        product: item.product[0],
      })),
      topCategories,
      recentOrders,
      lowStockProducts,
    };

    // Cache dashboard stats for 5 minutes
    await redis.setex('admin:dashboard:stats', 300, JSON.stringify(stats));

    res.json({
      success: true,
      data: stats,
    });
  } catch (error: any) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch dashboard stats',
    });
  }
};

// Product Management
export const getProductsForAdmin = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const search = req.query.search as string;
    const category = req.query.category as string;
    const status = req.query.status as string;
    const sortBy = req.query.sortBy as string || 'createdAt';
    const sortOrder = req.query.sortOrder as string || 'desc';

    const query: any = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { brand: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    if (category) {
      query.category = category;
    }

    if (status === 'inStock') {
      query['variants.stock'] = { $gt: 0 };
    } else if (status === 'outOfStock') {
      query['variants.stock'] = { $lte: 0 };
    }

    const products = await Product.find(query)
      .sort({ [sortBy]: sortOrder === 'asc' ? 1 : -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('category', 'name');

    const total = await Product.countDocuments(query);

    res.json({
      success: true,
      data: {
        products,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error: any) {
    console.error('Get admin products error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch products',
    });
  }
};

export const createProduct = async (req: Request, res: Response) => {
  try {
    const productData = req.body;

    const product = new Product(productData);
    await product.save();

    // Clear products cache
    const keys = await redis.keys('products:*');
    if (keys.length > 0) {
      await redis.del(...keys);
    }

    res.status(201).json({
      success: true,
      data: {
        product: await product.populate('category'),
        message: 'Product created successfully',
      },
    });
  } catch (error: any) {
    console.error('Create product error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create product',
    });
  }
};

export const updateProduct = async (req: Request, res: Response) => {
  try {
    const { productId } = req.params;
    const updates = req.body;

    const product = await Product.findByIdAndUpdate(
      productId,
      updates,
      { new: true, runValidators: true }
    ).populate('category');

    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found',
      });
    }

    // Clear products cache
    const keys = await redis.keys('products:*');
    if (keys.length > 0) {
      await redis.del(...keys);
    }

    res.json({
      success: true,
      data: {
        product,
        message: 'Product updated successfully',
      },
    });
  } catch (error: any) {
    console.error('Update product error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update product',
    });
  }
};

export const deleteProduct = async (req: Request, res: Response) => {
  try {
    const { productId } = req.params;

    const product = await Product.findByIdAndDelete(productId);

    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found',
      });
    }

    // Clear products cache
    const keys = await redis.keys('products:*');
    if (keys.length > 0) {
      await redis.del(...keys);
    }

    res.json({
      success: true,
      data: {
        message: 'Product deleted successfully',
      },
    });
  } catch (error: any) {
    console.error('Delete product error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete product',
    });
  }
};

// Order Management
export const getOrdersForAdmin = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const status = req.query.status as string;
    const search = req.query.search as string;

    const query: any = {};

    if (status) {
      query.status = status;
    }

    if (search) {
      query.$or = [
        { orderNumber: { $regex: search, $options: 'i' } },
        { 'shippingAddress.email': { $regex: search, $options: 'i' } },
      ];
    }

    const orders = await Order.find(query)
      .populate('userId', 'name email')
      .populate('items.productId', 'name images')
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
    console.error('Get admin orders error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch orders',
    });
  }
};

export const updateOrderStatusAdmin = async (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;
    const { status, trackingId, location, note } = req.body;

    const order = await Order.findById(orderId).populate('userId');

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found',
      });
    }

    order.updateStatus(status, note);

    if (trackingId) {
      order.trackingId = trackingId;
    }

    if (status === 'shipped' && location) {
      order.tracking[order.tracking.length - 1].location = location;
    }

    await order.save();

    // Send status update notification
    // In a real app, this would send email/SMS
    console.log(`Order ${order.orderNumber} status updated to ${status}`);

    res.json({
      success: true,
      data: {
        order,
        message: 'Order status updated successfully',
      },
    });
  } catch (error: any) {
    console.error('Update order status admin error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update order status',
    });
  }
};

// User Management
export const getUsersForAdmin = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const search = req.query.search as string;
    const status = req.query.status as string;

    const query: any = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    if (status === 'active') {
      query.isActive = true;
    } else if (status === 'inactive') {
      query.isActive = false;
    }

    const users = await User.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .select('-password');

    const total = await User.countDocuments(query);

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error: any) {
    console.error('Get admin users error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch users',
    });
  }
};

export const updateUserStatus = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { isActive, reason } = req.body;

    const user = await User.findByIdAndUpdate(
      userId,
      { isActive, deactivationReason: reason },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    res.json({
      success: true,
      data: {
        user,
        message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
      },
    });
  } catch (error: any) {
    console.error('Update user status error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update user status',
    });
  }
};

// Category Management
export const getCategoriesForAdmin = async (req: Request, res: Response) => {
  try {
    const categories = await Category.find()
      .sort({ name: 1 });

    res.json({
      success: true,
      data: { categories },
    });
  } catch (error: any) {
    console.error('Get admin categories error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch categories',
    });
  }
};

export const createCategory = async (req: Request, res: Response) => {
  try {
    const categoryData = req.body;

    const category = new Category(categoryData);
    await category.save();

    res.status(201).json({
      success: true,
      data: {
        category,
        message: 'Category created successfully',
      },
    });
  } catch (error: any) {
    console.error('Create category error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create category',
    });
  }
};

export const updateCategory = async (req: Request, res: Response) => {
  try {
    const { categoryId } = req.params;
    const updates = req.body;

    const category = await Category.findByIdAndUpdate(
      categoryId,
      updates,
      { new: true, runValidators: true }
    );

    if (!category) {
      return res.status(404).json({
        success: false,
        error: 'Category not found',
      });
    }

    res.json({
      success: true,
      data: {
        category,
        message: 'Category updated successfully',
      },
    });
  } catch (error: any) {
    console.error('Update category error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update category',
    });
  }
};

export const deleteCategory = async (req: Request, res: Response) => {
  try {
    const { categoryId } = req.params;

    // Check if category has products
    const productCount = await Product.countDocuments({ category: categoryId });
    if (productCount > 0) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete category with existing products',
      });
    }

    const category = await Category.findByIdAndDelete(categoryId);

    if (!category) {
      return res.status(404).json({
        success: false,
        error: 'Category not found',
      });
    }

    res.json({
      success: true,
      data: {
        message: 'Category deleted successfully',
      },
    });
  } catch (error: any) {
    console.error('Delete category error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete category',
    });
  }
};

// Coupon Management
export const getCouponsForAdmin = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const status = req.query.status as string;

    const query: any = {};

    if (status === 'active') {
      query.isActive = true;
    } else if (status === 'inactive') {
      query.isActive = false;
    } else if (status === 'expired') {
      query.endDate = { $lt: new Date() };
    }

    const coupons = await Coupon.find(query)
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const total = await Coupon.countDocuments(query);

    res.json({
      success: true,
      data: {
        coupons,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error: any) {
    console.error('Get admin coupons error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch coupons',
    });
  }
};

export const createCoupon = async (req: Request, res: Response) => {
  try {
    const couponData = {
      ...req.body,
      createdBy: req.user.id,
    };

    const coupon = new Coupon(couponData);
    await coupon.save();

    res.status(201).json({
      success: true,
      data: {
        coupon: await coupon.populate('createdBy', 'name email'),
        message: 'Coupon created successfully',
      },
    });
  } catch (error: any) {
    console.error('Create coupon error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create coupon',
    });
  }
};

export const updateCoupon = async (req: Request, res: Response) => {
  try {
    const { couponId } = req.params;
    const updates = req.body;

    const coupon = await Coupon.findByIdAndUpdate(
      couponId,
      updates,
      { new: true, runValidators: true }
    ).populate('createdBy', 'name email');

    if (!coupon) {
      return res.status(404).json({
        success: false,
        error: 'Coupon not found',
      });
    }

    res.json({
      success: true,
      data: {
        coupon,
        message: 'Coupon updated successfully',
      },
    });
  } catch (error: any) {
    console.error('Update coupon error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update coupon',
    });
  }
};

export const deleteCoupon = async (req: Request, res: Response) => {
  try {
    const { couponId } = req.params;

    const coupon = await Coupon.findByIdAndDelete(couponId);

    if (!coupon) {
      return res.status(404).json({
        success: false,
        error: 'Coupon not found',
      });
    }

    res.json({
      success: true,
      data: {
        message: 'Coupon deleted successfully',
      },
    });
  } catch (error: any) {
    console.error('Delete coupon error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete coupon',
    });
  }
};