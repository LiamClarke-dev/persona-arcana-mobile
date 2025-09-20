import { createContext, useContext, useState, useEffect } from 'react';
import authService from '../services/authService';
// import { captureError, setUserContext, clearUserContext, addBreadcrumb } from '../config/sentry';

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [authToken, setAuthToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState(null);

  // Check for existing authentication on app launch
  useEffect(() => {
    checkAuthState();
  }, []);

  const checkAuthState = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get stored authentication data
      const { token, user: storedUser } = await authService.getStoredAuth();

      if (token && storedUser) {
        // Verify token with backend
        const verificationResult = await authService.verifyToken(token);
        
        if (verificationResult.success) {
          // Token is valid, update state
          setAuthToken(token);
          setUser(verificationResult.user);
          setIsAuthenticated(true);
          
          // Set user context in Sentry
          // setUserContext(verificationResult.user);
          // addBreadcrumb('Authentication restored', 'auth', 'info', {
          //   userId: verificationResult.user.id,
          // });
          
          console.log('Authentication restored for user:', verificationResult.user.email);
        } else {
          // Token is invalid, clear stored data
          console.log('Stored token is invalid, clearing auth data');
          await authService.clearAuth();
          setIsAuthenticated(false);
        }
      } else {
        // No stored authentication
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('Error checking auth state:', error);
      // captureError(error, {
      //   operation: 'checkAuthState',
      //   timestamp: new Date().toISOString(),
      // });
      setError('Failed to restore authentication');
      setIsAuthenticated(false);
      
      // Clear potentially corrupted auth data
      try {
        await authService.clearAuth();
      } catch (clearError) {
        console.error('Failed to clear auth data:', clearError);
        // captureError(clearError, {
        //   operation: 'clearAuth',
        //   context: 'checkAuthState cleanup',
        // });
      }
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Starting Google sign-in...');
      
      // Use auth service to handle Google OAuth
      const result = await authService.signInWithGoogle();
      
      if (result.success) {
        // Store authentication data
        await authService.storeAuth(result.token, result.user);
        
        // Update state
        setAuthToken(result.token);
        setUser(result.user);
        setIsAuthenticated(true);
        
        // Set user context in Sentry
        // setUserContext(result.user);
        // addBreadcrumb('User signed in', 'auth', 'info', {
        //   userId: result.user.id,
        //   method: 'google',
        // });
        
        console.log('Sign-in successful for user:', result.user.email);
        return { success: true };
      } else {
        setError(result.error);
        console.error('Sign-in failed:', result.error);
        return { success: false, error: result.error };
      }
    } catch (error) {
      const errorMessage = error.message || 'Sign-in failed';
      setError(errorMessage);
      console.error('Sign-in error:', error);
      // captureError(error, {
      //   operation: 'signInWithGoogle',
      //   timestamp: new Date().toISOString(),
      // });
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Signing out user...');
      
      // Use auth service to handle logout
      const result = await authService.logout(authToken);
      
      // Clear state regardless of backend response
      setAuthToken(null);
      setUser(null);
      setIsAuthenticated(false);
      
      // Clear user context in Sentry
      // clearUserContext();
      // addBreadcrumb('User signed out', 'auth', 'info');
      
      console.log('Sign-out completed');
      return { success: true };
    } catch (error) {
      const errorMessage = error.message || 'Sign-out failed';
      setError(errorMessage);
      console.error('Sign-out error:', error);
      // captureError(error, {
      //   operation: 'signOut',
      //   timestamp: new Date().toISOString(),
      // });
      
      // Still clear state even if there was an error
      setAuthToken(null);
      setUser(null);
      setIsAuthenticated(false);
      
      // Clear user context in Sentry even on error
      // clearUserContext();
      
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const updateUser = async (updatedUserData) => {
    try {
      const newUserData = { ...user, ...updatedUserData };
      
      // Store updated user data
      await authService.storeAuth(authToken, newUserData);
      
      // Update state
      setUser(newUserData);
      
      console.log('User data updated');
      return { success: true };
    } catch (error) {
      const errorMessage = error.message || 'Failed to update user';
      setError(errorMessage);
      console.error('Error updating user:', error);
      // captureError(error, {
      //   operation: 'updateUser',
      //   timestamp: new Date().toISOString(),
      // });
      return { success: false, error: errorMessage };
    }
  };

  const clearError = () => {
    setError(null);
  };

  const value = {
    user,
    authToken,
    loading,
    isAuthenticated,
    error,
    signInWithGoogle,
    signOut,
    updateUser,
    checkAuthState,
    clearError,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;