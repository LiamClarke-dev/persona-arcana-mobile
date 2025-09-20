const morgan = require('morgan');
const Sentry = require('@sentry/node');

// Custom token for user ID
morgan.token('user-id', (req) => {
  return req.user ? req.user._id : 'anonymous';
});

// Custom token for request ID (for tracing)
morgan.token('request-id', (req) => {
  return req.id || 'no-id';
});

// Custom token for response time in different format
morgan.token('response-time-ms', (req, _res) => {
  const responseTime = morgan['response-time'](req, _res);
  return responseTime ? `${responseTime}ms` : '-';
});

// Development logging format
const developmentFormat = ':method :url :status :response-time-ms - :user-id';

// Production logging format (more detailed)
const productionFormat = ':remote-addr - :user-id [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" :response-time-ms';

// Create logger based on environment
const createLogger = () => {
  const format = process.env.NODE_ENV === 'production' ? productionFormat : developmentFormat;
  
  return morgan(format, {
    // Skip logging for health checks in production
    skip: (req, res) => {
      if (process.env.NODE_ENV === 'production' && req.url === '/health') {
        return true;
      }
      return false;
    },
    
    // Custom stream for production (could integrate with external logging service)
    stream: process.env.NODE_ENV === 'production' ? process.stdout : process.stdout,
  });
};

// Request ID middleware for tracing
const requestId = (req, res, next) => {
  req.id = Math.random().toString(36).substring(2, 15);
  res.setHeader('X-Request-ID', req.id);
  next();
};

// Performance monitoring middleware
const performanceMonitor = (req, res, next) => {
  const start = Date.now();
  
  // Start Sentry transaction for performance monitoring
  const transaction = Sentry.startTransaction({
    name: `${req.method} ${req.route?.path || req.url}`,
    op: 'http.server',
  });
  
  // Add transaction to request for potential use in route handlers
  req.sentryTransaction = transaction;
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    
    // Set transaction status based on response
    if (res.statusCode >= 400) {
      transaction.setStatus('internal_error');
    } else {
      transaction.setStatus('ok');
    }
    
    // Add tags and context to transaction
    transaction.setTag('http.status_code', res.statusCode);
    transaction.setTag('http.method', req.method);
    transaction.setContext('request', {
      url: req.url,
      method: req.method,
      userAgent: req.get('User-Agent'),
      contentLength: req.get('Content-Length'),
    });
    
    if (req.user) {
      transaction.setContext('user', {
        id: req.user._id,
        email: req.user.email,
      });
    }
    
    // Finish the transaction
    transaction.finish();
    
    // Log slow requests (threshold: 3 seconds for API calls, 1 second for simple requests)
    const slowThreshold = req.url.includes('/api/') ? 3000 : 1000;
    if (duration > slowThreshold) {
      console.warn(`Slow request detected: ${req.method} ${req.url} took ${duration}ms`);
      
      // Send to Sentry for monitoring
      Sentry.withScope((scope) => {
        scope.setTag('slow_request', true);
        scope.setTag('response_time_category', 'slow');
        scope.setLevel('warning');
        scope.setContext('performance', {
          method: req.method,
          url: req.url,
          duration,
          threshold: slowThreshold,
          userAgent: req.get('User-Agent'),
          userId: req.user ? req.user._id : null,
        });
        Sentry.captureMessage(`Slow request: ${req.method} ${req.url} (${duration}ms)`, 'warning');
      });
    }
    
    // Log very slow requests as errors
    if (duration > 10000) { // 10 seconds
      console.error(`Very slow request: ${req.method} ${req.url} took ${duration}ms`);
      
      Sentry.withScope((scope) => {
        scope.setTag('very_slow_request', true);
        scope.setTag('response_time_category', 'very_slow');
        scope.setLevel('error');
        scope.setContext('performance', {
          method: req.method,
          url: req.url,
          duration,
          userAgent: req.get('User-Agent'),
          userId: req.user ? req.user._id : null,
        });
        Sentry.captureMessage(`Very slow request: ${req.method} ${req.url} (${duration}ms)`, 'error');
      });
    }
    
    // Log API usage metrics for production monitoring
    if (process.env.NODE_ENV === 'production') {
      const metrics = {
        type: 'api_request',
        method: req.method,
        url: req.url,
        status: res.statusCode,
        duration,
        userId: req.user ? req.user._id : null,
        timestamp: new Date().toISOString(),
        userAgent: req.get('User-Agent'),
        contentLength: res.get('Content-Length'),
      };
      
      console.log(JSON.stringify(metrics));
      
      // Add breadcrumb for request tracking
      Sentry.addBreadcrumb({
        message: `API Request: ${req.method} ${req.url}`,
        category: 'http',
        level: res.statusCode >= 400 ? 'error' : 'info',
        data: {
          status: res.statusCode,
          duration,
          method: req.method,
          url: req.url,
        },
      });
    }
  });
  
  next();
};

// Error logging middleware (separate from error handler)
const errorLogger = (err, req, res, next) => {
  // Log error details
  console.error('Error occurred:', {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    userId: req.user ? req.user._id : null,
    timestamp: new Date().toISOString(),
  });
  
  next(err);
};

module.exports = {
  createLogger,
  requestId,
  performanceMonitor,
  errorLogger,
};