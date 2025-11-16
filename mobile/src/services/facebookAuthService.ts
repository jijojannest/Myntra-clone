import { LoginManager, AccessToken, Profile, GraphRequest, GraphRequestManager } from 'react-native-fbsdk-next';

interface SocialUser {
  id: string;
  email: string;
  name: string;
  photo?: string;
  provider: 'google' | 'facebook' | 'apple';
}

class FacebookAuthService {
  private static instance: FacebookAuthService;

  static getInstance(): FacebookAuthService {
    if (!FacebookAuthService.instance) {
      FacebookAuthService.instance = new FacebookAuthService();
    }
    return FacebookAuthService.instance;
  }

  async signIn(): Promise<SocialUser> {
    try {
      // Attempt login with limited permissions
      const result = await LoginManager.logInWithPermissions(['public_profile', 'email']);

      if (result.isCancelled) {
        throw new Error('Facebook login was cancelled');
      }

      if (!result.grantedPermissions || !result.grantedPermissions.includes('email')) {
        throw new Error('Email permission is required for Facebook login');
      }

      // Get access token
      const accessTokenData = await AccessToken.getCurrentAccessToken();

      if (!accessTokenData) {
        throw new Error('Failed to get Facebook access token');
      }

      const accessToken = accessTokenData.accessToken.toString();

      // Get user profile information
      const profile = await Profile.getCurrentProfile();

      if (!profile) {
        // If profile is not available, fetch it using Graph API
        return await this.fetchUserProfile(accessToken);
      }

      const socialUser: SocialUser = {
        id: profile.userID,
        email: profile.email || await this.getUserEmail(accessToken),
        name: `${profile.firstName || ''} ${profile.lastName || ''}`.trim() || profile.name || 'Facebook User',
        photo: profile.imageURL || `https://graph.facebook.com/${profile.userID}/picture?type=large`,
        provider: 'facebook',
      };

      return socialUser;
    } catch (error: any) {
      console.error('Facebook sign in error:', error);
      throw new Error(this.getErrorMessage(error));
    }
  }

  async signOut(): Promise<void> {
    try {
      await LoginManager.logOut();
    } catch (error) {
      console.error('Facebook sign out error:', error);
      throw new Error('Failed to sign out from Facebook');
    }
  }

  async getCurrentUser(): Promise<SocialUser | null> {
    try {
      const accessTokenData = await AccessToken.getCurrentAccessToken();
      if (!accessTokenData) {
        return null;
      }

      const profile = await Profile.getCurrentProfile();
      if (!profile) {
        return null;
      }

      return {
        id: profile.userID,
        email: profile.email || '',
        name: `${profile.firstName || ''} ${profile.lastName || ''}`.trim() || profile.name || 'Facebook User',
        photo: profile.imageURL || `https://graph.facebook.com/${profile.userID}/picture?type=large`,
        provider: 'facebook',
      };
    } catch (error) {
      console.error('Get current Facebook user error:', error);
      return null;
    }
  }

  private async fetchUserProfile(accessToken: string): Promise<SocialUser> {
    return new Promise((resolve, reject) => {
      const profileRequestParams = {
        fields: {
          string: 'id,name,email,picture.type(large)',
        },
      };

      const profileRequest = new GraphRequest(
        '/me',
        { accessToken, parameters: profileRequestParams },
        (error, result) => {
          if (error) {
            reject(new Error('Failed to fetch Facebook profile'));
            return;
          }

          const userData = result as any;
          const picture = userData.picture?.data;

          const socialUser: SocialUser = {
            id: userData.id,
            email: userData.email || '',
            name: userData.name || 'Facebook User',
            photo: picture?.url || `https://graph.facebook.com/${userData.id}/picture?type=large`,
            provider: 'facebook',
          };

          resolve(socialUser);
        }
      );

      new GraphRequestManager().addRequest(profileRequest).start();
    });
  }

  private async getUserEmail(accessToken: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const emailRequest = new GraphRequest(
        '/me',
        { accessToken, parameters: { fields: { string: 'email' } } },
        (error, result) => {
          if (error) {
            resolve('');
            return;
          }

          const userData = result as any;
          resolve(userData.email || '');
        }
      );

      new GraphRequestManager().addRequest(emailRequest).start();
    });
  }

  private getErrorMessage(error: any): string {
    if (error.message?.includes('cancelled')) {
      return 'Facebook login was cancelled';
    } else if (error.message?.includes('permissions')) {
      return 'Facebook login requires email permission';
    } else if (error.message?.includes('network')) {
      return 'Network error occurred during Facebook login';
    } else {
      return error.message || 'An error occurred during Facebook login';
    }
  }
}

export default FacebookAuthService.getInstance();