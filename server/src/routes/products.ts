import express from 'express';
import { query } from 'express-validator';
import { authenticate, optionalAuth } from '../middleware/auth';
import {
  getProducts,
  getProductById,
  searchProducts,
  getFeaturedProducts,
  getNewArrivals,
  getBestSellers,
  getSimilarProducts,
  getProductsByCategory,
  getProductsByBrand,
  getCategories,
  getBrands,
  getProductReviews,
  addProductReview
} from '../controllers/productController';

const router = express.Router();

// Validation middleware
const productsQueryValidation = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('category').optional().trim().isLength({ min: 1, max: 50 }).withMessage('Category must be 1-50 characters'),
  query('brand').optional().trim().isLength({ min: 1, max: 50 }).withMessage('Brand must be 1-50 characters'),
  query('search').optional().trim().isLength({ min: 1, max: 100 }).withMessage('Search query must be 1-100 characters'),
  query('sortBy').optional().isIn(['price', 'popularity', 'newest', 'discount', 'rating']).withMessage('Invalid sort field'),
  query('sortOrder').optional().isIn(['asc', 'desc']).withMessage('Sort order must be asc or desc'),
  query('minPrice').optional().isFloat({ min: 0 }).withMessage('Min price must be a positive number'),
  query('maxPrice').optional().isFloat({ min: 0 }).withMessage('Max price must be a positive number'),
  query('sizes').optional().trim().withMessage('Sizes must be valid'),
  query('colors').optional().trim().withMessage('Colors must be valid'),
];

// Routes
router.get('/', optionalAuth, productsQueryValidation, getProducts);
router.get('/search', optionalAuth, searchProducts);
router.get('/featured', getFeaturedProducts);
router.get('/new-arrivals', getNewArrivals);
router.get('/best-sellers', getBestSellers);
router.get('/categories', getCategories);
router.get('/brands', getBrands);
router.get('/category/:category', optionalAuth, getProductsByCategory);
router.get('/brand/:brand', optionalAuth, getProductsByBrand);
router.get('/:id', optionalAuth, getProductById);
router.get('/:id/similar', optionalAuth, getSimilarProducts);
router.get('/:id/reviews', optionalAuth, getProductReviews);

// Protected routes for reviews
router.post('/:id/reviews', authenticate, addProductReview);

export default router;