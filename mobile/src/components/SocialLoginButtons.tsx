import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  Alert,
  ActivityIndicator,
  Platform
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { SocialAuthState } from '../types/auth';
import { authService } from '../services/authService';
import Toast from 'react-native-toast-message';

interface SocialLoginButtonsProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

const SocialLoginButtons: React.FC<SocialLoginButtonsProps> = ({ onSuccess, onError }) => {
  const [authState, setAuthState] = useState<SocialAuthState>({
    isLoading: false,
    provider: null,
    error: null,
  });

  useEffect(() => {
    checkSocialProviderAvailability();
  }, []);

  const checkSocialProviderAvailability = async () => {
    // Check which providers are available on this device/platform
    try {
      const googleAvailable = await checkGoogleAvailability();
      const appleAvailable = await checkAppleAvailability();

      // Update UI based on availability
    } catch (error) {
      console.error('Check provider availability error:', error);
    }
  };

  const checkGoogleAvailability = async (): Promise<boolean> => {
    try {
      // You would check Google Play Services availability here
      return true; // Simplified for now
    } catch (error) {
      return false;
    }
  };

  const checkAppleAvailability = async (): Promise<boolean> => {
    try {
      // Apple Sign In is only available on iOS 13+
      return Platform.OS === 'ios';
    } catch (error) {
      return false;
    }
  };

  const handleSocialLogin = async (provider: 'google' | 'facebook' | 'apple') => {
    try {
      setAuthState({ isLoading: true, provider, error: null });

      let userData;

      switch (provider) {
        case 'google':
          userData = await authService.loginWithGoogle();
          break;
        case 'facebook':
          userData = await authService.loginWithFacebook();
          break;
        case 'apple':
          userData = await authService.loginWithApple();
          break;
        default:
          throw new Error('Unsupported social provider');
      }

      setAuthState({ isLoading: false, provider: null, error: null });

      Toast.show({
        type: 'success',
        text1: `Logged in with ${provider}!`,
        position: 'top',
      });

      onSuccess?.();
    } catch (error: any) {
      console.error(`${provider} login error:`, error);

      const errorMessage = getSocialLoginErrorMessage(error, provider);

      setAuthState({
        isLoading: false,
        provider: null,
        error: { code: error.code || 'UNKNOWN', message: errorMessage, provider }
      });

      Toast.show({
        type: 'error',
        text1: errorMessage,
        position: 'top',
      });

      onError?.(errorMessage);
    }
  };

  const getSocialLoginErrorMessage = (error: any, provider: string): string => {
    // Handle specific error messages for each provider
    if (provider === 'google') {
      if (error.code === 'SIGN_IN_CANCELLED') {
        return 'Google sign-in was cancelled';
      } else if (error.code === 'PLAY_SERVICES_NOT_AVAILABLE') {
        return 'Google Play Services is not available';
      }
    } else if (provider === 'facebook') {
      if (error.message?.includes('cancelled')) {
        return 'Facebook login was cancelled';
      } else if (error.message?.includes('permissions')) {
        return 'Facebook login requires email permission';
      }
    } else if (provider === 'apple') {
      if (error.code === '1000') {
        return 'Apple sign-in was cancelled';
      } else if (error.code === '500') {
        return 'Apple sign-in failed';
      }
    }

    return error.message || `${provider} login failed`;
  };

  const GoogleButton = () => (
    <TouchableOpacity
      style={[styles.socialButton, styles.googleButton]}
      onPress={() => handleSocialLogin('google')}
      disabled={authState.isLoading}
    >
      {authState.isLoading && authState.provider === 'google' ? (
        <ActivityIndicator color="#757575" size="small" />
      ) : (
        <Icon name="google" size={24} color="#757575" />
      )}
      <Text style={[styles.socialButtonText, styles.googleButtonText]}>
        Continue with Google
      </Text>
    </TouchableOpacity>
  );

  const FacebookButton = () => (
    <TouchableOpacity
      style={[styles.socialButton, styles.facebookButton]}
      onPress={() => handleSocialLogin('facebook')}
      disabled={authState.isLoading}
    >
      {authState.isLoading && authState.provider === 'facebook' ? (
        <ActivityIndicator color="#FFFFFF" size="small" />
      ) : (
        <Icon name="facebook" size={24} color="#FFFFFF" />
      )}
      <Text style={[styles.socialButtonText, styles.facebookButtonText]}>
        Continue with Facebook
      </Text>
    </TouchableOpacity>
  );

  const AppleButton = () => {
    if (Platform.OS !== 'ios') return null;

    return (
      <TouchableOpacity
        style={[styles.socialButton, styles.appleButton]}
        onPress={() => handleSocialLogin('apple')}
        disabled={authState.isLoading}
      >
        {authState.isLoading && authState.provider === 'apple' ? (
          <ActivityIndicator color="#FFFFFF" size="small" />
        ) : (
          <Icon name="apple" size={24} color="#FFFFFF" />
        )}
        <Text style={[styles.socialButtonText, styles.appleButtonText]}>
          Continue with Apple
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.dividerContainer}>
        <View style={styles.divider} />
        <Text style={styles.dividerText}>OR</Text>
        <View style={styles.divider} />
      </View>

      <View style={styles.buttonsContainer}>
        <GoogleButton />
        <FacebookButton />
        <AppleButton />
      </View>

      <Text style={styles.termsText}>
        By continuing, you agree to our Terms of Service and Privacy Policy
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingHorizontal: 20,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: '#E0E0E0',
  },
  dividerText: {
    paddingHorizontal: 15,
    fontSize: 14,
    color: '#757575',
    fontWeight: '500',
  },
  buttonsContainer: {
    gap: 12,
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    minHeight: 48,
  },
  googleButton: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E0E0E0',
    borderWidth: 1,
  },
  googleButtonText: {
    color: '#757575',
  },
  facebookButton: {
    backgroundColor: '#1877F2',
    borderColor: '#1877F2',
  },
  facebookButtonText: {
    color: '#FFFFFF',
  },
  appleButton: {
    backgroundColor: '#000000',
    borderColor: '#000000',
  },
  appleButtonText: {
    color: '#FFFFFF',
  },
  socialButtonText: {
    marginLeft: 12,
    fontSize: 16,
    fontWeight: '500',
  },
  termsText: {
    textAlign: 'center',
    fontSize: 12,
    color: '#757575',
    marginTop: 20,
    lineHeight: 16,
  },
});

export default SocialLoginButtons;