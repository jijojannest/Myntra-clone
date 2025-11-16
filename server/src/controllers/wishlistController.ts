import { Request, Response } from 'express';
import { Wishlist } from '../models/Wishlist';
import { Product } from '../models/Product';
import { redis } from '../config/redis';

export const getWishlist = async (req: Request, res: Response) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const cacheKey = `wishlist:${userId}:${page}:${limit}`;
    const cached = await redis.get(cacheKey);

    if (cached) {
      return res.json({
        success: true,
        data: JSON.parse(cached),
      });
    }

    const wishlist = await Wishlist.findOne({ userId })
      .populate({
        path: 'items.productId',
        select: 'name price discountPrice images brand category ratings ratingAverage stock',
      })
      .lean();

    if (!wishlist || wishlist.items.length === 0) {
      return res.json({
        success: true,
        data: {
          items: [],
          pagination: {
            page,
            limit,
            total: 0,
            pages: 0,
          },
        },
      });
    }

    // Filter out products that no longer exist
    const validItems = wishlist.items.filter(item => item.productId);

    // Update wishlist if any items were removed
    if (validItems.length !== wishlist.items.length) {
      await Wishlist.findOneAndUpdate(
        { userId },
        { items: validItems.map(item => ({ productId: item.productId._id })) },
        { new: true }
      );
    }

    const startIndex = (page - 1) * limit;
    const paginatedItems = validItems.slice(startIndex, startIndex + limit);

    const response = {
      items: paginatedItems,
      pagination: {
        page,
        limit,
        total: validItems.length,
        pages: Math.ceil(validItems.length / limit),
      },
    };

    // Cache for 15 minutes
    await redis.setex(cacheKey, 900, JSON.stringify(response));

    res.json({
      success: true,
      data: response,
    });
  } catch (error: any) {
    console.error('Get wishlist error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch wishlist',
    });
  }
};

export const addToWishlist = async (req: Request, res: Response) => {
  try {
    const userId = req.user.id;
    const { productId, size, color } = req.body;

    if (!productId) {
      return res.status(400).json({
        success: false,
        error: 'Product ID is required',
      });
    }

    // Check if product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found',
      });
    }

    // Find or create wishlist
    let wishlist = await Wishlist.findOne({ userId });

    if (!wishlist) {
      wishlist = new Wishlist({ userId, items: [] });
    }

    // Check if item already exists
    const existingItem = wishlist.items.find(
      item => item.productId.toString() === productId.toString()
    );

    if (existingItem) {
      return res.status(400).json({
        success: false,
        error: 'Product already in wishlist',
      });
    }

    // Add item to wishlist
    wishlist.items.push({
      productId,
      size: size || product.variants[0]?.size || 'M',
      color: color || product.variants[0]?.color || 'Default',
      addedAt: new Date(),
    });

    await wishlist.save();

    // Clear wishlist cache
    const keys = await redis.keys(`wishlist:${userId}:*`);
    if (keys.length > 0) {
      await redis.del(...keys);
    }

    res.status(201).json({
      success: true,
      data: {
        message: 'Product added to wishlist',
        item: {
          productId,
          size: size || product.variants[0]?.size || 'M',
          color: color || product.variants[0]?.color || 'Default',
        },
      },
    });
  } catch (error: any) {
    console.error('Add to wishlist error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add product to wishlist',
    });
  }
};

export const removeFromWishlist = async (req: Request, res: Response) => {
  try {
    const userId = req.user.id;
    const { productId } = req.params;

    const wishlist = await Wishlist.findOne({ userId });

    if (!wishlist) {
      return res.status(404).json({
        success: false,
        error: 'Wishlist not found',
      });
    }

    const initialLength = wishlist.items.length;
    wishlist.items = wishlist.items.filter(
      item => item.productId.toString() !== productId
    );

    if (wishlist.items.length === initialLength) {
      return res.status(404).json({
        success: false,
        error: 'Product not found in wishlist',
      });
    }

    await wishlist.save();

    // Clear wishlist cache
    const keys = await redis.keys(`wishlist:${userId}:*`);
    if (keys.length > 0) {
      await redis.del(...keys);
    }

    res.json({
      success: true,
      data: {
        message: 'Product removed from wishlist',
      },
    });
  } catch (error: any) {
    console.error('Remove from wishlist error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to remove product from wishlist',
    });
  }
};

export const updateWishlistItem = async (req: Request, res: Response) => {
  try {
    const userId = req.user.id;
    const { productId } = req.params;
    const { size, color } = req.body;

    const wishlist = await Wishlist.findOne({ userId });

    if (!wishlist) {
      return res.status(404).json({
        success: false,
        error: 'Wishlist not found',
      });
    }

    const item = wishlist.items.find(
      item => item.productId.toString() === productId
    );

    if (!item) {
      return res.status(404).json({
        success: false,
        error: 'Product not found in wishlist',
      });
    }

    // Update size and color
    if (size) item.size = size;
    if (color) item.color = color;
    item.updatedAt = new Date();

    await wishlist.save();

    // Clear wishlist cache
    const keys = await redis.keys(`wishlist:${userId}:*`);
    if (keys.length > 0) {
      await redis.del(...keys);
    }

    res.json({
      success: true,
      data: {
        message: 'Wishlist item updated',
        item: {
          productId,
          size: item.size,
          color: item.color,
        },
      },
    });
  } catch (error: any) {
    console.error('Update wishlist item error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update wishlist item',
    });
  }
};

export const moveWishlistToCart = async (req: Request, res: Response) => {
  try {
    const userId = req.user.id;
    const { productId } = req.params;
    const { quantity = 1 } = req.body;

    const wishlist = await Wishlist.findOne({ userId });

    if (!wishlist) {
      return res.status(404).json({
        success: false,
        error: 'Wishlist not found',
      });
    }

    const wishlistItem = wishlist.items.find(
      item => item.productId.toString() === productId
    );

    if (!wishlistItem) {
      return res.status(404).json({
        success: false,
        error: 'Product not found in wishlist',
      });
    }

    // Check product availability
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found',
      });
    }

    const variant = product.variants.find(
      v => v.size === wishlistItem.size && v.color === wishlistItem.color
    );

    if (!variant || variant.stock < quantity) {
      return res.status(400).json({
        success: false,
        error: 'Product not available in selected size/color or insufficient stock',
      });
    }

    // Add to cart (using Redis cart service)
    const cartKey = `cart:${userId}`;
    const cart = await redis.get(cartKey) || '[]';
    const cartItems = JSON.parse(cart);

    // Check if item already exists in cart
    const existingCartItem = cartItems.find(
      (item: any) => item.productId === productId &&
                    item.size === wishlistItem.size &&
                    item.color === wishlistItem.color
    );

    if (existingCartItem) {
      existingCartItem.quantity += quantity;
    } else {
      cartItems.push({
        productId,
        name: product.name,
        price: product.price,
        discountPrice: product.discountPrice,
        size: wishlistItem.size,
        color: wishlistItem.color,
        quantity,
        image: product.images[0],
        maxQuantity: variant.stock,
        addedAt: new Date().toISOString(),
      });
    }

    await redis.set(cartKey, JSON.stringify(cartItems));

    // Remove from wishlist
    wishlist.items = wishlist.items.filter(
      item => item.productId.toString() !== productId
    );
    await wishlist.save();

    // Clear caches
    const wishlistKeys = await redis.keys(`wishlist:${userId}:*`);
    if (wishlistKeys.length > 0) {
      await redis.del(...wishlistKeys);
    }

    res.json({
      success: true,
      data: {
        message: 'Product moved to cart successfully',
        removedFromWishlist: true,
      },
    });
  } catch (error: any) {
    console.error('Move wishlist to cart error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to move product to cart',
    });
  }
};

export const clearWishlist = async (req: Request, res: Response) => {
  try {
    const userId = req.user.id;

    await Wishlist.findOneAndDelete({ userId });

    // Clear wishlist cache
    const keys = await redis.keys(`wishlist:${userId}:*`);
    if (keys.length > 0) {
      await redis.del(...keys);
    }

    res.json({
      success: true,
      data: {
        message: 'Wishlist cleared successfully',
      },
    });
  } catch (error: any) {
    console.error('Clear wishlist error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to clear wishlist',
    });
  }
};

export const shareWishlist = async (req: Request, res: Response) => {
  try {
    const userId = req.user.id;

    const wishlist = await Wishlist.findOne({ userId })
      .populate({
        path: 'items.productId',
        select: 'name price discountPrice images brand',
      });

    if (!wishlist || wishlist.items.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Wishlist is empty',
      });
    }

    // Generate shareable link (in a real app, this would create a unique token)
    const shareToken = Buffer.from(userId).toString('base64');
    const shareLink = `${process.env.CLIENT_URL}/shared-wishlist/${shareToken}`;

    res.json({
      success: true,
      data: {
        shareLink,
        itemCount: wishlist.items.length,
      },
    });
  } catch (error: any) {
    console.error('Share wishlist error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate share link',
    });
  }
};

export const getSharedWishlist = async (req: Request, res: Response) => {
  try {
    const { shareToken } = req.params;

    // Decode token
    const userId = Buffer.from(shareToken, 'base64').toString('utf-8');

    const wishlist = await Wishlist.findOne({ userId })
      .populate({
        path: 'items.productId',
        select: 'name price discountPrice images brand category ratings',
      })
      .lean();

    if (!wishlist || wishlist.items.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Wishlist not found or empty',
      });
    }

    // Filter out sensitive information and items without products
    const sharedWishlist = {
      items: wishlist.items
        .filter((item: any) => item.productId)
        .map((item: any) => ({
          productId: item.productId._id,
          name: item.productId.name,
          price: item.productId.price,
          discountPrice: item.productId.discountPrice,
          images: item.productId.images,
          brand: item.productId.brand,
          category: item.productId.category,
          size: item.size,
          color: item.color,
          addedAt: item.addedAt,
        })),
    };

    res.json({
      success: true,
      data: sharedWishlist,
    });
  } catch (error: any) {
    console.error('Get shared wishlist error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch shared wishlist',
    });
  }
};