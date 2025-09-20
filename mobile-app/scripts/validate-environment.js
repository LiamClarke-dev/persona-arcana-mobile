#!/usr/bin/env node
// scripts/validate-environment.js

/**
 * Mobile App Environment validation script
 * Run this to check if all required environment variables are properly configured
 */

require('dotenv').config();

console.log('📱 Validating Mobile App Environment Configuration...\n');

/**
 * Get environment variable with fallback
 */
function getEnvVar(key, fallback = null) {
  return process.env[key] || fallback;
}

/**
 * Validate required environment variables
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
  if (sentryDsn && !sentryDsn.match(/^https:\/\/[a-f0-9]+@[a-z0-9.-]+\.sentry\.io\/[0-9]+$/)) {
    errors.push('SENTRY_DSN must be a valid Sentry DSN URL.');
  }

  if (errors.length > 0) {
    console.error('🚨 Mobile App Environment Validation Failed:\n');
    errors.forEach(error => console.error(`❌ ${error}`));
    console.error('\n📖 Setup Guide:');
    console.error('   Local Development: Copy mobile-app/.env.example to .env');
    console.error('   Production Builds: Set variables in Expo EAS dashboard');
    console.error('   Google OAuth: https://console.developers.google.com/');
    console.error('   Sentry: https://sentry.io/\n');

    throw new Error(`Environment validation failed: ${errors.length} errors found`);
  }

  return true;
}

try {
  validateEnvironment();

  const apiUrl = getEnvVar('API_URL');
  const environment = getEnvVar('ENVIRONMENT', 'development');
  const googleClientId = getEnvVar('GOOGLE_CLIENT_ID');
  const sentryDsn = getEnvVar('SENTRY_DSN');
  const easProjectId = getEnvVar('EAS_PROJECT_ID');

  console.log('✅ Mobile app environment validation successful!\n');
  
  console.log('📋 Configuration Summary:');
  console.log(`   Environment: ${environment}`);
  console.log(`   API URL: ${apiUrl}`);
  console.log(`   Google Client ID: ${googleClientId ? googleClientId.substring(0, 20) + '...' : 'Not set'}`);
  console.log(`   Sentry DSN: ${sentryDsn ? 'Configured' : 'Not configured'}`);
  console.log(`   EAS Project ID: ${easProjectId || 'Not set'}`);

  console.log('\n🎉 All required environment variables are properly configured!');

  if (environment === 'development') {
    console.log('\n💡 Development Environment Tips:');
    console.log('   - Make sure backend is running on the API_URL');
    console.log('   - Test Google OAuth with your mobile client ID');
    console.log('   - Verify API connectivity before building');
  }

  console.log('\n📖 Next Steps:');
  console.log('   1. Start Expo development server: npm start');
  console.log('   2. Test on device/simulator');
  console.log('   3. Build for testing: npm run build:dev');

  process.exit(0);

} catch (error) {
  console.error('❌ Mobile app environment validation failed:', error.message);
  console.error('\n🛠️  How to fix:');
  console.error('   1. Copy mobile-app/.env.example to mobile-app/.env');
  console.error('   2. Fill in all required values');
  console.error('   3. Run this script again: npm run validate:env');
  console.error('\n📚 Resources:');
  console.error('   - Google OAuth: https://console.developers.google.com/');
  console.error('   - Expo EAS: https://expo.dev/');
  console.error('   - Sentry: https://sentry.io/');
  
  process.exit(1);
}