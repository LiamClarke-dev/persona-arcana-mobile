import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
// import { captureError, addBreadcrumb, wrapApiCall } from '../config/sentry';

// Complete the auth session for better UX
WebBrowser.maybeCompleteAuthSession();

class AuthService {
  constructor() {
    try {
      this.apiUrl = Constants.expoConfig?.extra?.apiUrl || 'http://localhost:3000';
      this.googleClientId = Constants.expoConfig?.extra?.googleClientId;
      
      console.log('AuthService initialized:', {
        apiUrl: this.apiUrl,
        hasGoogleClientId: !!this.googleClientId
      });
    } catch (error) {
      console.error('AuthService initialization error:', error);
      this.apiUrl = 'http://localhost:3000';
      this.googleClientId = null;
    }
  }

  /**
   * Initiate Google OAuth sign-in flow using WebBrowser
   * @returns {Promise<{success: boolean, user?: object, token?: string, error?: string}>}
   */
  async signInWithGoogle() {
    try {
      console.log('=== Starting Google OAuth flow ===');
      console.log('API URL:', this.apiUrl);
      console.log('Google Client ID configured:', !!this.googleClientId);

      // Validate configuration
      if (!this.apiUrl) {
        throw new Error('API URL not configured');
      }

      // Create redirect URI for the auth session
      let redirectUri;
      try {
        redirectUri = AuthSession.makeRedirectUri({
          scheme: 'personaarcana',
          path: 'auth'
        });
        console.log('Redirect URI created:', redirectUri);
      } catch (redirectError) {
        console.error('Failed to create redirect URI:', redirectError);
        throw new Error('Failed to create redirect URI: ' + redirectError.message);
      }

      // Build the auth URL with our backend endpoint
      const authUrl = `${this.apiUrl}/auth/google?redirect_uri=${encodeURIComponent(redirectUri)}`;
      console.log('Auth URL:', authUrl);

      // Use WebBrowser to open the auth URL
      console.log('Opening WebBrowser for authentication...');
      const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUri);

      console.log('WebBrowser result type:', result.type);
      console.log('WebBrowser result:', JSON.stringify(result, null, 2));

      if (result.type === 'success') {
        const { url } = result;
        
        // Parse the URL to extract token and user data
        const urlObj = new URL(url);
        const token = urlObj.searchParams.get('token');
        const userParam = urlObj.searchParams.get('user');
        const error = urlObj.searchParams.get('error');

        if (error) {
          console.error('Authentication error:', error);
          return {
            success: false,
            error: error
          };
        }

        if (!token || !userParam) {
          console.error('Missing token or user data in callback');
          return {
            success: false,
            error: 'Authentication failed - missing credentials'
          };
        }

        // Parse user data
        let user;
        try {
          user = JSON.parse(decodeURIComponent(userParam));
        } catch (parseError) {
          console.error('Failed to parse user data:', parseError);
          return {
            success: false,
            error: 'Authentication failed - invalid user data'
          };
        }

        console.log('Authentication successful for user:', user.email);

        return {
          success: true,
          token,
          user
        };
      } else if (result.type === 'cancel') {
        console.log('User cancelled authentication');
        return {
          success: false,
          error: 'Authentication cancelled'
        };
      } else {
        console.error('Authentication failed:', result);
        return {
          success: false,
          error: 'Authentication failed'
        };
      }
    } catch (error) {
      console.error('Auth service error:', error);
      // captureError(error, {
      //   operation: 'signInWithGoogle',
      //   apiUrl: this.apiUrl,
      //   hasGoogleClientId: !!this.googleClientId,
      // });
      return {
        success: false,
        error: error.message || 'Authentication failed'
      };
    }
  }

  /**
   * Verify JWT token with backend
   * @param {string} token - JWT token to verify
   * @returns {Promise<{success: boolean, user?: object, error?: string}>}
   */
  async verifyToken(token) {
    try {
    // return wrapApiCall(async () => {
      console.log('Verifying token with backend...');

      const response = await fetch(`${this.apiUrl}/auth/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (response.ok && data.success) {
        console.log('Token verification successful');
        // addBreadcrumb('Token verified successfully', 'auth', 'info');
        return {
          success: true,
          user: data.data.user
        };
      } else {
        console.error('Token verification failed:', data.error);
        // addBreadcrumb('Token verification failed', 'auth', 'warning', {
        //   error: data.error,
        //   status: response.status,
        // });
        return {
          success: false,
          error: data.error || 'Token verification failed'
        };
      }
    // }, 'verifyToken');
    } catch (error) {
      console.error('Token verification error:', error);
      return {
        success: false,
        error: error.message || 'Token verification failed'
      };
    }
  }

  /**
   * Logout user by calling backend and clearing local storage
   * @param {string} token - JWT token for authenticated logout
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async logout(token) {
    try {
    // return wrapApiCall(async () => {
      console.log('Logging out user...');

      // Call backend logout endpoint
      const response = await fetch(`${this.apiUrl}/auth/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (response.ok && data.success) {
        console.log('Backend logout successful');
        // addBreadcrumb('Backend logout successful', 'auth', 'info');
      } else {
        console.warn('Backend logout failed, but continuing with local cleanup:', data.error);
        // addBreadcrumb('Backend logout failed', 'auth', 'warning', {
        //   error: data.error,
        //   status: response.status,
        // });
      }

      // Always clear local storage regardless of backend response
      await AsyncStorage.multiRemove(['authToken', 'user']);
      // addBreadcrumb('Local auth data cleared', 'auth', 'info');
      
      return {
        success: true
      };
    // }, 'logout');
    } catch (error) {
      console.error('Logout error:', error);
      
      // Still clear local storage even if backend call fails
      try {
        await AsyncStorage.multiRemove(['authToken', 'user']);
      } catch (storageError) {
        console.error('Failed to clear local storage:', storageError);
      }
      
      return {
        success: false,
        error: error.message || 'Logout failed'
      };
    }
  }

  /**
   * Get stored authentication data
   * @returns {Promise<{token?: string, user?: object}>}
   */
  async getStoredAuth() {
    try {
      const [token, userJson] = await AsyncStorage.multiGet(['authToken', 'user']);
      
      const authToken = token[1];
      const user = userJson[1] ? JSON.parse(userJson[1]) : null;

      return {
        token: authToken,
        user
      };
    } catch (error) {
      console.error('Failed to get stored auth:', error);
      // captureError(error, {
      //   operation: 'getStoredAuth',
      // });
      return {};
    }
  }

  /**
   * Store authentication data
   * @param {string} token - JWT token
   * @param {object} user - User data
   * @returns {Promise<void>}
   */
  async storeAuth(token, user) {
    try {
      await AsyncStorage.multiSet([
        ['authToken', token],
        ['user', JSON.stringify(user)]
      ]);
      console.log('Authentication data stored successfully');
    } catch (error) {
      console.error('Failed to store auth data:', error);
      // captureError(error, {
      //   operation: 'storeAuth',
      // });
      throw error;
    }
  }

  /**
   * Clear stored authentication data
   * @returns {Promise<void>}
   */
  async clearAuth() {
    try {
      await AsyncStorage.multiRemove(['authToken', 'user']);
      console.log('Authentication data cleared');
    } catch (error) {
      console.error('Failed to clear auth data:', error);
      // captureError(error, {
      //   operation: 'clearAuth',
      // });
      throw error;
    }
  }
}

export default new AuthService();