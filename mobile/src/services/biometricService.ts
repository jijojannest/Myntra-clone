import ReactNativeBiometrics, { BiometryTypes } from 'react-native-biometrics';
import { BiometricConfig, BiometricAuthResult } from '../types/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

class BiometricService {
  private static instance: BiometricService;
  private rnBiometrics: ReactNativeBiometrics;

  static getInstance(): BiometricService {
    if (!BiometricService.instance) {
      BiometricService.instance = new BiometricService();
    }
    return BiometricService.instance;
  }

  constructor() {
    this.rnBiometrics = new ReactNativeBiometrics({
      allowDeviceCredentials: true,
    });
  }

  async isAvailable(): Promise<BiometricConfig> {
    try {
      const { available, biometryType } = await this.rnBiometrics.isSensorAvailable();

      const config: BiometricConfig = {
        isAvailable: available,
        biometryType: this.getBiometryType(biometryType),
        isEnrolled: false, // Will be checked separately
      };

      if (available) {
        config.isEnrolled = await this.checkBiometricEnrollment();
      }

      return config;
    } catch (error) {
      console.error('Check biometric availability error:', error);
      return {
        isAvailable: false,
        biometryType: null,
        isEnrolled: false,
      };
    }
  }

  async enrollBiometrics(): Promise<BiometricAuthResult> {
    try {
      const { available, biometryType } = await this.rnBiometrics.isSensorAvailable();

      if (!available) {
        return {
          success: false,
          error: 'Biometric authentication is not available on this device',
        };
      }

      // Check if already enrolled
      const isEnrolled = await this.checkBiometricEnrollment();
      if (isEnrolled) {
        return {
          success: true,
        };
      }

      // Create biometric keys
      const { publicKey } = await this.rnBiometrics.createKeys();

      if (!publicKey) {
        return {
          success: false,
          error: 'Failed to create biometric keys',
        };
      }

      // Store enrollment flag
      await AsyncStorage.setItem('@biometric_enrolled', 'true');

      return {
        success: true,
      };
    } catch (error: any) {
      console.error('Biometric enrollment error:', error);
      return {
        success: false,
        error: error.message || 'Failed to enroll biometrics',
      };
    }
  }

  async authenticate(promptMessage?: string): Promise<BiometricAuthResult> {
    try {
      const isEnrolled = await this.checkBiometricEnrollment();
      if (!isEnrolled) {
        return {
          success: false,
          error: 'Biometrics not enrolled. Please enable biometric login first.',
        };
      }

      const { available } = await this.rnBiometrics.isSensorAvailable();
      if (!available) {
        return {
          success: false,
          error: 'Biometric authentication is not available',
        };
      }

      const result = await this.rnBiometrics.simplePrompt({
        promptMessage: promptMessage || 'Authenticate with biometrics',
        cancelButtonText: 'Cancel',
      });

      if (result.success) {
        return {
          success: true,
        };
      } else {
        return {
          success: false,
          error: 'Biometric authentication was cancelled or failed',
        };
      }
    } catch (error: any) {
      console.error('Biometric authentication error:', error);
      return {
        success: false,
        error: error.message || 'Biometric authentication failed',
      };
    }
  }

  async authenticateWithKeyExists(): Promise<BiometricAuthResult> {
    try {
      const { keysExist } = await this.rnBiometrics.biometricKeysExist();

      if (!keysExist) {
        return {
          success: false,
          error: 'Biometric keys not found. Please enroll biometrics first.',
        };
      }

      const result = await this.rnBiometrics.simplePrompt({
        promptMessage: 'Authenticate to continue',
        cancelButtonText: 'Cancel',
      });

      return {
        success: result.success,
        error: result.success ? undefined : 'Biometric authentication was cancelled or failed',
      };
    } catch (error: any) {
      console.error('Key exists authentication error:', error);
      return {
        success: false,
        error: error.message || 'Biometric authentication failed',
      };
    }
  }

  async removeBiometricKeys(): Promise<BiometricAuthResult> {
    try {
      await this.rnBiometrics.deleteKeys();
      await AsyncStorage.removeItem('@biometric_enrolled');

      return {
        success: true,
      };
    } catch (error: any) {
      console.error('Remove biometric keys error:', error);
      return {
        success: false,
        error: error.message || 'Failed to remove biometric keys',
      };
    }
  }

  async enableBiometricLogin(): Promise<BiometricAuthResult> {
    try {
      // First authenticate with current credentials
      const authResult = await this.authenticate('Enable biometric login');
      if (!authResult.success) {
        return authResult;
      }

      // Then enroll biometrics if not already enrolled
      const enrollResult = await this.enrollBiometrics();
      if (enrollResult.success) {
        await AsyncStorage.setItem('@biometric_login_enabled', 'true');
      }

      return enrollResult;
    } catch (error: any) {
      console.error('Enable biometric login error:', error);
      return {
        success: false,
        error: error.message || 'Failed to enable biometric login',
      };
    }
  }

  async disableBiometricLogin(): Promise<BiometricAuthResult> {
    try {
      await AsyncStorage.removeItem('@biometric_login_enabled');
      await this.removeBiometricKeys();

      return {
        success: true,
      };
    } catch (error: any) {
      console.error('Disable biometric login error:', error);
      return {
        success: false,
        error: error.message || 'Failed to disable biometric login',
      };
    }
  }

  async isBiometricLoginEnabled(): Promise<boolean> {
    try {
      const enabled = await AsyncStorage.getItem('@biometric_login_enabled');
      const enrolled = await this.checkBiometricEnrollment();

      return enabled === 'true' && enrolled;
    } catch (error) {
      console.error('Check biometric login enabled error:', error);
      return false;
    }
  }

  async createBiometricSignature(payload: string): Promise<{ success: boolean; signature?: string; error?: string }> {
    try {
      const { available } = await this.rnBiometrics.isSensorAvailable();
      if (!available) {
        return {
          success: false,
          error: 'Biometric authentication is not available',
        };
      }

      // Create keys if they don't exist
      const { keysExist } = await this.rnBiometrics.biometricKeysExist();
      if (!keysExist) {
        await this.rnBiometrics.createKeys();
      }

      const result = await this.rnBiometrics.createSignature({
        promptMessage: 'Authenticate to sign request',
        payload,
      });

      if (result.success && result.signature) {
        return {
          success: true,
          signature: result.signature,
        };
      } else {
        return {
          success: false,
          error: 'Failed to create biometric signature',
        };
      }
    } catch (error: any) {
      console.error('Create biometric signature error:', error);
      return {
        success: false,
        error: error.message || 'Failed to create biometric signature',
      };
    }
  }

  private async checkBiometricEnrollment(): Promise<boolean> {
    try {
      const enrolled = await AsyncStorage.getItem('@biometric_enrolled');
      const { keysExist } = await this.rnBiometrics.biometricKeysExist();

      return enrolled === 'true' || keysExist;
    } catch (error) {
      console.error('Check biometric enrollment error:', error);
      return false;
    }
  }

  private getBiometryType(biometryType?: BiometryTypes): BiometricConfig['biometryType'] {
    if (!biometryType) return null;

    switch (biometryType) {
      case BiometryTypes.TouchID:
        return 'TouchID';
      case BiometryTypes.FaceID:
        return 'FaceID';
      case BiometryTypes.Biometrics:
        return 'Biometrics';
      default:
        return 'Biometrics';
    }
  }
}

export default BiometricService.getInstance();