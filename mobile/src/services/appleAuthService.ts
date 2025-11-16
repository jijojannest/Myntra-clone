import appleAuth, { AppleAuthRequest, AppleAuthRequestOperation, AppleAuthCredentialState } from '@invertase/react-native-apple-authentication';

interface SocialUser {
  id: string;
  email: string;
  name: string;
  photo?: string;
  provider: 'google' | 'facebook' | 'apple';
}

class AppleAuthService {
  private static instance: AppleAuthService;

  static getInstance(): AppleAuthService {
    if (!AppleAuthService.instance) {
      AppleAuthService.instance = new AppleAuthService();
    }
    return AppleAuthService.instance;
  }

  async signIn(): Promise<SocialUser> {
    try {
      // Check if Apple Sign In is available
      if (!(await appleAuth.isSupported())) {
        throw new Error('Apple Sign In is not supported on this device');
      }

      // Configure Apple Sign In request
      const appleAuthRequest: AppleAuthRequest = {
        requestedOperation: AppleAuthRequestOperation.LOGIN,
        requestedScopes: [appleAuth.Scope.EMAIL, appleAuth.Scope.FULL_NAME],
      };

      // Perform sign in
      const appleAuthCredential = await appleAuth.performRequest(appleAuthRequest);

      if (!appleAuthCredential) {
        throw new Error('Failed to get Apple credentials');
      }

      // Get user identity token
      const { identityToken, user, email, fullName } = appleAuthCredential;

      if (!identityToken) {
        throw new Error('Failed to get identity token from Apple');
      }

      // Extract user information
      const givenName = fullName?.givenName || '';
      const familyName = fullName?.familyName || '';
      const name = givenName || familyName ? `${givenName} ${familyName}`.trim() : 'Apple User';

      const socialUser: SocialUser = {
        id: user || email || '',
        email: email || '',
        name: name,
        photo: undefined, // Apple doesn't provide profile photos
        provider: 'apple',
      };

      return socialUser;
    } catch (error: any) {
      console.error('Apple sign in error:', error);
      throw new Error(this.getErrorMessage(error));
    }
  }

  async signOut(): Promise<void> {
    try {
      // Apple Sign In doesn't require explicit sign out
      // The user needs to sign out from their Apple ID at system level
      console.log('Apple sign out completed');
    } catch (error) {
      console.error('Apple sign out error:', error);
      throw new Error('Failed to sign out from Apple');
    }
  }

  async getCredentialState(): Promise<AppleAuthCredentialState | null> {
    try {
      if (!(await appleAuth.isSupported())) {
        return null;
      }

      return await appleAuth.getCredentialStateForUser();
    } catch (error) {
      console.error('Get credential state error:', error);
      return null;
    }
  }

  async isSupported(): Promise<boolean> {
    try {
      return await appleAuth.isSupported();
    } catch (error) {
      console.error('Check Apple auth support error:', error);
      return false;
    }
  }

  async refreshCredentials(): Promise<boolean> {
    try {
      if (!(await appleAuth.isSupported())) {
        return false;
      }

      const credentialState = await appleAuth.getCredentialStateForUser();

      if (credentialState === AppleAuthCredentialState.AUTHORIZED) {
        return true;
      }

      return false;
    } catch (error) {
      console.error('Refresh Apple credentials error:', error);
      return false;
    }
  }

  private getErrorMessage(error: any): string {
    if (error.code === appleAuth.Error.CANCELED) {
      return 'Sign in was cancelled';
    } else if (error.code === appleAuth.Error.FAILED) {
      return 'Sign in failed';
    } else if (error.code === appleAuth.Error.INVALID_RESPONSE) {
      return 'Invalid response from Apple';
    } else if (error.code === appleAuth.Error.NOT_HANDLED) {
      return 'Sign in not handled';
    } else if (error.code === appleAuth.Error.UNKNOWN) {
      return 'An unknown error occurred during Apple sign in';
    } else {
      return error.message || 'An error occurred during Apple sign in';
    }
  }
}

// Export Apple auth error codes for error handling
export const AppleAuthError = {
  CANCELED: appleAuth.Error.CANCELED,
  FAILED: appleAuth.Error.FAILED,
  INVALID_RESPONSE: appleAuth.Error.INVALID_RESPONSE,
  NOT_HANDLED: appleAuth.Error.NOT_HANDLED,
  UNKNOWN: appleAuth.Error.UNKNOWN,
};

export default AppleAuthService.getInstance();