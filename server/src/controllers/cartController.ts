import { Response } from 'express';
import { body } from 'express-validator';
import { Cart } from '../models/Cart';
import { Product } from '../models/Product';
import { AuthRequest, asyncHandler, createError } from '../middleware/errorHandler';
import { redisGet, redisSet, redisDel } from '../config/redis';

// Get user's cart
export const getCart = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user.isAuthenticated) {
    throw createError('Authentication required', 401);
  }

  const cacheKey = `cart:${req.user._id}`;
  let cached = await redisGet(cacheKey);

  if (cached) {
    return res.status(200).json({
      success: true,
      data: cached
    });
  }

  const cart = await Cart.findOne({ userId: req.user._id })
    .populate({
      path: 'items.productId',
      select: 'name price discountPrice image brand category'
    })
    .lean();

  if (!cart) {
    // Create new cart if doesn't exist
    const newCart = await Cart.create({ userId: req.user._id });

    const result = {
      items: [],
      totalItems: 0,
      totalPrice: 0,
      totalDiscountPrice: 0,
      lastUpdated: newCart.updatedAt
    };

    await redisSet(cacheKey, result, 300); // Cache for 5 minutes

    return res.status(200).json({
      success: true,
      data: result
    });
  }

  // Calculate totals
  cart.calculateTotals();

  const result = {
    items: cart.items,
    totalItems: cart.totalItems,
    totalPrice: cart.totalPrice,
    totalDiscountPrice: cart.totalDiscountPrice,
    lastUpdated: cart.updatedAt
  };

  await redisSet(cacheKey, result, 300);

  res.status(200).json({
    success: true,
    data: result
  });
});

// Add item to cart
export const addToCart = asyncHandler(async (req: AuthRequest, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      errors: errors.array(),
    });
  }

  if (!req.user.isAuthenticated) {
    throw createError('Authentication required', 401);
  }

  const { productId, size, color, quantity = 1 } = req.body;

  // Validate product exists and get details
  const product = await Product.findById(productId);
  if (!product || !product.isActive) {
    throw createError('Product not found or inactive', 400);
  }

  // Check if size is valid for this product
  if (!product.sizes.includes(size)) {
    throw createError('Invalid size selected', 400);
  }

  // Check if color is valid for this product
  if (!product.colors.some(c => c.name === color)) {
    throw createError('Invalid color selected', 400);
  }

  // Check stock
  const stockQuantity = product.stock.get(size) || 0;
  if (stockQuantity < quantity) {
    throw createError('Insufficient stock', 400);
  }

  // Get product image for selected color
  const colorData = product.colors.find(c => c.name === color);
  const productImage = colorData?.images[0] || product.images[0];

  // Find or create cart
  let cart = await Cart.findOne({ userId: req.user._id });
  if (!cart) {
    cart = await Cart.create({ userId: req.user._id });
  }

  // Add item to cart
  const itemData = {
    productId,
    name: product.name,
    price: product.price,
    discountPrice: product.discountPrice,
    size,
    color,
    quantity: Math.min(quantity, stockQuantity),
    image: productImage,
    maxQuantity: stockQuantity,
    addedAt: new Date()
  };

  cart.addItem(itemData);
  await cart.save();

  // Invalidate cache
  await redisDel(`cart:${req.user._id}`);

  // Return updated cart
  const updatedCart = await Cart.findOne({ userId: req.user._id })
    .populate({
      path: 'items.productId',
      select: 'name price discountPrice image brand category'
    })
    .lean();

  updatedCart.calculateTotals();

  res.status(200).json({
    success: true,
    data: {
      items: updatedCart.items,
      totalItems: updatedCart.totalItems,
      totalPrice: updatedCart.totalPrice,
      totalDiscountPrice: updatedCart.totalDiscountPrice,
      lastUpdated: updatedCart.updatedAt
    },
    message: 'Item added to cart successfully'
  });
});

// Update cart item quantity
export const updateCartItem = asyncHandler(async (req: AuthRequest, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      errors: errors.array(),
    });
  }

  if (!req.user.isAuthenticated) {
    throw createError('Authentication required', 401);
  }

  const { productId, size, color, quantity } = req.body;

  // Find cart
  const cart = await Cart.findOne({ userId: req.user._id });
  if (!cart) {
    throw createError('Cart not found', 404);
  }

  // Validate quantity
  if (quantity < 1) {
    throw createError('Quantity must be at least 1', 400);
  }

  // Update item quantity
  cart.updateItemQuantity(productId, size, color, quantity);
  await cart.save();

  // Invalidate cache
  await redisDel(`cart:${req.user._id}`);

  // Return updated cart
  const updatedCart = await Cart.findOne({ userId: req.user._id })
    .populate({
      path: 'items.productId',
      select: 'name price discountPrice image brand category'
    })
    .lean();

  updatedCart.calculateTotals();

  res.status(200).json({
    success: true,
    data: {
      items: updatedCart.items,
      totalItems: updatedCart.totalItems,
      totalPrice: updatedCart.totalPrice,
      totalDiscountPrice: updatedCart.totalDiscountPrice,
      lastUpdated: updatedCart.updatedAt
    },
    message: 'Cart item updated successfully'
  });
});

// Remove item from cart
export const removeFromCart = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user.isAuthenticated) {
    throw createError('Authentication required', 401);
  }

  const { productId, size, color } = req.body;

  // Find cart
  const cart = await Cart.findOne({ userId: req.user._id });
  if (!cart) {
    throw createError('Cart not found', 404);
  }

  // Remove item
  cart.removeItem(productId, size, color);
  await cart.save();

  // Invalidate cache
  await redisDel(`cart:${req.user._id}`);

  // Return updated cart
  const updatedCart = await Cart.findOne({ userId: req.user._id })
    .populate({
      path: 'items.productId',
      select: 'name price discountPrice image brand category'
    })
    .lean();

  updatedCart.calculateTotals();

  res.status(200).json({
    success: true,
    data: {
      items: updatedCart.items,
      totalItems: updatedCart.totalItems,
      totalPrice: updatedCart.totalPrice,
      totalDiscountPrice: updatedCart.totalDiscountPrice,
      lastUpdated: updatedCart.updatedAt
    },
    message: 'Item removed from cart successfully'
  });
});

// Clear entire cart
export const clearCart = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user.isAuthenticated) {
    throw createError('Authentication required', 401);
  }

  // Find and clear cart
  const cart = await Cart.findOne({ userId: req.user._id });
  if (!cart) {
    throw createError('Cart not found', 404);
  }

  cart.clearItems();
  await cart.save();

  // Invalidate cache
  await redisDel(`cart:${req.user._id}`);

  res.status(200).json({
    success: true,
    data: {
      items: [],
      totalItems: 0,
      totalPrice: 0,
      totalDiscountPrice: 0,
      lastUpdated: new Date()
    },
    message: 'Cart cleared successfully'
  });
});

// Apply coupon code
export const applyCoupon = asyncHandler(async (req: AuthRequest, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      errors: errors.array(),
    });
  }

  if (!req.user.isAuthenticated) {
    throw createError('Authentication required', 401);
  }

  const { couponCode } = req.body;

  // This would integrate with a coupon service
  // For now, return a mock response
  const discountAmount = Math.random() > 0.5 ? 100 : 0; // Mock discount

  // Find cart
  const cart = await Cart.findOne({ userId: req.user._id });
  if (!cart) {
    throw createError('Cart not found', 404);
  }

  // Apply coupon
  cart.couponCode = couponCode;
  cart.discountAmount = discountAmount;
  cart.calculateTotals();
  await cart.save();

  // Invalidate cache
  await redisDel(`cart:${req.user._id}`);

  const result = {
    discountAmount,
    finalPrice: cart.totalPrice - discountAmount
  };

  res.status(200).json({
    success: true,
    data: result,
    message: 'Coupon applied successfully'
  });
});

// Remove coupon
export const removeCoupon = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user.isAuthenticated) {
    throw createError('Authentication required', 401);
  }

  // Find cart
  const cart = await Cart.findOne({ userId: req.user._id });
  if (!cart) {
    throw createError('Cart not found', 404);
  }

  // Remove coupon
  cart.couponCode = undefined;
  cart.discountAmount = 0;
  cart.calculateTotals();
  await cart.save();

  // Invalidate cache
  await redisDel(`cart:${req.user._id}`);

  res.status(200).json({
    success: true,
    message: 'Coupon removed successfully'
  });
});