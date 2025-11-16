export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  avatar?: string;
  addresses: Address[];
  isEmailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Address {
  id: string;
  type: 'home' | 'work' | 'other';
  street: string;
  city: string;
  state: string;
  pincode: string;
  landmark?: string;
  phone?: string;
  isDefault: boolean;
}

export interface Product {
  id: string;
  name: string;
  brand: string;
  description: string;
  price: number;
  discountPrice?: number;
  images: string[];
  category: string;
  subcategory: string;
  tags: string[];
  variants: ProductVariant[];
  sizes: string[];
  colors: string[];
  rating: number;
  reviews: number;
  inStock: boolean;
  isNew: boolean;
  isTrending: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProductVariant {
  id: string;
  productId: string;
  size: string;
  color: string;
  stock: number;
  sku: string;
  price: number;
  discountPrice?: number;
  images: string[];
}

export interface CartItem {
  id: string;
  productId: string;
  product: Product;
  variant: ProductVariant;
  quantity: number;
  addedAt: string;
}

export interface WishlistItem {
  id: string;
  productId: string;
  product: Product;
  variant: ProductVariant;
  addedAt: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  items: OrderItem[];
  userId: string;
  user: User;
  shippingAddress: Address;
  billingAddress?: Address;
  paymentInfo: PaymentInfo;
  pricing: OrderPricing;
  status: OrderStatus;
  tracking: OrderTracking[];
  trackingId?: string;
  estimatedDelivery?: string;
  actualDelivery?: string;
  shippingMethod: ShippingMethod;
  createdAt: string;
  updatedAt: string;
  cancellationReason?: string;
  returnRequest?: ReturnRequest;
  rating?: OrderRating;
}

export interface OrderItem {
  id: string;
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

export interface PaymentInfo {
  method: PaymentMethod;
  status: PaymentStatus;
  transactionId?: string;
  paymentId?: string;
  paidAt?: string;
  amount: number;
  currency: string;
}

export interface OrderPricing {
  subtotal: number;
  discount: number;
  shipping: number;
  tax: number;
  total: number;
}

export interface OrderTracking {
  id: string;
  status: string;
  timestamp: string;
  location?: string;
  description: string;
}

export interface ShippingMethod {
  id: string;
  name: string;
  price: number;
  estimatedDays: number;
  description: string;
}

export interface ReturnRequest {
  id: string;
  status: 'requested' | 'approved' | 'rejected' | 'completed';
  items: ReturnItem[];
  requestedAt: string;
  approvedAt?: string;
  completedAt?: string;
  refundMethod: 'original' | 'store_credit' | 'bank_transfer';
  refundAmount?: number;
}

export interface ReturnItem {
  id: string;
  productId: string;
  reason: string;
  images?: string[];
  refundMethod: 'original' | 'store_credit' | 'bank_transfer';
  status: 'pending' | 'approved' | 'rejected';
}

export interface OrderRating {
  overall: number;
  packaging: number;
  delivery: number;
  productQuality: number;
  comment?: string;
  ratedAt: string;
}

export type PaymentMethod =
  | 'credit_card'
  | 'debit_card'
  | 'upi'
  | 'net_banking'
  | 'cod'
  | 'wallet';

export type PaymentStatus =
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'refunded';

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'returned'
  | 'refunded';

export interface Category {
  id: string;
  name: string;
  description?: string;
  image?: string;
  parentId?: string;
  subcategories?: Category[];
  productCount: number;
  isActive: boolean;
  sortOrder: number;
}

export interface FilterOption {
  id: string;
  label: string;
  value: string;
  count?: number;
}

export interface SearchFilters {
  query?: string;
  category?: string;
  subcategory?: string;
  brand?: string[];
  size?: string[];
  color?: string[];
  priceRange?: {
    min: number;
    max: number;
  };
  sortBy?: SortOption;
  sortOrder?: 'asc' | 'desc';
}

export type SortOption =
  | 'relevance'
  | 'price_low_high'
  | 'price_high_low'
  | 'newest_first'
  | 'oldest_first'
  | 'rating_high_low'
  | 'rating_low_high'
  | 'popularity'
  | 'discount_high_low';

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: {
    items: T[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  };
}

export interface NotificationData {
  id: string;
  type: 'order_update' | 'promotion' | 'price_drop' | 'back_in_stock' | 'recommendation';
  title: string;
  message: string;
  data?: any;
  timestamp: string;
  read: boolean;
  imageUrl?: string;
  deepLink?: string;
}

export interface VirtualTryOnData {
  productId: string;
  userImage?: string;
  clothingImage: string;
  poseLandmarks?: number[][];
  resultImage?: string;
  confidence?: number;
  processingTime?: number;
  createdAt: string;
}

export interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  language: string;
  currency: string;
  notifications: {
    push: boolean;
    email: boolean;
    sms: boolean;
    orderUpdates: boolean;
    promotions: boolean;
    priceDrops: boolean;
    backInStock: boolean;
  };
  privacy: {
    analytics: boolean;
    crashlytics: boolean;
    personalization: boolean;
  };
  accessibility: {
    fontSize: 'small' | 'medium' | 'large';
    highContrast: boolean;
    reduceMotion: boolean;
    screenReader: boolean;
  };
}

export interface NavigationState {
  routes: any[];
  index: number;
  history?: any[];
  key?: string;
  stale?: any[];
}

export interface AppError {
  code: string;
  message: string;
  details?: any;
  timestamp: string;
}

export interface LoadingState {
  [key: string]: boolean;
}

export interface ErrorState {
  [key: string]: string | null;
}