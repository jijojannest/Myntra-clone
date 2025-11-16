import express from 'express';
import { authenticateToken } from '../middleware/auth';
import { requireAdmin, requirePermission } from '../middleware/adminAuth';
import { validateRequest } from '../middleware/validation';
import {
  getDashboardStats,
  getProductsForAdmin,
  createProduct,
  updateProduct,
  deleteProduct,
  getOrdersForAdmin,
  updateOrderStatusAdmin,
  getUsersForAdmin,
  updateUserStatus,
  getCategoriesForAdmin,
  createCategory,
  updateCategory,
  deleteCategory,
  getCouponsForAdmin,
  createCoupon,
  updateCoupon,
  deleteCoupon,
} from '../controllers/adminController';
import { body, param, query } from 'express-validator';

const router = express.Router();

// All admin routes require authentication and admin role
router.use(authenticateToken);
router.use(requireAdmin);

// Dashboard
router.get('/dashboard/stats', getDashboardStats);

// Products
router.get('/products', requirePermission('read:products'), validateRequest([
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('search').optional().isString().withMessage('Search must be a string'),
  query('category').optional().isString().withMessage('Category must be a string'),
  query('status').optional().isIn(['inStock', 'outOfStock']).withMessage('Invalid status'),
  query('sortBy').optional().isString().withMessage('Sort by must be a string'),
  query('sortOrder').optional().isIn(['asc', 'desc']).withMessage('Sort order must be asc or desc'),
]), getProductsForAdmin);

router.post('/products', requirePermission('write:products'), validateRequest([
  body('name').notEmpty().withMessage('Product name is required'),
  body('brand').notEmpty().withMessage('Brand is required'),
  body('category').isMongoId().withMessage('Valid category ID is required'),
  body('description').notEmpty().withMessage('Description is required'),
  body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('variants').isArray({ min: 1 }).withMessage('At least one variant is required'),
  body('variants.*.size').notEmpty().withMessage('Variant size is required'),
  body('variants.*.color').notEmpty().withMessage('Variant color is required'),
  body('variants.*.stock').isInt({ min: 0 }).withMessage('Stock must be a non-negative integer'),
  body('images').isArray({ min: 1 }).withMessage('At least one image is required'),
  body('images.*.url').isURL().withMessage('Image must be a valid URL'),
  body('images.*.alt').optional().isString().withMessage('Image alt text must be a string'),
]), createProduct);

router.put('/products/:productId', requirePermission('write:products'), validateRequest([
  param('productId').isMongoId().withMessage('Valid product ID is required'),
  body('name').optional().notEmpty().withMessage('Product name cannot be empty'),
  body('brand').optional().notEmpty().withMessage('Brand cannot be empty'),
  body('category').optional().isMongoId().withMessage('Valid category ID is required'),
  body('description').optional().notEmpty().withMessage('Description cannot be empty'),
  body('price').optional().isFloat({ min: 0 }).withMessage('Price must be a positive number'),
]), updateProduct);

router.delete('/products/:productId', requirePermission('delete:products'), validateRequest([
  param('productId').isMongoId().withMessage('Valid product ID is required'),
]), deleteProduct);

// Orders
router.get('/orders', requirePermission('read:orders'), validateRequest([
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('status').optional().isIn(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'returned', 'refunded']).withMessage('Invalid status'),
  query('search').optional().isString().withMessage('Search must be a string'),
]), getOrdersForAdmin);

router.put('/orders/:orderId/status', requirePermission('write:orders'), validateRequest([
  param('orderId').isMongoId().withMessage('Valid order ID is required'),
  body('status').isIn(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'returned', 'refunded']).withMessage('Valid status is required'),
  body('trackingId').optional().isString().withMessage('Tracking ID must be a string'),
  body('location').optional().isString().withMessage('Location must be a string'),
  body('note').optional().isString().withMessage('Note must be a string'),
]), updateOrderStatusAdmin);

// Users
router.get('/users', requirePermission('read:users'), validateRequest([
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('search').optional().isString().withMessage('Search must be a string'),
  query('status').optional().isIn(['active', 'inactive']).withMessage('Invalid status'),
]), getUsersForAdmin);

router.put('/users/:userId/status', requirePermission('write:users'), validateRequest([
  param('userId').isMongoId().withMessage('Valid user ID is required'),
  body('isActive').isBoolean().withMessage('isActive must be a boolean'),
  body('reason').optional().isString().withMessage('Reason must be a string'),
]), updateUserStatus);

// Categories
router.get('/categories', requirePermission('read:categories'), getCategoriesForAdmin);

router.post('/categories', requirePermission('write:categories'), validateRequest([
  body('name').notEmpty().withMessage('Category name is required'),
  body('description').optional().isString().withMessage('Description must be a string'),
  body('image').optional().isURL().withMessage('Image must be a valid URL'),
  body('parentCategory').optional().isMongoId().withMessage('Parent category must be a valid ID'),
  body('isActive').optional().isBoolean().withMessage('isActive must be a boolean'),
]), createCategory);

router.put('/categories/:categoryId', requirePermission('write:categories'), validateRequest([
  param('categoryId').isMongoId().withMessage('Valid category ID is required'),
  body('name').optional().notEmpty().withMessage('Category name cannot be empty'),
  body('description').optional().isString().withMessage('Description must be a string'),
  body('image').optional().isURL().withMessage('Image must be a valid URL'),
]), updateCategory);

router.delete('/categories/:categoryId', requirePermission('delete:categories'), validateRequest([
  param('categoryId').isMongoId().withMessage('Valid category ID is required'),
]), deleteCategory);

// Coupons
router.get('/coupons', requirePermission('read:coupons'), validateRequest([
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('status').optional().isIn(['active', 'inactive', 'expired']).withMessage('Invalid status'),
]), getCouponsForAdmin);

router.post('/coupons', requirePermission('write:coupons'), validateRequest([
  body('code').notEmpty().withMessage('Coupon code is required'),
  body('name').notEmpty().withMessage('Coupon name is required'),
  body('discountType').isIn(['percentage', 'fixed']).withMessage('Discount type must be percentage or fixed'),
  body('discount').isFloat({ min: 0 }).withMessage('Discount must be a positive number'),
  body('minAmount').isFloat({ min: 0 }).withMessage('Minimum amount must be a positive number'),
  body('userUsageLimit').isInt({ min: 1 }).withMessage('User usage limit must be at least 1'),
  body('globalUsageLimit').isInt({ min: 1 }).withMessage('Global usage limit must be at least 1'),
  body('startDate').isISO8601().withMessage('Valid start date is required'),
  body('endDate').isISO8601().withMessage('Valid end date is required'),
]), createCoupon);

router.put('/coupons/:couponId', requirePermission('write:coupons'), validateRequest([
  param('couponId').isMongoId().withMessage('Valid coupon ID is required'),
  body('code').optional().notEmpty().withMessage('Coupon code cannot be empty'),
  body('name').optional().notEmpty().withMessage('Coupon name cannot be empty'),
  body('discountType').optional().isIn(['percentage', 'fixed']).withMessage('Discount type must be percentage or fixed'),
]), updateCoupon);

router.delete('/coupons/:couponId', requirePermission('delete:coupons'), validateRequest([
  param('couponId').isMongoId().withMessage('Valid coupon ID is required'),
]), deleteCoupon);

export default router;