const Sentry = require('@sentry/node');

// Initialize Sentry
const initSentry = () => {
  if (!process.env.SENTRY_DSN) {
    console.warn('⚠️  SENTRY_DSN not configured. Error tracking disabled.');
    return;
  }

  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    
    // Performance monitoring
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    
    // Profiling (optional, for performance insights)
    profilesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    
    // Release tracking
    release: process.env.SENTRY_RELEASE || 'persona-arcana-backend@1.0.0',
    
    // Configure which errors to capture
    beforeSend(event, hint) {
      // Don't send certain errors in development
      if (process.env.NODE_ENV === 'development') {
        // Skip validation errors in development
        if (hint.originalException?.code === 'VALIDATION_ERROR') {
          return null;
        }
      }
      
      // Filter out sensitive information
      if (event.request) {
        // Remove sensitive headers
        if (event.request.headers) {
          delete event.request.headers.authorization;
          delete event.request.headers.cookie;
        }
        
        // Remove sensitive body data
        if (event.request.data && typeof event.request.data === 'object') {
          const sanitized = { ...event.request.data };
          delete sanitized.password;
          delete sanitized.token;
          delete sanitized.secret;
          event.request.data = sanitized;
        }
      }
      
      return event;
    },
    
    // Configure tags
    initialScope: {
      tags: {
        component: 'backend-api',
        version: '1.0.0',
      },
    },
  });

  console.log('✅ Sentry initialized for error tracking');
};

// Sentry middleware for Express
const sentryMiddleware = () => {
  return [
    // The request handler must be the first middleware on the app
    Sentry.Handlers.requestHandler({
      // Include request data
      request: ['cookies', 'data', 'headers', 'method', 'query_string', 'url'],
      // Include user data
      user: ['id', 'email'],
    }),
    
    // TracingHandler creates a trace for every incoming request
    Sentry.Handlers.tracingHandler(),
  ];
};

// Sentry error handler (must be used after all other middleware)
const sentryErrorHandler = () => {
  return Sentry.Handlers.errorHandler({
    shouldHandleError(error) {
      // Capture all errors with status code >= 500
      if (error.status >= 500) {
        return true;
      }
      
      // Capture specific error types even if status < 500
      if (error.name === 'ValidationError' || error.code === 'MONGODB_ERROR') {
        return true;
      }
      
      return false;
    },
  });
};

// Manual error capture utility
const captureError = (error, context = {}) => {
  Sentry.withScope((scope) => {
    // Add context
    Object.keys(context).forEach(key => {
      scope.setContext(key, context[key]);
    });
    
    // Capture the error
    Sentry.captureException(error);
  });
};

// Manual message capture utility
const captureMessage = (message, level = 'info', context = {}) => {
  Sentry.withScope((scope) => {
    scope.setLevel(level);
    
    // Add context
    Object.keys(context).forEach(key => {
      scope.setContext(key, context[key]);
    });
    
    // Capture the message
    Sentry.captureMessage(message);
  });
};

// Performance monitoring utilities
const startTransaction = (name, op = 'http.server') => {
  return Sentry.startTransaction({ name, op });
};

const addBreadcrumb = (message, category = 'custom', level = 'info', data = {}) => {
  Sentry.addBreadcrumb({
    message,
    category,
    level,
    data,
    timestamp: Date.now() / 1000,
  });
};

module.exports = {
  initSentry,
  sentryMiddleware,
  sentryErrorHandler,
  captureError,
  captureMessage,
  startTransaction,
  addBreadcrumb,
};