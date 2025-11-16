import { api } from './index';
import { ApiResponse } from './index';

export interface OrderItem {
  productId: string;
  name: string;
  price: number;
  size: string;
  color: string;
  quantity: number;
  image: string;
  discountPrice?: number;
}

export interface ShippingAddress {
  street: string;
  city: string;
  state: string;
  pincode: string;
  landmark?: string;
  phone?: string;
}

export interface PaymentInfo {
  method: 'credit_card' | 'debit_card' | 'upi' | 'net_banking' | 'cod';
  details: {
    cardNumber?: string;
    cardHolder?: string;
    expiryDate?: string;
    cvv?: string;
    upiId?: string;
    bankName?: string;
  };
}

export interface CreateOrderRequest {
  items: OrderItem[];
  shippingAddress: ShippingAddress;
  paymentInfo: PaymentInfo;
  couponCode?: string;
  giftWrap?: boolean;
  giftMessage?: string;
}

export interface Order {
  _id: string;
  userId: string;
  items: OrderItem[];
  shippingAddress: ShippingAddress;
  paymentInfo: {
    method: string;
    status: string;
    transactionId?: string;
    paidAt?: string;
  };
  pricing: {
    subtotal: number;
    discount: number;
    shipping: number;
    tax: number;
    total: number;
  };
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'returned';
  trackingId?: string;
  estimatedDelivery?: string;
  actualDelivery?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrdersResponse {
  orders: Order[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalOrders: number;
    limit: number;
  };
}

export const ordersAPI = {
  // Create new order
  createOrder: (orderData: CreateOrderRequest): Promise<ApiResponse<{ order: Order; paymentUrl?: string }>> => {
    return api.post('/orders', orderData);
  },

  // Get user's orders
  getOrders: (params?: {
    page?: number;
    limit?: number;
    status?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<ApiResponse<OrdersResponse>> => {
    return api.get('/orders', { params });
  },

  // Get single order details
  getOrderById: (orderId: string): Promise<ApiResponse<{ order: Order }>> => {
    return api.get(`/orders/${orderId}`);
  },

  // Cancel order
  cancelOrder: (orderId: string, reason?: string): Promise<ApiResponse> => {
    return api.post(`/orders/${orderId}/cancel`, { reason });
  },

  // Return order or specific items
  returnOrder: (orderId: string, returnData: {
    items: Array<{
      productId: string;
      reason: string;
      images?: string[];
    }>;
    refundMethod: 'original' | 'store_credit' | 'bank_transfer';
  }): Promise<ApiResponse> => {
    return api.post(`/orders/${orderId}/return`, returnData);
  },

  // Track order
  trackOrder: (orderId: string): Promise<ApiResponse<{
    tracking: Array<{
      status: string;
      timestamp: string;
      location?: string;
      description: string;
    }>;
    estimatedDelivery: string;
  }>> => {
    return api.get(`/orders/${orderId}/track`);
  },

  // Get order status
  getOrderStatus: (orderId: string): Promise<ApiResponse<{
    status: string;
    estimatedDelivery: string;
    trackingId?: string;
  }>> => {
    return api.get(`/orders/${orderId}/status`);
  },

  // Request invoice
  requestInvoice: (orderId: string, email?: string): Promise<ApiResponse<{ invoiceUrl: string }>> => {
    return api.post(`/orders/${orderId}/invoice`, { email });
  },

  // Reorder items from previous order
  reorderItems: (orderId: string, items: Array<{
    productId: string;
    quantity: number;
    size: string;
    color: string;
  }>): Promise<ApiResponse> => {
    return api.post(`/orders/${orderId}/reorder`, { items });
  },

  // Rate order
  rateOrder: (orderId: string, rating: {
    overall: number;
    packaging: number;
    delivery: number;
    productQuality: number;
  }, comment?: string): Promise<ApiResponse> => {
    return api.post(`/orders/${orderId}/rate`, { rating, comment });
  },

  // Get order summary (before checkout)
  getOrderSummary: (items: OrderItem[], address: ShippingAddress): Promise<ApiResponse<{
    subtotal: number;
    discount: number;
    shipping: number;
    tax: number;
    total: number;
    estimatedDelivery: string;
    availableShippingOptions: Array<{
      id: string;
      name: string;
      price: number;
      estimatedDays: number;
    }>;
  }>> => {
    return api.post('/orders/summary', { items, address });
  },

  // Apply coupon to order
  applyCoupon: (couponCode: string, orderValue: number): Promise<ApiResponse<{
    discountAmount: number;
    discountType: 'percentage' | 'fixed';
    discountValue: number;
    finalValue: number;
  }>> => {
    return api.post('/orders/apply-coupon', { couponCode, orderValue });
  },

  // Validate payment
  validatePayment: (orderId: string, paymentData: any): Promise<ApiResponse<{
    status: 'success' | 'failed' | 'pending';
    paymentId?: string;
  }>> => {
    return api.post(`/orders/${orderId}/validate-payment`, paymentData);
  },
};