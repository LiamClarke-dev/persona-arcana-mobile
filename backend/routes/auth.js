const express = require('express');
const passport = require('../config/passport');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');

const router = express.Router();

// Validation middleware
const validateAuthCallback = [
  // Add any additional validation if needed
];

/**
 * @route   GET /auth/google
 * @desc    Initiate Google OAuth flow
 * @access  Public
 */
router.get('/google', (req, res, next) => {
  console.log('Initiating Google OAuth flow');
  
  // Store the mobile app redirect URL if provided
  if (req.query.redirect_uri) {
    req.session.mobileRedirectUri = req.query.redirect_uri;
  }
  
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    accessType: 'offline',
    prompt: 'consent'
  })(req, res, next);
});

/**
 * @route   GET /auth/google/callback
 * @desc    Handle Google OAuth callback
 * @access  Public
 */
router.get('/google/callback', 
  passport.authenticate('google', { 
    failureRedirect: '/auth/error',
    session: false // We'll use JWT instead of sessions for API auth
  }),
  async (req, res) => {
    try {
      const user = req.user;
      
      if (!user) {
        console.error('No user returned from Google OAuth');
        return res.redirect('/auth/error?message=authentication_failed');
      }

      // Generate JWT token
      const token = jwt.sign(
        { 
          userId: user._id,
          email: user.email,
          name: user.name
        },
        process.env.JWT_SECRET,
        { 
          expiresIn: '30d',
          issuer: 'persona-arcana-api',
          audience: 'persona-arcana-mobile'
        }
      );

      console.log('Generated JWT token for user:', user.email);

      // Prepare user data for mobile app (exclude sensitive fields)
      const userData = {
        id: user._id,
        email: user.email,
        name: user.name,
        profileImage: user.profileImage,
        googleImage: user.googleImage,
        onboarding: user.onboarding,
        stats: user.stats,
        preferences: {
          notifications: user.preferences.notifications
        }
      };

      // Get mobile redirect URI from session or use default
      const mobileRedirectUri = req.session.mobileRedirectUri || 
        `${process.env.MOBILE_APP_SCHEME || 'exp://localhost:19000'}://auth`;

      // Clear the stored redirect URI
      delete req.session.mobileRedirectUri;

      // Redirect to mobile app with token and user data
      const redirectUrl = `${mobileRedirectUri}?token=${encodeURIComponent(token)}&user=${encodeURIComponent(JSON.stringify(userData))}`;
      
      console.log('Redirecting to mobile app:', mobileRedirectUri);
      res.redirect(redirectUrl);

    } catch (error) {
      console.error('OAuth callback error:', error);
      res.redirect('/auth/error?message=token_generation_failed');
    }
  }
);

/**
 * @route   GET /auth/error
 * @desc    Handle authentication errors
 * @access  Public
 */
router.get('/error', (req, res) => {
  const message = req.query.message || 'authentication_failed';
  const errorMessages = {
    authentication_failed: 'Authentication failed. Please try again.',
    token_generation_failed: 'Failed to generate authentication token.',
    no_email: 'Google account must have an email address.',
    user_creation_failed: 'Failed to create user account.'
  };

  const userMessage = errorMessages[message] || 'An authentication error occurred.';
  
  console.error('Authentication error:', message);

  // For mobile app, redirect with error
  const mobileRedirectUri = `${process.env.MOBILE_APP_SCHEME || 'exp://localhost:19000'}://auth`;
  const redirectUrl = `${mobileRedirectUri}?error=${encodeURIComponent(userMessage)}&code=${encodeURIComponent(message)}`;
  
  res.redirect(redirectUrl);
});

/**
 * @route   POST /auth/verify
 * @desc    Verify JWT token and return user data
 * @access  Private
 */
router.post('/verify', passport.authenticate('jwt', { session: false }), (req, res) => {
  try {
    const user = req.user;
    
    const userData = {
      id: user._id,
      email: user.email,
      name: user.name,
      profileImage: user.profileImage,
      googleImage: user.googleImage,
      onboarding: user.onboarding,
      stats: user.stats,
      preferences: {
        notifications: user.preferences.notifications
      }
    };

    res.json({
      success: true,
      data: {
        user: userData,
        tokenValid: true
      },
      error: null,
      code: null
    });

  } catch (error) {
    console.error('Token verification error:', error);
    res.status(500).json({
      success: false,
      data: null,
      error: 'Token verification failed',
      code: 'TOKEN_VERIFICATION_ERROR'
    });
  }
});

/**
 * @route   POST /auth/logout
 * @desc    Logout user (client-side token removal)
 * @access  Private
 */
router.post('/logout', passport.authenticate('jwt', { session: false }), (req, res) => {
  try {
    // Since we're using JWT, logout is handled client-side by removing the token
    // We can log the logout event for analytics
    console.log('User logged out:', req.user.email);
    
    res.json({
      success: true,
      data: {
        message: 'Logged out successfully'
      },
      error: null,
      code: null
    });

  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      data: null,
      error: 'Logout failed',
      code: 'LOGOUT_ERROR'
    });
  }
});

/**
 * @route   GET /auth/status
 * @desc    Get authentication status
 * @access  Public
 */
router.get('/status', (req, res) => {
  res.json({
    success: true,
    data: {
      googleOAuthConfigured: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
      jwtConfigured: !!process.env.JWT_SECRET,
      authEndpoints: {
        login: '/auth/google',
        callback: '/auth/google/callback',
        verify: '/auth/verify',
        logout: '/auth/logout'
      }
    },
    error: null,
    code: null
  });
});

module.exports = router;