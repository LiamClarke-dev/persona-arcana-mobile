// config/environment.js
const Joi = require('joi');

/**
 * Environment variable validation schema
 * Ensures all required variables are present and properly formatted
 */
const envSchema = Joi.object({
  // Basic Configuration
  NODE_ENV: Joi.string()
    .valid('development', 'staging', 'production')
    .default('development'),
  PORT: Joi.number()
    .port()
    .default(3000),

  // Database Configuration
  MONGODB_URI: Joi.string()
    .uri({ scheme: ['mongodb', 'mongodb+srv'] })
    .required()
    .messages({
      'string.uri': 'MONGODB_URI must be a valid MongoDB connection string',
      'any.required': 'MONGODB_URI is required. Get this from MongoDB Atlas dashboard.'
    }),

  // DigitalOcean Spaces Configuration
  DO_SPACES_ENDPOINT: Joi.string()
    .uri({ scheme: ['https'] })
    .required()
    .messages({
      'any.required': 'DO_SPACES_ENDPOINT is required. Example: https://nyc3.digitaloceanspaces.com'
    }),
  DO_SPACES_BUCKET: Joi.string()
    .min(3)
    .max(63)
    .pattern(/^[a-z0-9][a-z0-9-]*[a-z0-9]$/)
    .required()
    .messages({
      'string.pattern.base': 'DO_SPACES_BUCKET must be a valid bucket name (lowercase, alphanumeric, hyphens)',
      'any.required': 'DO_SPACES_BUCKET is required. Create a bucket in DigitalOcean Spaces.'
    }),
  DO_SPACES_ACCESS_KEY: Joi.string()
    .length(20)
    .required()
    .messages({
      'any.required': 'DO_SPACES_ACCESS_KEY is required. Generate from DigitalOcean → API → Spaces Keys.'
    }),
  DO_SPACES_SECRET_KEY: Joi.string()
    .min(40)
    .required()
    .messages({
      'any.required': 'DO_SPACES_SECRET_KEY is required. Generate from DigitalOcean → API → Spaces Keys.'
    }),
  DO_SPACES_REGION: Joi.string()
    .valid('nyc1', 'nyc3', 'ams3', 'sgp1', 'lon1', 'fra1', 'tor1', 'sfo2', 'sfo3', 'blr1', 'syd1')
    .default('nyc3'),

  // Authentication Configuration
  JWT_SECRET: Joi.string()
    .min(32)
    .required()
    .messages({
      'string.min': 'JWT_SECRET must be at least 32 characters long for security',
      'any.required': 'JWT_SECRET is required. Generate a secure random string.'
    }),
  GOOGLE_CLIENT_ID: Joi.string()
    .pattern(/\.apps\.googleusercontent\.com$/)
    .required()
    .messages({
      'string.pattern.base': 'GOOGLE_CLIENT_ID must end with .apps.googleusercontent.com',
      'any.required': 'GOOGLE_CLIENT_ID is required. Get from Google Cloud Console.'
    }),
  GOOGLE_CLIENT_SECRET: Joi.string()
    .min(24)
    .required()
    .messages({
      'any.required': 'GOOGLE_CLIENT_SECRET is required. Get from Google Cloud Console.'
    }),
  SESSION_SECRET: Joi.string()
    .min(32)
    .required()
    .messages({
      'string.min': 'SESSION_SECRET must be at least 32 characters long for security',
      'any.required': 'SESSION_SECRET is required. Generate a secure random string.'
    }),

  // Error Tracking (Optional)
  SENTRY_DSN: Joi.string()
    .uri({ scheme: ['https'] })
    .optional()
    .messages({
      'string.uri': 'SENTRY_DSN must be a valid HTTPS URL'
    }),
  SENTRY_RELEASE: Joi.string()
    .optional()
    .default('persona-arcana-backend@1.0.0'),
  SENTRY_ENVIRONMENT: Joi.string()
    .optional()
    .default(() => process.env.NODE_ENV || 'development'),

  // Security Configuration
  ALLOWED_ORIGINS: Joi.string()
    .optional()
    .default('http://localhost:3000,http://localhost:19006,exp://localhost:19000'),

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: Joi.number()
    .positive()
    .optional()
    .default(900000), // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: Joi.number()
    .positive()
    .optional()
    .default(100),

  // File Upload
  MAX_FILE_SIZE: Joi.number()
    .positive()
    .optional()
    .default(5242880), // 5MB
  ALLOWED_FILE_TYPES: Joi.string()
    .optional()
    .default('image/jpeg,image/png,image/webp'),

  // Logging
  LOG_LEVEL: Joi.string()
    .valid('error', 'warn', 'info', 'debug')
    .optional()
    .default('info'),
  DEBUG_MODE: Joi.boolean()
    .optional()
    .default(false),

  // Database Pool Settings
  DB_MAX_POOL_SIZE: Joi.number()
    .positive()
    .optional()
    .default(10),
  DB_SERVER_SELECTION_TIMEOUT_MS: Joi.number()
    .positive()
    .optional()
    .default(5000),
  DB_SOCKET_TIMEOUT_MS: Joi.number()
    .positive()
    .optional()
    .default(45000),

  // Future Phase Variables (Optional)
  OPENAI_API_KEY: Joi.string()
    .pattern(/^sk-/)
    .optional()
    .messages({
      'string.pattern.base': 'OPENAI_API_KEY must start with "sk-"'
    }),
  EXPO_ACCESS_TOKEN: Joi.string()
    .optional()

}).unknown(); // Allow unknown variables for flexibility

/**
 * Validate and parse environment variables
 * @returns {Object} Validated environment configuration
 * @throws {Error} If validation fails
 */
function validateEnvironment() {
  const { error, value } = envSchema.validate(process.env, {
    abortEarly: false,
    stripUnknown: true
  });

  if (error) {
    const errorMessages = error.details.map(detail => {
      return `❌ ${detail.message}`;
    });

    console.error('\n🚨 Environment Variable Validation Failed:\n');
    errorMessages.forEach(msg => console.error(msg));
    console.error('\n📖 Setup Guide:');
    console.error('   Backend: See backend/.env.example');
    console.error('   Production: Use DigitalOcean App Platform dashboard');
    console.error('   Google OAuth: https://console.developers.google.com/');
    console.error('   MongoDB: https://cloud.mongodb.com/');
    console.error('   DigitalOcean: https://cloud.digitalocean.com/spaces\n');

    throw new Error(`Environment validation failed: ${error.details.length} errors found`);
  }

  return value;
}

/**
 * Get environment-specific configuration
 * @param {Object} env - Validated environment variables
 * @returns {Object} Environment configuration
 */
function getEnvironmentConfig(env) {
  const isProduction = env.NODE_ENV === 'production';
  const isDevelopment = env.NODE_ENV === 'development';

  return {
    // Basic settings
    nodeEnv: env.NODE_ENV,
    port: env.PORT,
    isProduction,
    isDevelopment,

    // Database
    mongodb: {
      uri: env.MONGODB_URI,
      options: {
        maxPoolSize: env.DB_MAX_POOL_SIZE,
        serverSelectionTimeoutMS: env.DB_SERVER_SELECTION_TIMEOUT_MS,
        socketTimeoutMS: env.DB_SOCKET_TIMEOUT_MS,
      }
    },

    // DigitalOcean Spaces
    spaces: {
      endpoint: env.DO_SPACES_ENDPOINT,
      bucket: env.DO_SPACES_BUCKET,
      accessKeyId: env.DO_SPACES_ACCESS_KEY,
      secretAccessKey: env.DO_SPACES_SECRET_KEY,
      region: env.DO_SPACES_REGION
    },

    // Authentication
    auth: {
      jwtSecret: env.JWT_SECRET,
      sessionSecret: env.SESSION_SECRET,
      google: {
        clientId: env.GOOGLE_CLIENT_ID,
        clientSecret: env.GOOGLE_CLIENT_SECRET
      }
    },

    // Security
    security: {
      allowedOrigins: env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim()),
      rateLimit: {
        windowMs: env.RATE_LIMIT_WINDOW_MS,
        maxRequests: env.RATE_LIMIT_MAX_REQUESTS
      }
    },

    // File Upload
    upload: {
      maxFileSize: env.MAX_FILE_SIZE,
      allowedTypes: env.ALLOWED_FILE_TYPES.split(',').map(type => type.trim())
    },

    // Monitoring
    sentry: {
      dsn: env.SENTRY_DSN,
      release: env.SENTRY_RELEASE,
      environment: env.SENTRY_ENVIRONMENT
    },

    // Logging
    logging: {
      level: env.LOG_LEVEL,
      debug: env.DEBUG_MODE
    },

    // Future features
    openai: {
      apiKey: env.OPENAI_API_KEY
    },
    expo: {
      accessToken: env.EXPO_ACCESS_TOKEN
    }
  };
}

module.exports = {
  validateEnvironment,
  getEnvironmentConfig
};