export interface SocialUser {
  id: string;
  email: string;
  name: string;
  photo?: string;
  provider: 'google' | 'facebook' | 'apple';
}

export interface SocialLoginResponse {
  success: boolean;
  user: {
    id: string;
    email: string;
    name: string;
    avatar?: string;
    isNewUser: boolean;
  };
  accessToken: string;
  refreshToken: string;
}

export interface BiometricConfig {
  isAvailable: boolean;
  biometryType: 'TouchID' | 'FaceID' | 'Biometrics' | null;
  isEnrolled: boolean;
}

export interface BiometricAuthResult {
  success: boolean;
  error?: string;
}

export interface SocialAuthProviderConfig {
  google: {
    clientId?: string;
    webClientId?: string;
    isConfigured: boolean;
  };
  facebook: {
    appId?: string;
    isConfigured: boolean;
  };
  apple: {
    isConfigured: boolean;
    isSupported: boolean;
  };
}

export interface AuthError {
  code: string;
  message: string;
  provider?: string;
  details?: any;
}

export interface SocialAuthState {
  isLoading: boolean;
  provider: 'google' | 'facebook' | 'apple' | null;
  error: AuthError | null;
}