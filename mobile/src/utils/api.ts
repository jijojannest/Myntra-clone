import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = __DEV__ ?
  'http://localhost:5001/api/v1' :
  'https://api.myntraclone.com/api/v1';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: BASE_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    // Request interceptor for auth token
    this.client.interceptors.request.use(
      async (config) => {
        const token = await AsyncStorage.getItem('@auth_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for token refresh
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
          try {
            await this.refreshToken();
            const newToken = await AsyncStorage.getItem('@auth_token');
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            originalRequest._retry = true;
            return this.client(originalRequest);
          } catch (refreshError) {
            await this.clearAuthData();
            // Navigate to login - this would need navigation context
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(error);
      }
    );
  }

  private async refreshToken() {
    const refreshToken = await AsyncStorage.getItem('@refresh_token');
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await this.client.post('/auth/refresh', {
      refreshToken,
    });

    const { accessToken, refreshToken: newRefreshToken } = response.data.data;

    await AsyncStorage.setItem('@auth_token', accessToken);
    if (newRefreshToken) {
      await AsyncStorage.setItem('@refresh_token', newRefreshToken);
    }
  }

  private async clearAuthData() {
    await AsyncStorage.multiRemove([
      '@auth_token',
      '@refresh_token',
      '@user_data',
    ]);
  }

  // Public methods
  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.get(url, config);
    return response.data;
  }

  async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.post(url, data, config);
    return response.data;
  }

  async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.put(url, data, config);
    return response.data;
  }

  async patch<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.patch(url, data, config);
    return response.data;
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.delete(url, config);
    return response.data;
  }

  // File upload
  async upload<T>(url: string, formData: FormData, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.post(url, formData, {
      ...config,
      headers: {
        'Content-Type': 'multipart/form-data',
        ...config?.headers,
      },
    });
    return response.data;
  }

  // Download
  async download(url: string, config?: AxiosRequestConfig): Promise<Blob> {
    const response = await this.client.get(url, {
      ...config,
      responseType: 'blob',
    });
    return response.data;
  }
}

export const apiClient = new ApiClient();

// API endpoints
export const endpoints = {
  // Auth
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    REFRESH: '/auth/refresh',
    LOGOUT: '/auth/logout',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
    VERIFY_EMAIL: '/auth/verify-email',
  },
  // User
  USER: {
    PROFILE: '/user/profile',
    UPDATE_PROFILE: '/user/profile',
    ADDRESSES: '/user/addresses',
    ADD_ADDRESS: '/user/addresses',
    UPDATE_ADDRESS: (id: string) => `/user/addresses/${id}`,
    DELETE_ADDRESS: (id: string) => `/user/addresses/${id}`,
  },
  // Products
  PRODUCTS: {
    LIST: '/products',
    DETAIL: (id: string) => `/products/${id}`,
    SEARCH: '/products/search',
    FILTERS: '/products/filters',
    RECOMMENDATIONS: '/products/recommendations',
    TRENDING: '/products/trending',
    NEW_ARRIVALS: '/products/new-arrivals',
  },
  // Cart
  CART: {
    LIST: '/cart',
    ADD: '/cart/add',
    UPDATE: (id: string) => `/cart/${id}`,
    REMOVE: (id: string) => `/cart/${id}`,
    CLEAR: '/cart/clear',
  },
  // Wishlist
  WISHLIST: {
    LIST: '/wishlist',
    ADD: '/wishlist',
    REMOVE: (id: string) => `/wishlist/${id}`,
    UPDATE: (id: string) => `/wishlist/${id}`,
    MOVE_TO_CART: (id: string) => `/wishlist/${id}/move-to-cart`,
    CLEAR: '/wishlist/clear',
    SHARE: '/wishlist/share',
  },
  // Orders
  ORDERS: {
    LIST: '/orders',
    DETAIL: (id: string) => `/orders/${id}`,
    CREATE: '/orders',
    CANCEL: (id: string) => `/orders/${id}/cancel`,
    RETURN: (id: string) => `/orders/${id}/return`,
    RATE: (id: string) => `/orders/${id}/rate`,
    TRACK: (id: string) => `/orders/${id}/track`,
    INVOICE: (id: string) => `/orders/${id}/invoice`,
  },
  // Categories
  CATEGORIES: {
    LIST: '/categories',
    TREE: '/categories/tree',
    DETAIL: (id: string) => `/categories/${id}`,
  },
  // Virtual Try-On
  AI: {
    DETECT_POSE: '/ai/detect-pose',
    TRY_ON: '/ai/try-on',
    PROCESS_IMAGE: '/ai/process-image',
    GET_RESULTS: (id: string) => `/ai/results/${id}`,
  },
  // Notifications
  NOTIFICATIONS: {
    LIST: '/notifications',
    MARK_READ: (id: string) => `/notifications/${id}/read`,
    SETTINGS: '/notifications/settings',
    UPDATE_SETTINGS: '/notifications/settings',
  },
  // Reviews
  REVIEWS: {
    PRODUCT_REVIEWS: (id: string) => `/products/${id}/reviews`,
    ADD_REVIEW: (id: string) => `/products/${id}/reviews`,
    UPDATE_REVIEW: (id: string, reviewId: string) => `/products/${id}/reviews/${reviewId}`,
  },
};

// Error handling
export class ApiError extends Error {
  constructor(
    message: string,
    public code?: string,
    public status?: number,
    public data?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export const handleApiError = (error: any): ApiError => {
  if (error.response) {
    const { status, data } = error.response;
    return new ApiError(
      data.message || 'An error occurred',
      data.code || 'UNKNOWN_ERROR',
      status,
      data
    );
  } else if (error.request) {
    return new ApiError(
      'Network error. Please check your connection.',
      'NETWORK_ERROR'
    );
  } else {
    return new ApiError(
      error.message || 'An unexpected error occurred.',
      'UNKNOWN_ERROR'
    );
  }
};

// Offline support
export class OfflineStorage {
  private static instance: OfflineStorage;
  private storage: typeof AsyncStorage;

  constructor() {
    this.storage = AsyncStorage;
  }

  static getInstance(): OfflineStorage {
    if (!OfflineStorage.instance) {
      OfflineStorage.instance = new OfflineStorage();
    }
    return OfflineStorage.instance;
  }

  async saveRequest(requestKey: string, request: any): Promise<void> {
    const existingRequests = await this.getPendingRequests();
    existingRequests.push(request);
    await this.storage.setItem('@offline_requests', JSON.stringify(existingRequests));
  }

  async getPendingRequests(): Promise<any[]> {
    const requests = await this.storage.getItem('@offline_requests');
    return requests ? JSON.parse(requests) : [];
  }

  async clearPendingRequests(): Promise<void> {
    await this.storage.removeItem('@offline_requests');
  }

  async cacheData(key: string, data: any, ttl?: number): Promise<void> {
    const cacheItem = {
      data,
      timestamp: Date.now(),
      ttl: ttl || 5 * 60 * 1000, // 5 minutes default
    };
    await this.storage.setItem(`@cache_${key}`, JSON.stringify(cacheItem));
  }

  async getCachedData(key: string): Promise<any | null> {
    const cached = await this.storage.getItem(`@cache_${key}`);
    if (!cached) return null;

    const cacheItem = JSON.parse(cached);
    if (Date.now() - cacheItem.timestamp > cacheItem.ttl) {
      await this.storage.removeItem(`@cache_${key}`);
      return null;
    }

    return cacheItem.data;
  }

  async clearCache(): Promise<void> {
    const keys = await this.storage.getAllKeys();
    const cacheKeys = keys.filter(key => key.startsWith('@cache_'));
    await this.storage.multiRemove(cacheKeys);
  }
}

export const offlineStorage = OfflineStorage.getInstance();