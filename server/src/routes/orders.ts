import express from 'express';
import { authenticateToken } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import {
  createOrder,
  getOrders,
  getOrder,
  updateOrderStatus,
  cancelOrder,
  returnOrder,
  rateOrder,
  downloadInvoice,
  trackOrder,
} from '../controllers/orderController';
import { body, param, query } from 'express-validator';

const router = express.Router();

// All order routes require authentication
router.use(authenticateToken);

// Order validation schemas
const createOrderValidation = [
  body('items').isArray({ min: 1 }).withMessage('Items array is required'),
  body('items.*.productId').isMongoId().withMessage('Valid product ID is required'),
  body('items.*.quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
  body('items.*.size').notEmpty().withMessage('Size is required'),
  body('items.*.color').notEmpty().withMessage('Color is required'),
  body('shippingAddress.street').notEmpty().withMessage('Shipping street address is required'),
  body('shippingAddress.city').notEmpty().withMessage('Shipping city is required'),
  body('shippingAddress.state').notEmpty().withMessage('Shipping state is required'),
  body('shippingAddress.pincode').isPostalCode('IN').withMessage('Valid pincode is required'),
  body('paymentInfo.method').isIn(['credit_card', 'debit_card', 'upi', 'net_banking', 'cod', 'wallet']).withMessage('Valid payment method is required'),
  body('shippingMethod.name').notEmpty().withMessage('Shipping method name is required'),
  body('shippingMethod.price').isFloat({ min: 0 }).withMessage('Shipping price must be non-negative'),
  body('shippingMethod.estimatedDays').isInt({ min: 1 }).withMessage('Estimated days must be at least 1'),
];

const updateStatusValidation = [
  param('orderId').isMongoId().withMessage('Valid order ID is required'),
  body('status').isIn(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'returned', 'refunded']).withMessage('Valid status is required'),
  body('reason').optional().isString().withMessage('Reason must be a string'),
];

const returnOrderValidation = [
  param('orderId').isMongoId().withMessage('Valid order ID is required'),
  body('items').isArray({ min: 1 }).withMessage('Items array is required'),
  body('items.*.productId').isMongoId().withMessage('Valid product ID is required'),
  body('items.*.reason').notEmpty().withMessage('Return reason is required'),
  body('refundMethod').isIn(['original', 'store_credit', 'bank_transfer']).withMessage('Valid refund method is required'),
];

const rateOrderValidation = [
  param('orderId').isMongoId().withMessage('Valid order ID is required'),
  body('overall').isInt({ min: 1, max: 5 }).withMessage('Overall rating must be between 1 and 5'),
  body('packaging').optional().isInt({ min: 1, max: 5 }).withMessage('Packaging rating must be between 1 and 5'),
  body('delivery').optional().isInt({ min: 1, max: 5 }).withMessage('Delivery rating must be between 1 and 5'),
  body('productQuality').optional().isInt({ min: 1, max: 5 }).withMessage('Product quality rating must be between 1 and 5'),
  body('comment').optional().isString().withMessage('Comment must be a string'),
];

// Routes
router.post('/', validateRequest(createOrderValidation), createOrder);

router.get('/', validateRequest([
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('status').optional().isIn(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'returned', 'refunded']).withMessage('Valid status is required'),
]), getOrders);

router.get('/:orderId', validateRequest([
  param('orderId').isMongoId().withMessage('Valid order ID is required'),
]), getOrder);

router.put('/:orderId/status', validateRequest(updateStatusValidation), updateOrderStatus);

router.post('/:orderId/cancel', validateRequest([
  param('orderId').isMongoId().withMessage('Valid order ID is required'),
  body('reason').notEmpty().withMessage('Cancellation reason is required'),
]), cancelOrder);

router.post('/:orderId/return', validateRequest(returnOrderValidation), returnOrder);

router.post('/:orderId/rate', validateRequest(rateOrderValidation), rateOrder);

router.get('/:orderId/invoice', validateRequest([
  param('orderId').isMongoId().withMessage('Valid order ID is required'),
]), downloadInvoice);

router.get('/track/:orderId', validateRequest([
  param('orderId').isMongoId().withMessage('Valid order ID is required'),
]), trackOrder);

export default router;