// User related types
export interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  avatar?: string;
  addresses: Address[];
  preferences: UserPreferences;
  isActive: boolean;
  isEmailVerified: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Address {
  _id?: string;
  type: 'home' | 'work' | 'other';
  street: string;
  city: string;
  state: string;
  pincode: string;
  landmark?: string;
  phone?: string;
  isDefault: boolean;
}

export interface UserPreferences {
  sizes: {
    shirt?: string;
    pants?: string;
    shoes?: string;
  };
  brands: string[];
  categories: string[];
  notifications: {
    email: boolean;
    sms: boolean;
    push: boolean;
  };
}

// Product related types
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
  specifications: ProductSpecifications;
  rating: number;
  reviewCount: number;
  stock: Record<string, number>;
  tags: string[];
  isActive: boolean;
  featured: boolean;
  newArrival: boolean;
  bestSeller: boolean;
  seo: SEOData;
  createdAt: Date;
  updatedAt: Date;
}

export interface Color {
  name: string;
  hex: string;
  images: string[];
}

export interface ProductSpecifications {
  material: string;
  care: string;
  fit: 'slim' | 'regular' | 'loose' | 'oversized';
}

export interface SEOData {
  title?: string;
  description?: string;
  keywords?: string[];
}

// Cart related types
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
  addedAt: Date;
}

export interface Cart {
  _id: string;
  userId: string;
  items: CartItem[];
  totalItems: number;
  totalPrice: number;
  totalDiscountPrice: number;
  couponCode?: string;
  discountAmount: number;
  createdAt: Date;
  updatedAt: Date;
}

// Wishlist related types
export interface WishlistItem {
  productId: string;
  name: string;
  price: number;
  discountPrice?: number;
  image: string;
  category: string;
  brand: string;
  addedAt: Date;
}

export interface Wishlist {
  _id: string;
  userId: string;
  items: WishlistItem[];
  itemCount: number;
  shareToken?: string;
  shareExpires?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Order related types
export interface OrderItem {
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

export interface ShippingAddress {
  street: string;
  city: string;
  state: string;
  pincode: string;
  landmark?: string;
  phone?: string;
}

export interface BillingAddress extends ShippingAddress {
  // Billing address can have additional fields if needed
}

export interface PaymentInfo {
  method: 'credit_card' | 'debit_card' | 'upi' | 'net_banking' | 'cod' | 'wallet';
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded';
  transactionId?: string;
  paymentId?: string;
  paidAt?: Date;
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

export interface ShippingMethod {
  name: string;
  price: number;
  estimatedDays: number;
}

export interface OrderTracking {
  status: string;
  timestamp: Date;
  location?: string;
  description: string;
}

export interface Order {
  _id: string;
  userId: string;
  orderNumber: string;
  items: OrderItem[];
  shippingAddress: ShippingAddress;
  billingAddress?: BillingAddress;
  paymentInfo: PaymentInfo;
  pricing: OrderPricing;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'returned' | 'refunded';
  tracking: OrderTracking[];
  trackingId?: string;
  estimatedDelivery?: Date;
  actualDelivery?: Date;
  shippingMethod: ShippingMethod;
  couponCode?: string;
  discountAmount?: number;
  giftWrap: boolean;
  giftMessage?: string;
  notes?: string;
  cancellationReason?: string;
  returnRequest?: ReturnRequest;
  rating?: OrderRating;
  createdAt: Date;
  updatedAt: Date;
}

export interface ReturnRequest {
  status: 'requested' | 'approved' | 'rejected' | 'completed';
  items: Array<{
    productId: string;
    reason: string;
    images?: string[];
    refundMethod: 'original' | 'store_credit' | 'bank_transfer';
    status: 'pending' | 'approved' | 'rejected';
  }>;
  requestedAt: Date;
}

export interface OrderRating {
  overall: number;
  packaging: number;
  delivery: number;
  productQuality: number;
  comment?: string;
  ratedAt: Date;
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    limit: number;
  };
}

// Filter and search types
export interface ProductFilters {
  categories: string[];
  brands: string[];
  sizes: string[];
  colors: string[];
  priceRange: [number, number];
  rating: number;
  inStock: boolean;
}

export interface SearchParams {
  query: string;
  page?: number;
  limit?: number;
  filters?: Partial<ProductFilters>;
  sortBy?: 'price' | 'popularity' | 'newest' | 'discount';
  sortOrder?: 'asc' | 'desc';
}

// AI Virtual Try-On types
export interface PoseLandmark {
  x: number;
  y: number;
  z?: number;
  visibility?: number;
}

export interface PoseData {
  landmarks: PoseLandmark[];
  bbox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface VirtualTryOnRequest {
  poseData: PoseData;
  productImage: string;
  size: string;
  color: string;
  userMeasurements?: {
    height: number;
    weight: number;
    chest?: number;
    waist?: number;
    hips?: number;
  };
}

export interface VirtualTryOnResponse {
  processedImage: string;
  confidence: number;
  recommendations?: {
    size: string;
    fit: 'tight' | 'regular' | 'loose';
    confidence: number;
  };
}

export interface ClothingProcessRequest {
  productImage: string;
  removeBackground: boolean;
  extractClothing: boolean;
}

export interface ClothingProcessResponse {
  processedImage: string;
  mask: string;
  keypoints: Array<{
    x: number;
    y: number;
    type: string;
  }>;
}

export interface SizeRecommendation {
  recommendedSize: string;
  alternatives: Array<{
    size: string;
    fit: 'tight' | 'regular' | 'loose';
    confidence: number;
  }>;
  measurements: {
    chest: number;
    waist: number;
    hips: number;
  };
}

// Review types
export interface ProductReview {
  _id: string;
  userId: string;
  productId: string;
  rating: number;
  title: string;
  comment: string;
  images?: string[];
  helpful: number;
  verified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Notification types
export interface Notification {
  _id: string;
  userId: string;
  type: 'order' | 'payment' | 'delivery' | 'promotion' | 'account';
  title: string;
  message: string;
  data?: any;
  read: boolean;
  createdAt: Date;
}

// Admin types
export interface AdminUser extends User {
  role: 'admin' | 'moderator';
  permissions: string[];
}

export interface ProductAnalytics {
  views: number;
  clicks: number;
  addToCart: number;
  purchases: number;
  revenue: number;
  conversionRate: number;
}

// Common utility types
export type SortOrder = 'asc' | 'desc';
export type SortField = 'price' | 'popularity' | 'newest' | 'discount' | 'rating';
export type Currency = 'INR' | 'USD' | 'EUR';
export type OrderStatus = Order['status'];
export type PaymentMethod = PaymentInfo['method'];
export type Gender = 'male' | 'female' | 'other';