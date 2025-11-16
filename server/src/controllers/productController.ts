import { Response } from 'express';
import { query, param } from 'express-validator';
import { Product, IProduct } from '../models/Product';
import { AuthRequest, asyncHandler, createError } from '../middleware/errorHandler';
import { redisGet, redisSet } from '../config/redis';

interface ProductsQuery {
  page?: string;
  limit?: string;
  category?: string;
  brand?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: string;
  minPrice?: string;
  maxPrice?: string;
  sizes?: string;
  colors?: string;
}

// Get all products with filtering
export const getProducts = asyncHandler(async (req: AuthRequest, res: Response) => {
  const {
    page = '1',
    limit = '20',
    category,
    brand,
    search,
    sortBy = 'popularity',
    sortOrder = 'desc',
    minPrice,
    maxPrice,
    sizes,
    colors
  } = req.query as ProductsQuery;

  // Build query
  const query: any = { isActive: true };

  if (category) query.category = category;
  if (brand) query.brand = brand;
  if (search) {
    query.$text = {
      $search: search,
      $caseSensitive: false
    };
  }

  // Price range
  if (minPrice || maxPrice) {
    query.price = {};
    if (minPrice) query.price.$gte = parseFloat(minPrice);
    if (maxPrice) query.price.$lte = parseFloat(maxPrice);
  }

  // Sizes filter
  if (sizes) {
    const sizeArray = sizes.split(',');
    query.sizes = { $in: sizeArray };
  }

  // Colors filter
  if (colors) {
    const colorArray = colors.split(',');
    query['colors.name'] = { $in: colorArray };
  }

  // Sorting
  const sort: any = {};
  switch (sortBy) {
    case 'price':
      sort.price = sortOrder === 'asc' ? 1 : -1;
      break;
    case 'newest':
      sort.createdAt = sortOrder === 'asc' ? 1 : -1;
      break;
    case 'discount':
      sort.discountPrice = sortOrder === 'asc' ? 1 : -1;
      break;
    case 'rating':
      sort.rating = sortOrder === 'asc' ? 1 : -1;
      break;
    case 'popularity':
    default:
      sort.reviewCount = sortOrder === 'asc' ? 1 : -1;
      break;
  }

  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const skip = (pageNum - 1) * limitNum;

  // Try to get from cache first
  const cacheKey = `products:${JSON.stringify(query)}:${pageNum}:${limitNum}:${sortBy}:${sortOrder}`;
  let cached = await redisGet(cacheKey);

  if (cached) {
    return res.status(200).json({
      success: true,
      data: cached
    });
  }

  const products = await Product.find(query)
    .sort(sort)
    .skip(skip)
    .limit(limitNum)
    .populate('brand')
    .lean();

  const total = await Product.countDocuments(query);

  const result = {
    products,
    pagination: {
      currentPage: pageNum,
      totalPages: Math.ceil(total / limitNum),
      totalProducts: total,
      limit: limitNum
    }
  };

  // Cache for 5 minutes
  await redisSet(cacheKey, result, 300);

  res.status(200).json({
    success: true,
    data: result
  });
});

// Get single product by ID
export const getProductById = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  const cacheKey = `product:${id}`;
  let cached = await redisGet(cacheKey);

  if (cached) {
    return res.status(200).json({
      success: true,
      data: cached
    });
  }

  const product = await Product.findById(id).lean();

  if (!product) {
    throw createError('Product not found', 404);
  }

  const result = { product };

  // Cache for 10 minutes
  await redisSet(cacheKey, result, 600);

  res.status(200).json({
    success: true,
    data: result
  });
});

// Search products
export const searchProducts = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { query } = req.body;
  const { page = '1', limit = '20' } = req.query;

  if (!query) {
    throw createError('Search query is required', 400);
  }

  const searchQuery = {
    $and: [
      { isActive: true },
      {
        $text: {
          $search: query,
          $caseSensitive: false
        }
      }
    ]
  };

  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const skip = (pageNum - 1) * limitNum;

  const products = await Product.find(searchQuery)
    .sort({ reviewCount: -1 })
    .skip(skip)
    .limit(limitNum)
    .lean();

  const total = await Product.countDocuments(searchQuery);

  const result = {
    products,
    pagination: {
      currentPage: pageNum,
      totalPages: Math.ceil(total / limitNum),
      totalProducts: total,
      limit: limitNum
    }
  };

  res.status(200).json({
    success: true,
    data: result
  });
});

// Get featured products
export const getFeaturedProducts = asyncHandler(async (req: AuthRequest, res: Response) => {
  const cacheKey = 'featured:products';
  let cached = await redisGet(cacheKey);

  if (cached) {
    return res.status(200).json({
      success: true,
      data: cached
    });
  }

  const products = await Product.find({ isActive: true, featured: true })
    .sort({ reviewCount: -1 })
    .limit(12)
    .lean();

  const result = { products };

  // Cache for 15 minutes
  await redisSet(cacheKey, result, 900);

  res.status(200).json({
    success: true,
    data: result
  });
});

// Get new arrivals
export const getNewArrivals = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { limit = '12' } = req.query;

  const cacheKey = 'new:arrivals';
  let cached = await redisGet(cacheKey);

  if (cached) {
    return res.status(200).json({
      success: true,
      data: cached
    });
  }

  const products = await Product.find({ isActive: true, newArrival: true })
    .sort({ createdAt: -1 })
    .limit(parseInt(limit))
    .lean();

  const result = { products };

  // Cache for 30 minutes
  await redisSet(cacheKey, result, 1800);

  res.status(200).json({
    success: true,
    data: result
  });
});

// Get best sellers
export const getBestSellers = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { limit = '12' } = req.query;

  const cacheKey = 'best:sellers';
  let cached = await redisGet(cacheKey);

  if (cached) {
    return res.status(200).json({
      success: true,
      data: cached
    });
  }

  const products = await Product.find({ isActive: true, bestSeller: true })
    .sort({ reviewCount: -1, rating: -1 })
    .limit(parseInt(limit))
    .lean();

  const result = { products };

  // Cache for 30 minutes
  await redisSet(cacheKey, result, 1800);

  res.status(200).json({
    success: true,
    data: result
  });
});

// Get similar products
export const getSimilarProducts = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { limit = '8' } = req.query;

  const product = await Product.findById(id);
  if (!product) {
    throw createError('Product not found', 404);
  }

  const products = await Product.find({
    _id: { $ne: id },
    isActive: true,
    $or: [
      { category: product.category },
      { brand: product.brand },
      { tags: { $in: product.tags } }
    ]
  })
    .sort({ reviewCount: -1 })
    .limit(parseInt(limit))
    .lean();

  const result = { products };

  res.status(200).json({
    success: true,
    data: result
  });
});

// Get products by category
export const getProductsByCategory = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { category } = req.params;
  const { page = '1', limit = '20', sortBy = 'popularity', sortOrder = 'desc' } = req.query;

  const query = {
    category,
    isActive: true
  };

  const sort: any = {};
  switch (sortBy) {
    case 'price':
      sort.price = sortOrder === 'asc' ? 1 : -1;
      break;
    case 'newest':
      sort.createdAt = sortOrder === 'asc' ? 1 : -1;
      break;
    case 'rating':
      sort.rating = sortOrder === 'asc' ? 1 : -1;
      break;
    case 'popularity':
    default:
      sort.reviewCount = sortOrder === 'asc' ? 1 : -1;
      break;
  }

  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const skip = (pageNum - 1) * limitNum;

  const products = await Product.find(query)
    .sort(sort)
    .skip(skip)
    .limit(limitNum)
    .lean();

  const total = await Product.countDocuments(query);

  const result = {
    products,
    pagination: {
      currentPage: pageNum,
      totalPages: Math.ceil(total / limitNum),
      totalProducts: total,
      limit: limitNum
    }
  };

  res.status(200).json({
    success: true,
    data: result
  });
});

// Get products by brand
export const getProductsByBrand = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { brand } = req.params;
  const { page = '1', limit = '20', sortBy = 'popularity', sortOrder = 'desc' } = req.query;

  const query = {
    brand,
    isActive: true
  };

  const sort: any = {};
  switch (sortBy) {
    case 'price':
      sort.price = sortOrder === 'asc' ? 1 : -1;
      break;
    case 'newest':
      sort.createdAt = sortOrder === 'asc' ? 1 : -1;
      break;
    case 'rating':
      sort.rating = sortOrder === 'asc' ? 1 : -1;
      break;
    case 'popularity':
    default:
      sort.reviewCount = sortOrder === 'asc' ? 1 : -1;
      break;
  }

  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const skip = (pageNum - 1) * limitNum;

  const products = await Product.find(query)
    .sort(sort)
    .skip(skip)
    .limit(limitNum)
    .lean();

  const total = await Product.countDocuments(query);

  const result = {
    products,
    pagination: {
      currentPage: pageNum,
      totalPages: Math.ceil(total / limitNum),
      totalProducts: total,
      limit: limitNum
    }
  };

  res.status(200).json({
    success: true,
    data: result
  });
});

// Get categories
export const getCategories = asyncHandler(async (req: AuthRequest, res: Response) => {
  const cacheKey = 'categories:list';
  let cached = await redisGet(cacheKey);

  if (cached) {
    return res.status(200).json({
      success: true,
      data: cached
    });
  }

  const categories = await Product.distinct('category', { isActive: true });

  const result = { categories };

  // Cache for 1 hour
  await redisSet(cacheKey, result, 3600);

  res.status(200).json({
    success: true,
    data: result
  });
});

// Get brands
export const getBrands = asyncHandler(async (req: AuthRequest, res: Response) => {
  const cacheKey = 'brands:list';
  let cached = await redisGet(cacheKey);

  if (cached) {
    return res.status(200).json({
      success: true,
      data: cached
    });
  }

  const brands = await Product.distinct('brand', { isActive: true });

  const result = { brands };

  // Cache for 1 hour
  await redisSet(cacheKey, result, 3600);

  res.status(200).json({
    success: true,
    data: result
  });
});

// Get product reviews
export const getProductReviews = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { page = '1', limit = '10', rating } = req.query;

  // This would integrate with a reviews model
  // For now, return empty reviews
  const result = {
    reviews: [],
    pagination: {
      currentPage: parseInt(page),
      totalPages: 0,
      totalReviews: 0,
      limit: parseInt(limit)
    }
  };

  res.status(200).json({
    success: true,
    data: result
  });
});

// Add product review
export const addProductReview = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { rating, title, comment } = req.body;

  if (!req.user.isAuthenticated) {
    throw createError('Authentication required', 401);
  }

  if (!rating || rating < 1 || rating > 5) {
    throw createError('Rating must be between 1 and 5', 400);
  }

  // This would integrate with a reviews model
  // For now, return success
  res.status(200).json({
    success: true,
    message: 'Review added successfully'
  });
});