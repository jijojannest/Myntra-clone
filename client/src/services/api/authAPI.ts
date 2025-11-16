import { api } from './index';
import { ApiResponse } from './index';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone?: string;
}

export interface LoginResponse {
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    addresses: any[];
    preferences: any;
    createdAt: string;
    updatedAt: string;
  };
  token: string;
  refreshToken: string;
}

export interface RegisterResponse {
  user: any;
  token: string;
  refreshToken: string;
}

export interface ProfileResponse {
  user: any;
}

export interface UpdateProfileData {
  firstName?: string;
  lastName?: string;
  phone?: string;
  addresses?: any[];
  preferences?: any;
}

export const authAPI = {
  // Login user
  login: (credentials: LoginCredentials): Promise<ApiResponse<LoginResponse>> => {
    return api.post('/auth/login', credentials);
  },

  // Register new user
  register: (userData: RegisterData): Promise<ApiResponse<RegisterResponse>> => {
    return api.post('/auth/register', userData);
  },

  // Logout user
  logout: (): Promise<ApiResponse> => {
    return api.post('/auth/logout');
  },

  // Get user profile
  getProfile: (): Promise<ApiResponse<ProfileResponse>> => {
    return api.get('/auth/profile');
  },

  // Update user profile
  updateProfile: (userData: UpdateProfileData): Promise<ApiResponse<ProfileResponse>> => {
    return api.put('/auth/profile', userData);
  },

  // Request password reset
  forgotPassword: (email: string): Promise<ApiResponse> => {
    return api.post('/auth/forgot-password', { email });
  },

  // Reset password
  resetPassword: (token: string, newPassword: string): Promise<ApiResponse> => {
    return api.post('/auth/reset-password', { token, newPassword });
  },

  // Change password
  changePassword: (currentPassword: string, newPassword: string): Promise<ApiResponse> => {
    return api.post('/auth/change-password', { currentPassword, newPassword });
  },

  // Refresh token
  refreshToken: (refreshToken: string): Promise<ApiResponse<{ token: string }>> => {
    return api.post('/auth/refresh', { refreshToken });
  },

  // Verify email
  verifyEmail: (token: string): Promise<ApiResponse> => {
    return api.post('/auth/verify-email', { token });
  },

  // Resend verification email
  resendVerificationEmail: (): Promise<ApiResponse> => {
    return api.post('/auth/resend-verification');
  },
};