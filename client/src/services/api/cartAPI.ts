import { api } from './index';
import { ApiResponse } from './index';

export interface CartItem {
  productId: string;
  name: string;
  price: number;
  discountPrice?: number;
  size: string;
  color: string;
  quantity: number;
  image: string;
  maxQuantity: number;
}

export interface CartResponse {
  items: CartItem[];
  totalItems: number;
  totalPrice: number;
  totalDiscountPrice: number;
  lastUpdated: string;
}

export const cartAPI = {
  // Get user's cart
  getCart: (): Promise<ApiResponse<CartResponse>> => {
    return api.get('/cart');
  },

  // Add item to cart
  addToCart: (item: {
    productId: string;
    size: string;
    color: string;
    quantity: number;
  }): Promise<ApiResponse<CartResponse>> => {
    return api.post('/cart/add', item);
  },

  // Update cart item quantity
  updateCartItem: (item: {
    productId: string;
    size: string;
    color: string;
    quantity: number;
  }): Promise<ApiResponse<CartResponse>> => {
    return api.put('/cart/update', item);
  },

  // Remove item from cart
  removeFromCart: (itemId: string): Promise<ApiResponse> => {
    return api.delete(`/cart/remove/${itemId}`);
  },

  // Clear entire cart
  clearCart: (): Promise<ApiResponse> => {
    return api.delete('/cart/clear');
  },

  // Apply coupon code
  applyCoupon: (couponCode: string): Promise<ApiResponse<{
    discountAmount: number;
    finalPrice: number;
  }>> => {
    return api.post('/cart/apply-coupon', { couponCode });
  },

  // Remove coupon code
  removeCoupon: (): Promise<ApiResponse<CartResponse>> => {
    return api.delete('/cart/remove-coupon');
  },

  // Get estimated shipping
  getShippingEstimate: (address: {
    street: string;
    city: string;
    state: string;
    pincode: string;
  }): Promise<ApiResponse<{
    shippingOptions: Array<{
      id: string;
      name: string;
      price: number;
      estimatedDays: number;
    }>;
  }>> => {
    return api.post('/cart/shipping-estimate', address);
  },

  // Save cart for later (for guest users)
  saveCartForLater: (cartItems: CartItem[]): Promise<ApiResponse<{ cartId: string }>> => {
    return api.post('/cart/save-for-later', { items: cartItems });
  },

  // Load saved cart (for guest users)
  loadSavedCart: (cartId: string): Promise<ApiResponse<CartResponse>> => {
    return api.get(`/cart/load-saved/${cartId}`);
  },

  // Merge guest cart with user cart (after login)
  mergeGuestCart: (guestCartItems: CartItem[]): Promise<ApiResponse<CartResponse>> => {
    return api.post('/cart/merge-guest-cart', { items: guestCartItems });
  },
};