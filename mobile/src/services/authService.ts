import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient, endpoints } from '../utils/api';
import { User, ApiResponse } from '../types';
import googleAuthService from './googleAuthService';
import facebookAuthService from './facebookAuthService';
import appleAuthService from './appleAuthService';
import { SocialUser } from '../types/auth';

interface LoginCredentials {
  email: string;
  password: string;
}

interface RegisterData {
  name: string;
  email: string;
  password: string;
  phone?: string;
}

interface SocialLoginData {
  provider: 'google' | 'facebook' | 'apple';
  token: string;
  email?: string;
  name?: string;
}

interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

class AuthService {
  private static instance: AuthService;

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  async login(email: string, password: string): Promise<AuthResponse> {
    try {
      const response = await apiClient.post<ApiResponse<AuthResponse>>(
        endpoints.AUTH.LOGIN,
        { email, password }
      );

      if (response.success) {
        await this.storeAuthData(response.data);
        return response.data;
      } else {
        throw new Error(response.error || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  async register(userData: RegisterData): Promise<AuthResponse> {
    try {
      const response = await apiClient.post<ApiResponse<AuthResponse>>(
        endpoints.AUTH.REGISTER,
        userData
      );

      if (response.success) {
        await this.storeAuthData(response.data);
        return response.data;
      } else {
        throw new Error(response.error || 'Registration failed');
      }
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  }

  async socialLogin(socialData: SocialLoginData): Promise<AuthResponse> {
    try {
      const response = await apiClient.post<ApiResponse<AuthResponse>>(
        '/auth/social-login',
        socialData
      );

      if (response.success) {
        await this.storeAuthData(response.data);
        return response.data;
      } else {
        throw new Error(response.error || 'Social login failed');
      }
    } catch (error) {
      console.error('Social login error:', error);
      throw error;
    }
  }

  async logout(): Promise<void> {
    try {
      // Call logout endpoint to invalidate token
      await apiClient.post(endpoints.AUTH.LOGOUT);

      // Logout from social providers
      await this.logoutFromSocialProviders();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Always clear local storage
      await AsyncStorage.multiRemove([
        '@auth_token',
        '@refresh_token',
        '@user_data',
        '@remember_me',
      ]);
    }
  }

  async refreshToken(): Promise<AuthResponse> {
    try {
      const refreshToken = await AsyncStorage.getItem('@refresh_token');
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await apiClient.post<ApiResponse<AuthResponse>>(
        endpoints.AUTH.REFRESH,
        { refreshToken }
      );

      if (response.success) {
        await this.storeAuthData(response.data);
        return response.data;
      } else {
        throw new Error(response.error || 'Token refresh failed');
      }
    } catch (error) {
      console.error('Token refresh error:', error);
      throw error;
    }
  }

  async forgotPassword(email: string): Promise<void> {
    try {
      const response = await apiClient.post<ApiResponse<any>>(
        endpoints.AUTH.FORGOT_PASSWORD,
        { email }
      );

      if (!response.success) {
        throw new Error(response.error || 'Failed to send reset email');
      }
    } catch (error) {
      console.error('Forgot password error:', error);
      throw error;
    }
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    try {
      const response = await apiClient.post<ApiResponse<any>>(
        endpoints.AUTH.RESET_PASSWORD,
        { token, newPassword }
      );

      if (!response.success) {
        throw new Error(response.error || 'Failed to reset password');
      }
    } catch (error) {
      console.error('Reset password error:', error);
      throw error;
    }
  }

  async verifyEmail(token: string): Promise<void> {
    try {
      const response = await apiClient.post<ApiResponse<any>>(
        endpoints.AUTH.VERIFY_EMAIL,
        { token }
      );

      if (!response.success) {
        throw new Error(response.error || 'Failed to verify email');
      }
    } catch (error) {
      console.error('Email verification error:', error);
      throw error;
    }
  }

  async changePassword(oldPassword: string, newPassword: string): Promise<void> {
    try {
      const response = await apiClient.post<ApiResponse<any>>(
        '/auth/change-password',
        { oldPassword, newPassword }
      );

      if (!response.success) {
        throw new Error(response.error || 'Failed to change password');
      }
    } catch (error) {
      console.error('Change password error:', error);
      throw error;
    }
  }

  async updateProfile(userData: Partial<User>): Promise<User> {
    try {
      const response = await apiClient.put<ApiResponse<User>>(
        endpoints.USER.UPDATE_PROFILE,
        userData
      );

      if (response.success) {
        await AsyncStorage.setItem('@user_data', JSON.stringify(response.data));
        return response.data;
      } else {
        throw new Error(response.error || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Update profile error:', error);
      throw error;
    }
  }

  async getCurrentUser(): Promise<User | null> {
    try {
      const token = await AsyncStorage.getItem('@auth_token');
      if (!token) {
        return null;
      }

      const response = await apiClient.get<ApiResponse<User>>(
        endpoints.USER.PROFILE
      );

      if (response.success) {
        await AsyncStorage.setItem('@user_data', JSON.stringify(response.data));
        return response.data;
      } else {
        return null;
      }
    } catch (error) {
      console.error('Get current user error:', error);
      return null;
    }
  }

  private async storeAuthData(authData: AuthResponse): Promise<void> {
    await AsyncStorage.multiSet([
      ['@auth_token', authData.accessToken],
      ['@refresh_token', authData.refreshToken],
      ['@user_data', JSON.stringify(authData.user)],
    ]);
  }

  async getStoredAuthData(): Promise<AuthResponse | null> {
    try {
      const [token, refreshToken, userDataString] = await AsyncStorage.multiGet([
        '@auth_token',
        '@refresh_token',
        '@user_data',
      ]);

      if (!token || !refreshToken || !userDataString) {
        return null;
      }

      const userData = JSON.parse(userDataString);
      return {
        user: userData,
        accessToken: token,
        refreshToken: refreshToken,
      };
    } catch (error) {
      console.error('Get stored auth data error:', error);
      return null;
    }
  }

  async isAuthenticated(): Promise<boolean> {
    try {
      const token = await AsyncStorage.getItem('@auth_token');
      const user = await AsyncStorage.getItem('@user_data');

      return !!(token && user);
    } catch (error) {
      console.error('Check authentication error:', error);
      return false;
    }
  }

  async setRememberMe(remember: boolean): Promise<void> {
    await AsyncStorage.setItem('@remember_me', JSON.stringify(remember));
  }

  async shouldRememberMe(): Promise<boolean> {
    try {
      const remember = await AsyncStorage.getItem('@remember_me');
      return remember ? JSON.parse(remember) : false;
    } catch (error) {
      console.error('Get remember me error:', error);
      return false;
    }
  }

  // Biometric authentication
  async setupBiometrics(): Promise<boolean> {
    try {
      // This would integrate with react-native-biometrics
      const isSupported = false; // await Biometrics.isSensorAvailable();

      if (isSupported) {
        // Store credentials securely if biometrics is available
        return true;
      }

      return false;
    } catch (error) {
      console.error('Setup biometrics error:', error);
      return false;
    }
  }

  async authenticateWithBiometrics(): Promise<AuthResponse | null> {
    try {
      // This would implement biometric authentication
      // const result = await Biometrics.authenticate('Login with biometrics');

      // if (result.success) {
      //   const authData = await this.getStoredAuthData();
      //   if (authData) {
      //     return authData;
      //   }
      // }

      return null;
    } catch (error) {
      console.error('Biometric authentication error:', error);
      return null;
    }
  }

  // Social login methods
  async loginWithGoogle(): Promise<AuthResponse> {
    try {
      const socialUser: SocialUser = await googleAuthService.signIn();

      const socialLoginData: SocialLoginData = {
        provider: 'google',
        token: socialUser.id, // Use user ID as token for server verification
        email: socialUser.email,
        name: socialUser.name,
      };

      return await this.socialLogin(socialLoginData);
    } catch (error) {
      console.error('Google login error:', error);
      throw error;
    }
  }

  async loginWithFacebook(): Promise<AuthResponse> {
    try {
      const socialUser: SocialUser = await facebookAuthService.signIn();

      const socialLoginData: SocialLoginData = {
        provider: 'facebook',
        token: socialUser.id, // Use user ID as token for server verification
        email: socialUser.email,
        name: socialUser.name,
      };

      return await this.socialLogin(socialLoginData);
    } catch (error) {
      console.error('Facebook login error:', error);
      throw error;
    }
  }

  async loginWithApple(): Promise<AuthResponse> {
    try {
      const socialUser: SocialUser = await appleAuthService.signIn();

      const socialLoginData: SocialLoginData = {
        provider: 'apple',
        token: socialUser.id, // Use user ID as token for server verification
        email: socialUser.email,
        name: socialUser.name,
      };

      return await this.socialLogin(socialLoginData);
    } catch (error) {
      console.error('Apple login error:', error);
      throw error;
    }
  }

  async logoutFromSocialProviders(): Promise<void> {
    try {
      await Promise.allSettled([
        googleAuthService.signOut(),
        facebookAuthService.signOut(),
        appleAuthService.signOut(),
      ]);
    } catch (error) {
      console.error('Social providers logout error:', error);
      // Don't throw error for social logout failures
    }
  }

  // Token validation
  async isTokenValid(): Promise<boolean> {
    try {
      const token = await AsyncStorage.getItem('@auth_token');
      if (!token) return false;

      // Decode JWT token to check expiration
      const decoded = JSON.parse(atob(token.split('.')[1]));
      const now = Date.now() / 1000;

      return decoded.exp > now;
    } catch (error) {
      console.error('Token validation error:', error);
      return false;
    }
  }

  // Auto logout on token expiry
  setupAutoLogout(): void {
    // This would set up a timer to auto-logout when token expires
    // Or check token validity on app resume
  }

  // Clean up expired tokens
  async cleanupExpiredTokens(): Promise<void> {
    try {
      const isValid = await this.isTokenValid();
      if (!isValid) {
        await this.logout();
      }
    } catch (error) {
      console.error('Cleanup expired tokens error:', error);
    }
  }
}

export const authService = AuthService.getInstance();
export default authService;