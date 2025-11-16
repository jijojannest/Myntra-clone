import { api } from './index';
import { ApiResponse } from './index';

export interface WishlistItem {
  productId: string;
  name: string;
  price: number;
  discountPrice?: number;
  image: string;
  category: string;
  brand: string;
  addedAt: string;
}

export interface WishlistResponse {
  items: WishlistItem[];
  itemCount: number;
  lastUpdated: string;
}

export const wishlistAPI = {
  // Get user's wishlist
  getWishlist: (): Promise<ApiResponse<WishlistResponse>> => {
    return api.get('/wishlist');
  },

  // Add product to wishlist
  addToWishlist: (productId: string): Promise<ApiResponse<WishlistResponse>> => {
    return api.post('/wishlist/add', { productId });
  },

  // Remove product from wishlist
  removeFromWishlist: (productId: string): Promise<ApiResponse> => {
    return api.delete(`/wishlist/remove/${productId}`);
  },

  // Clear entire wishlist
  clearWishlist: (): Promise<ApiResponse> => {
    return api.delete('/wishlist/clear');
  },

  // Check if product is in wishlist
  isInWishlist: (productId: string): Promise<ApiResponse<{ inWishlist: boolean }>> => {
    return api.get(`/wishlist/check/${productId}`);
  },

  // Move item from wishlist to cart
  moveToCart: (productId: string, options: {
    size: string;
    color: string;
    quantity: number;
  }): Promise<ApiResponse> => {
    return api.post(`/wishlist/move-to-cart/${productId}`, options);
  },

  // Get wishlist count
  getWishlistCount: (): Promise<ApiResponse<{ count: number }>> => {
    return api.get('/wishlist/count');
  },

  // Share wishlist
  shareWishlist: (): Promise<ApiResponse<{ shareUrl: string }>> => {
    return api.post('/wishlist/share');
  },

  // Get shared wishlist (public)
  getSharedWishlist: (shareId: string): Promise<ApiResponse<WishlistResponse>> => {
    return api.get(`/wishlist/shared/${shareId}`);
  },

  // Get wishlist recommendations based on items
  getRecommendations: (): Promise<ApiResponse<{
    products: Array<{
      id: string;
      name: string;
      price: number;
      image: string;
      reason: string;
    }>;
  }>> => {
    return api.get('/wishlist/recommendations');
  },
};