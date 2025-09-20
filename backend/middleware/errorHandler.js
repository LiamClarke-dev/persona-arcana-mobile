const Sentry = require('@sentry/node');

class APIError extends Error {
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.name = 'APIError';
  }
}

const errorHandler = (err, req, res, _next) => {
  // Log error to Sentry with context
  Sentry.withScope((scope) => {
    scope.setUser(req.user ? { id: req.user._id, email: req.user.email } : undefined);
    scope.setContext('request', {
      url: req.url,
      method: req.method,
      body: req.body,
      params: req.params,
      query: req.query,
      headers: req.headers,
    });
    scope.setLevel('error');
    Sentry.captureException(err);
  });

  // Handle known error types
  if (err instanceof APIError) {
    return res.status(err.statusCode).json({
      success: false,
      data: null,
      error: err.message,
      code: err.code,
    });
  }

  // Handle Mongoose validation errors
  if (err.name === 'ValidationError') {
    const validationErrors = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({
      success: false,
      data: null,
      error: `Validation failed: ${validationErrors.join(', ')}`,
      code: 'VALIDATION_ERROR',
    });
  }

  // Handle Mongoose cast errors (invalid ObjectId)
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      data: null,
      error: 'Invalid ID format',
      code: 'INVALID_ID',
    });
  }

  // Handle MongoDB duplicate key errors
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(409).json({
      success: false,
      data: null,
      error: `${field} already exists`,
      code: 'DUPLICATE_ENTRY',
    });
  }

  // Handle file upload errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({
      success: false,
      data: null,
      error: 'File too large. Maximum size is 5MB.',
      code: 'FILE_TOO_LARGE',
    });
  }

  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    return res.status(400).json({
      success: false,
      data: null,
      error: 'Unexpected file field',
      code: 'INVALID_FILE_FIELD',
    });
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      data: null,
      error: 'Invalid token',
      code: 'INVALID_TOKEN',
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      data: null,
      error: 'Token expired',
      code: 'TOKEN_EXPIRED',
    });
  }

  // Default error response
  const statusCode = err.statusCode || 500;
  const message = process.env.NODE_ENV === 'production' 
    ? 'Internal server error' 
    : err.message;

  res.status(statusCode).json({
    success: false,
    data: null,
    error: message,
    code: 'INTERNAL_ERROR',
  });
};

// Async error wrapper
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Not found handler
const notFound = (req, res, next) => {
  const error = new APIError(`Not found - ${req.originalUrl}`, 404, 'NOT_FOUND');
  next(error);
};

module.exports = {
  APIError,
  errorHandler,
  asyncHandler,
  notFound,
};