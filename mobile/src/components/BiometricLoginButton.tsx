import React, { useState, useEffect } from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Platform
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { authService } from '../services/authService';
import { BiometricConfig } from '../types/auth';
import Toast from 'react-native-toast-message';

interface BiometricLoginButtonProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
  style?: any;
}

const BiometricLoginButton: React.FC<BiometricLoginButtonProps> = ({
  onSuccess,
  onError,
  style
}) => {
  const [biometricConfig, setBiometricConfig] = useState<BiometricConfig>({
    isAvailable: false,
    biometryType: null,
    isEnrolled: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isBiometricLoginEnabled, setIsBiometricLoginEnabled] = useState(false);

  useEffect(() => {
    checkBiometricAvailability();
  }, []);

  const checkBiometricAvailability = async () => {
    try {
      const config = await authService.getBiometricConfig();
      setBiometricConfig(config);

      const enabled = await authService.isBiometricLoginEnabled();
      setIsBiometricLoginEnabled(enabled);
    } catch (error) {
      console.error('Check biometric availability error:', error);
    }
  };

  const handleBiometricLogin = async () => {
    if (!biometricConfig.isAvailable) {
      Alert.alert('Biometrics Not Available', 'Biometric authentication is not available on this device.');
      return;
    }

    if (!isBiometricLoginEnabled) {
      showEnableBiometricsPrompt();
      return;
    }

    setIsLoading(true);

    try {
      const authData = await authService.authenticateWithBiometrics();

      if (authData) {
        Toast.show({
          type: 'success',
          text1: 'Biometric login successful!',
          position: 'top',
        });

        onSuccess?.();
      } else {
        Toast.show({
          type: 'error',
          text1: 'Biometric authentication failed',
          position: 'top',
        });

        onError?.('Biometric authentication failed');
      }
    } catch (error: any) {
      console.error('Biometric login error:', error);

      const errorMessage = getBiometricErrorMessage(error);

      Toast.show({
        type: 'error',
        text1: errorMessage,
        position: 'top',
      });

      onError?.(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const showEnableBiometricsPrompt = () => {
    const biometricType = getBiometricTypeDisplay();

    Alert.alert(
      'Enable Biometric Login',
      `Would you like to enable ${biometricType} login for faster access?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Enable',
          onPress: enableBiometricLogin,
        },
      ]
    );
  };

  const enableBiometricLogin = async () => {
    setIsLoading(true);

    try {
      const success = await authService.enableBiometricLogin();

      if (success) {
        const enabled = await authService.isBiometricLoginEnabled();
        setIsBiometricLoginEnabled(enabled);

        Toast.show({
          type: 'success',
          text1: `${getBiometricTypeDisplay()} login enabled!`,
          position: 'top',
        });

        // Now attempt biometric login
        await handleBiometricLogin();
      } else {
        Toast.show({
          type: 'error',
          text1: 'Failed to enable biometric login',
          position: 'top',
        });

        onError?.('Failed to enable biometric login');
      }
    } catch (error: any) {
      console.error('Enable biometric login error:', error);

      Toast.show({
        type: 'error',
        text1: error.message || 'Failed to enable biometric login',
        position: 'top',
      });

      onError?.(error.message || 'Failed to enable biometric login');
    } finally {
      setIsLoading(false);
    }
  };

  const getBiometricTypeDisplay = (): string => {
    switch (biometricConfig.biometryType) {
      case 'FaceID':
        return 'Face ID';
      case 'TouchID':
        return 'Touch ID';
      case 'Biometrics':
        return 'Fingerprint';
      default:
        return 'Biometric';
    }
  };

  const getBiometricErrorMessage = (error: any): string => {
    if (error.message?.includes('cancelled')) {
      return 'Biometric authentication was cancelled';
    } else if (error.message?.includes('not enrolled')) {
      return 'No biometric credentials enrolled on this device';
    } else if (error.message?.includes('not available')) {
      return 'Biometric authentication is not available';
    } else if (error.message?.includes('failed')) {
      return 'Biometric authentication failed. Please try again';
    } else {
      return error.message || 'Biometric authentication error';
    }
  };

  const getBiometricIcon = (): string => {
    switch (biometricConfig.biometryType) {
      case 'FaceID':
        return 'face';
      case 'TouchID':
        return 'fingerprint';
      case 'Biometrics':
        return 'fingerprint';
      default:
        return 'lock';
    }
  };

  // Don't render button if biometrics are not available
  if (!biometricConfig.isAvailable) {
    return null;
  }

  return (
    <TouchableOpacity
      style={[styles.button, style]}
      onPress={handleBiometricLogin}
      disabled={isLoading}
    >
      {isLoading ? (
        <ActivityIndicator color="#6200EE" size="small" />
      ) : (
        <>
          <Icon name={getBiometricIcon()} size={24} color="#6200EE" />
          <Text style={styles.buttonText}>
            {isBiometricLoginEnabled
              ? `Login with ${getBiometricTypeDisplay()}`
              : `Enable ${getBiometricTypeDisplay()} Login`
            }
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F5F5',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    minHeight: 48,
  },
  buttonText: {
    marginLeft: 12,
    fontSize: 16,
    fontWeight: '500',
    color: '#6200EE',
  },
});

export default BiometricLoginButton;