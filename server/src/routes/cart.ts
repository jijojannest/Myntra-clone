import express from 'express';
import { body } from 'express-validator';
import { authenticate } from '../middleware/auth';
import {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
  applyCoupon,
  removeCoupon
} from '../controllers/cartController';

const router = express.Router();

// All cart routes require authentication
router.use(authenticate);

// Validation middleware
const cartItemValidation = [
  body('productId').notEmpty().withMessage('Product ID is required'),
  body('size').notEmpty().withMessage('Size is required'),
  body('color').notEmpty().withMessage('Color is required'),
  body('quantity').isInt({ min: 1, max: 10 }).withMessage('Quantity must be between 1 and 10'),
];

const cartUpdateValidation = [
  body('productId').notEmpty().withMessage('Product ID is required'),
  body('size').notEmpty().withMessage('Size is required'),
  body('color').notEmpty().withMessage('Color is required'),
  body('quantity').isInt({ min: 1, max: 10 }).withMessage('Quantity must be between 1 and 10'),
];

const couponValidation = [
  body('couponCode').optional().trim().isLength({ min: 1, max: 20 }).withMessage('Coupon code must be 1-20 characters'),
];

// Routes
router.get('/', getCart);
router.post('/add', cartItemValidation, addToCart);
router.put('/update', cartUpdateValidation, updateCartItem);
router.delete('/remove/:itemId', removeFromCart);
router.delete('/clear', clearCart);
router.post('/apply-coupon', couponValidation, applyCoupon);
router.delete('/remove-coupon', removeCoupon);

export default router;