import { GoogleSignin } from '@react-native-google-signin/google-signin';
import auth from '@react-native-firebase/auth';
import { GoogleSigninResponse, User } from '@react-native-google-signin/google-signin';

interface SocialUser {
  id: string;
  email: string;
  name: string;
  photo?: string;
  provider: 'google' | 'facebook' | 'apple';
}

class GoogleAuthService {
  private static instance: GoogleAuthService;

  static getInstance(): GoogleAuthService {
    if (!GoogleAuthService.instance) {
      GoogleAuthService.instance = new GoogleAuthService();
    }
    return GoogleAuthService.instance;
  }

  constructor() {
    this.configure();
  }

  private configure() {
    GoogleSignin.configure({
      webClientId: process.env.GOOGLE_WEB_CLIENT_ID,
      offlineAccess: true,
      hostedDomain: '',
      forceCodeForRefreshToken: true,
    });
  }

  async signIn(): Promise<SocialUser> {
    try {
      // Check if device supports Google Play Services
      await GoogleSignin.hasPlayServices();

      // Sign in with Google
      const userInfo: GoogleSigninResponse = await GoogleSignin.signIn();

      if (!userInfo.user) {
        throw new Error('Failed to get user information from Google');
      }

      const socialUser: SocialUser = {
        id: userInfo.user.id || '',
        email: userInfo.user.email || '',
        name: userInfo.user.name || '',
        photo: userInfo.user.photo || '',
        provider: 'google',
      };

      return socialUser;
    } catch (error: any) {
      console.error('Google sign in error:', error);
      throw new Error(this.getErrorMessage(error));
    }
  }

  async signOut(): Promise<void> {
    try {
      await GoogleSignin.signOut();
    } catch (error) {
      console.error('Google sign out error:', error);
      throw new Error('Failed to sign out from Google');
    }
  }

  async getCurrentUser(): Promise<SocialUser | null> {
    try {
      const userInfo = await GoogleSignin.getCurrentUser();

      if (!userInfo) {
        return null;
      }

      return {
        id: userInfo.id || '',
        email: userInfo.email || '',
        name: userInfo.name || '',
        photo: userInfo.photo || '',
        provider: 'google',
      };
    } catch (error) {
      console.error('Get current user error:', error);
      return null;
    }
  }

  async isSignedIn(): Promise<boolean> {
    try {
      return await GoogleSignin.isSignedIn();
    } catch (error) {
      console.error('Check sign in status error:', error);
      return false;
    }
  }

  async revokeAccess(): Promise<void> {
    try {
      await GoogleSignin.revokeAccess();
    } catch (error) {
      console.error('Revoke access error:', error);
      throw new Error('Failed to revoke Google access');
    }
  }

  private getErrorMessage(error: any): string {
    if (error.code === statusCodes.SIGN_IN_CANCELLED) {
      return 'Sign in was cancelled';
    } else if (error.code === statusCodes.IN_PROGRESS) {
      return 'Sign in is already in progress';
    } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
      return 'Google Play Services is not available';
    } else {
      return error.message || 'An error occurred during Google sign in';
    }
  }
}

// Export status codes for error handling
export const statusCodes = {
  SIGN_IN_CANCELLED: 'SIGN_IN_CANCELLED',
  IN_PROGRESS: 'IN_PROGRESS',
  PLAY_SERVICES_NOT_AVAILABLE: 'PLAY_SERVICES_NOT_AVAILABLE',
};

export default GoogleAuthService.getInstance();