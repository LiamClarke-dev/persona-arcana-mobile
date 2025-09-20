// Security middleware configuration
const rateLimit = require('express-rate-limit');
const compression = require('compression');

// CORS configuration for mobile app
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    // In development, allow all origins
    if (process.env.NODE_ENV === 'development') {
      return callback(null, true);
    }
    
    // In production, check against allowed origins
    const allowedOrigins = [
      'exp://localhost:19000', // Expo development
      'exp://192.168.1.100:19000', // Local network Expo
      process.env.MOBILE_APP_SCHEME, // Production mobile app
      process.env.FRONTEND_URL, // Web frontend if needed
    ].filter(Boolean);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
};

// Rate limiting configuration
const createRateLimit = (windowMs, max, message) => {
  return rateLimit({
    windowMs,
    max,
    message: {
      success: false,
      data: null,
      error: message,
      code: 'RATE_LIMIT_EXCEEDED',
    },
    standardHeaders: true,
    legacyHeaders: false,
  });
};

// Different rate limits for different endpoints
const rateLimits = {
  // General API rate limit
  general: createRateLimit(
    15 * 60 * 1000, // 15 minutes
    100, // limit each IP to 100 requests per windowMs
    'Too many requests from this IP, please try again later'
  ),
  
  // Stricter rate limit for auth endpoints
  auth: createRateLimit(
    15 * 60 * 1000, // 15 minutes
    10, // limit each IP to 10 auth requests per windowMs
    'Too many authentication attempts, please try again later'
  ),
  
  // File upload rate limit
  upload: createRateLimit(
    60 * 60 * 1000, // 1 hour
    20, // limit each IP to 20 uploads per hour
    'Too many file uploads, please try again later'
  ),
  
  // AI processing rate limit (more generous for authenticated users)
  aiProcessing: createRateLimit(
    60 * 60 * 1000, // 1 hour
    50, // limit each IP to 50 AI requests per hour
    'Too many AI processing requests, please try again later'
  ),
};

// Helmet configuration for security headers
const helmetConfig = {
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://api.openai.com", "https://*.sentry.io"],
    },
  },
  crossOriginEmbedderPolicy: false, // Disable for mobile app compatibility
};

// Compression configuration
const compressionConfig = {
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  },
  level: 6, // Compression level (1-9)
  threshold: 1024, // Only compress responses larger than 1KB
};

module.exports = {
  corsOptions,
  rateLimits,
  helmetConfig,
  compressionConfig,
};