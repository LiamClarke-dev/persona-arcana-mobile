const passport = require('../config/passport');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Middleware to require JWT authentication
 */
const requireAuth = (req, res, next) => {
  passport.authenticate('jwt', { session: false }, (err, user, info) => {
    if (err) {
      console.error('Authentication error:', err);
      return res.status(500).json({
        success: false,
        data: null,
        error: 'Authentication error',
        code: 'AUTH_ERROR'
      });
    }

    if (!user) {
      const message = info?.message || 'Authentication required';
      return res.status(401).json({
        success: false,
        data: null,
        error: message,
        code: 'UNAUTHORIZED'
      });
    }

    req.user = user;
    next();
  })(req, res, next);
};

/**
 * Middleware to optionally authenticate (user may or may not be logged in)
 */
const optionalAuth = (req, res, next) => {
  passport.authenticate('jwt', { session: false }, (err, user, info) => {
    if (err) {
      console.error('Optional authentication error:', err);
    }

    // Set user if authenticated, but don't fail if not
    req.user = user || null;
    next();
  })(req, res, next);
};

/**
 * Middleware to validate JWT token manually (for custom handling)
 */
const validateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        data: null,
        error: 'No token provided',
        code: 'NO_TOKEN'
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        data: null,
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    req.user = user;
    req.token = decoded;
    next();

  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        data: null,
        error: 'Invalid token',
        code: 'INVALID_TOKEN'
      });
    }

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        data: null,
        error: 'Token expired',
        code: 'TOKEN_EXPIRED'
      });
    }

    console.error('Token validation error:', error);
    return res.status(500).json({
      success: false,
      data: null,
      error: 'Token validation failed',
      code: 'TOKEN_VALIDATION_ERROR'
    });
  }
};

/**
 * Middleware to check if user owns a resource
 */
const requireOwnership = (resourceUserIdField = 'userId') => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        data: null,
        error: 'Authentication required',
        code: 'UNAUTHORIZED'
      });
    }

    // Get resource user ID from request params, body, or custom field
    let resourceUserId;
    
    if (req.params[resourceUserIdField]) {
      resourceUserId = req.params[resourceUserIdField];
    } else if (req.body[resourceUserIdField]) {
      resourceUserId = req.body[resourceUserIdField];
    } else if (req.resource && req.resource[resourceUserIdField]) {
      resourceUserId = req.resource[resourceUserIdField];
    }

    if (!resourceUserId) {
      return res.status(400).json({
        success: false,
        data: null,
        error: 'Resource user ID not found',
        code: 'RESOURCE_USER_ID_MISSING'
      });
    }

    // Check if the authenticated user owns the resource
    if (req.user._id.toString() !== resourceUserId.toString()) {
      return res.status(403).json({
        success: false,
        data: null,
        error: 'Access denied. You can only access your own resources.',
        code: 'ACCESS_DENIED'
      });
    }

    next();
  };
};

/**
 * Generate JWT token for user
 */
const generateToken = (user) => {
  return jwt.sign(
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
};

/**
 * Verify JWT token
 */
const verifyToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET);
};

module.exports = {
  requireAuth,
  optionalAuth,
  validateToken,
  requireOwnership,
  generateToken,
  verifyToken
};