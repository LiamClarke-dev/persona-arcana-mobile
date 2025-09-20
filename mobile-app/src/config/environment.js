// src/config/environment.js
import Constants from 'expo-constants';

/**
 * Environment configuration for mobile app
 * Handles both local .env files and EAS build environment variables
 */

/**
 * Get environment variable with fallback
 * @param {string} key - Environment variable key
 * @param {string} fallback - Fallback value
 * @returns {string} Environment variable value
 */
function getEnvVar(key, fallback = null) {
  // Try Expo Constants first (EAS builds)
  const expoValue = Constants.expoConfig?.extra?.[key.toLowerCase().replace(/_/g, '')];
  if (expoValue) return expoValue;

  // Try process.env (local development)
  const processValue = process.env[key];
  if (processValue) return processValue;

  // Return fallback
  return fallback;
}

/**
 * Validate required environment variables
 * @throws {Error} If validation fails
 */
function validateEnvironment() {
  const errors = [];

  // Required variables
  const apiUrl = getEnvVar('API_URL');
  if (!apiUrl) {
    errors.push('API_URL is required. Set in .env for development or EAS dashboard for production.');
  } else if (!apiUrl.match(/^https?:\/\/.+/)) {
    errors.push('API_URL must be a valid HTTP/HTTPS URL.');
  }

  const googleClientId = getEnvVar('GOOGLE_CLIENT_ID');
  if (!googleClientId) {
    errors.push('GOOGLE_CLIENT_ID is required. Get from Google Cloud Console.');
  } else if (!googleClientId.endsWith('.apps.googleusercontent.com')) {
    errors.push('GOOGLE_CLIENT_ID must end with .apps.googleusercontent.com');
  }

  // Optional but recommended
  const sentryDsn = getEnvVar('SENTRY_DSN');
  if (sentryDsn && !sentryDsn.match(/^https:\/\/.+@sentry\.io\/.+/)) {
    errors.push('SENTRY_DSN must be a valid Sentry DSN URL.');
  }

  if (errors.length > 0) {
    console.error('\n🚨 Mobile App Environment Validation Failed:\n');
    errors.forEach(error => console.error(`❌ ${error}`));
    console.error('\n📖 Setup Guide:');
    console.error('   Local Development: Copy mobile-app/.env.example to .env');
    console.error('   Production Builds: Set variables in Expo EAS dashboard');
    console.error('   Google OAuth: https://console.developers.google.com/');
    console.error('   Sentry: https://sentry.io/\n');

    throw new Error(`Environment validation failed: ${errors.length} errors found`);
  }
}

/**
 * Get validated environment configuration
 * @returns {Object} Environment configuration
 */
function getEnvironmentConfig() {
  validateEnvironment();

  const apiUrl = getEnvVar('API_URL');
  const environment = getEnvVar('ENVIRONMENT', 'development');
  const isDevelopment = environment === 'development';
  const isProduction = environment === 'production';

  return {
    // Basic settings
    environment,
    isDevelopment,
    isProduction,

    // API configuration
    apiUrl: apiUrl.replace(/\/$/, ''), // Remove trailing slash
    apiTimeout: 10000, // 10 seconds

    // Authentication
    auth: {
      googleClientId: getEnvVar('GOOGLE_CLIENT_ID')
    },

    // Error tracking
    sentry: {
      dsn: getEnvVar('SENTRY_DSN'),
      enabled: !!getEnvVar('SENTRY_DSN')
    },

    // Expo configuration
    expo: {
      projectId: getEnvVar('EAS_PROJECT_ID'),
      pushToken: getEnvVar('EXPO_PUSH_TOKEN')
    },

    // Debug settings
    debug: {
      enabled: getEnvVar('DEBUG_MODE', 'false') === 'true' || isDevelopment,
      logLevel: isDevelopment ? 'debug' : 'warn'
    }
  };
}

/**
 * Log environment configuration (safe for production)
 * @param {Object} config - Environment configuration
 */
function logEnvironmentInfo(config) {
  console.log('📱 Mobile App Environment:');
  console.log(`   Environment: ${config.environment}`);
  console.log(`   API URL: ${config.apiUrl}`);
  console.log(`   Debug Mode: ${config.debug.enabled}`);
  console.log(`   Sentry: ${config.sentry.enabled ? 'Enabled' : 'Disabled'}`);
  
  if (config.isDevelopment) {
    console.log(`   Google Client ID: ${config.auth.googleClientId?.substring(0, 20)}...`);
  }
}

// Initialize and export configuration
let config;
try {
  config = getEnvironmentConfig();
  logEnvironmentInfo(config);
} catch (error) {
  console.error('❌ Mobile app environment validation failed:', error.message);
  // In development, we can continue with limited functionality
  // In production builds, this should fail the build
  if (Constants.expoConfig?.extra?.environment === 'production') {
    throw error;
  }
  
  // Fallback configuration for development
  config = {
    environment: 'development',
    isDevelopment: true,
    isProduction: false,
    apiUrl: 'http://localhost:3000',
    apiTimeout: 10000,
    auth: { googleClientId: null },
    sentry: { dsn: null, enabled: false },
    expo: { projectId: null, pushToken: null },
    debug: { enabled: true, logLevel: 'debug' }
  };
  
  console.warn('⚠️  Using fallback configuration for development');
}

export default config;