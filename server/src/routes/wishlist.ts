import express from 'express';
import { authenticateToken } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  updateWishlistItem,
  moveWishlistToCart,
  clearWishlist,
  shareWishlist,
  getSharedWishlist,
} from '../controllers/wishlistController';
import { body, param, query } from 'express-validator';

const router = express.Router();

// All wishlist routes require authentication except shared wishlist
router.use(authenticateToken);

// Validation schemas
const addToWishlistValidation = [
  body('productId').isMongoId().withMessage('Valid product ID is required'),
  body('size').optional().isString().withMessage('Size must be a string'),
  body('color').optional().isString().withMessage('Color must be a string'),
];

const updateWishlistItemValidation = [
  param('productId').isMongoId().withMessage('Valid product ID is required'),
  body('size').optional().isString().withMessage('Size must be a string'),
  body('color').optional().isString().withMessage('Color must be a string'),
];

const moveToCartValidation = [
  param('productId').isMongoId().withMessage('Valid product ID is required'),
  body('quantity').optional().isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
];

// Routes
router.get('/', validateRequest([
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
]), getWishlist);

router.post('/', validateRequest(addToWishlistValidation), addToWishlist);

router.delete('/:productId', validateRequest([
  param('productId').isMongoId().withMessage('Valid product ID is required'),
]), removeFromWishlist);

router.put('/:productId', validateRequest(updateWishlistItemValidation), updateWishlistItem);

router.post('/:productId/move-to-cart', validateRequest(moveToCartValidation), moveWishlistToCart);

router.delete('/clear/all', clearWishlist);

router.post('/share', shareWishlist);

// Public route for shared wishlist (no authentication required)
router.get('/shared/:shareToken', validateRequest([
  param('shareToken').isLength({ min: 10 }).withMessage('Invalid share token'),
]), getSharedWishlist);

export default router;