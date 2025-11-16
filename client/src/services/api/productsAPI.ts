import { api } from './index';
import { ApiResponse } from './index';

export interface Product {
  _id: string;
  name: string;
  description: string;
  brand: string;
  category: string;
  subcategory: string;
  price: number;
  discountPrice?: number;
  sizes: string[];
  colors: Color[];
  images: string[];
  tryOnImages?: string[];
  specifications: {
    material: string;
    care: string;
    fit: string;
  };
  rating: number;
  reviewCount: number;
  stock: Record<string, number>;
  tags: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Color {
  name: string;
  hex: string;
  images: string[];
}

export interface ProductsResponse {
  products: Product[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalProducts: number;
    limit: number;
  };
}

export interface SearchParams {
  query: string;
  page?: number;
  limit?: number;
  filters?: {
    categories?: string[];
    brands?: string[];
    sizes?: string[];
    colors?: string[];
    priceRange?: [number, number];
    rating?: number;
    inStock?: boolean;
  };
}

export const productsAPI = {
  // Get all products with filtering and pagination
  getProducts: (params?: {
    page?: number;
    limit?: number;
    category?: string;
    brand?: string;
    search?: string;
    sortBy?: string;
    sortOrder?: string;
    minPrice?: number;
    maxPrice?: number;
    sizes?: string[];
    colors?: string[];
  }): Promise<ApiResponse<ProductsResponse>> => {
    return api.get('/products', { params });
  },

  // Get single product by ID
  getProductById: (productId: string): Promise<ApiResponse<{ product: Product }>> => {
    return api.get(`/products/${productId}`);
  },

  // Search products
  searchProducts: (params: SearchParams): Promise<ApiResponse<ProductsResponse>> => {
    return api.get('/products/search', { params });
  },

  // Get featured products
  getFeaturedProducts: (): Promise<ApiResponse<{ products: Product[] }>> => {
    return api.get('/products/featured');
  },

  // Get new arrivals
  getNewArrivals: (limit?: number): Promise<ApiResponse<{ products: Product[] }>> => {
    return api.get('/products/new-arrivals', { params: { limit } });
  },

  // Get best sellers
  getBestSellers: (limit?: number): Promise<ApiResponse<{ products: Product[] }>> => {
    return api.get('/products/best-sellers', { params: { limit } });
  },

  // Get similar products
  getSimilarProducts: (productId: string, limit?: number): Promise<ApiResponse<{ products: Product[] }>> => {
    return api.get(`/products/${productId}/similar`, { params: { limit } });
  },

  // Get products by category
  getProductsByCategory: (category: string, params?: {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: string;
  }): Promise<ApiResponse<ProductsResponse>> => {
    return api.get(`/products/category/${category}`, { params });
  },

  // Get products by brand
  getProductsByBrand: (brand: string, params?: {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: string;
  }): Promise<ApiResponse<ProductsResponse>> => {
    return api.get(`/products/brand/${brand}`, { params });
  },

  // Get all categories
  getCategories: (): Promise<ApiResponse<{ categories: string[] }>> => {
    return api.get('/products/categories');
  },

  // Get all brands
  getBrands: (): Promise<ApiResponse<{ brands: string[] }>> => {
    return api.get('/products/brands');
  },

  // Get product reviews
  getProductReviews: (productId: string, params?: {
    page?: number;
    limit?: number;
    rating?: number;
  }): Promise<ApiResponse> => {
    return api.get(`/products/${productId}/reviews`, { params });
  },

  // Add product review
  addProductReview: (productId: string, review: {
    rating: number;
    title: string;
    comment: string;
  }): Promise<ApiResponse> => {
    return api.post(`/products/${productId}/reviews`, review);
  },

  // Get product suggestions based on search
  getProductSuggestions: (query: string): Promise<ApiResponse<{ suggestions: string[] }>> => {
    return api.get('/products/suggestions', { params: { query } });
  },

  // Get price range for filters
  getPriceRange: (params?: {
    category?: string;
    brand?: string;
  }): Promise<ApiResponse<{ minPrice: number; maxPrice: number }>> => {
    return api.get('/products/price-range', { params });
  },
};