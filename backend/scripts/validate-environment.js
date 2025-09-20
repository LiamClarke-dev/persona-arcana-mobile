#!/usr/bin/env node
// scripts/validate-environment.js

/**
 * Environment validation script
 * Run this to check if all required environment variables are properly configured
 */

require('dotenv').config();
const { validateEnvironment, getEnvironmentConfig } = require('../config/environment');

console.log('🔍 Validating Backend Environment Configuration...\n');

try {
  // Validate environment variables
  const env = validateEnvironment();
  const config = getEnvironmentConfig(env);
  
  console.log('✅ Environment validation successful!\n');
  
  // Display configuration summary
  console.log('📋 Configuration Summary:');
  console.log(`   Environment: ${config.nodeEnv}`);
  console.log(`   Port: ${config.port}`);
  console.log(`   Database: ${config.mongodb.uri.replace(/\/\/.*@/, '//***:***@')}`);
  console.log(`   Spaces Bucket: ${config.spaces.bucket} (${config.spaces.region})`);
  console.log(`   Google OAuth: ${config.auth.google.clientId.substring(0, 20)}...`);
  console.log(`   JWT Secret: ${config.auth.jwtSecret.length} characters`);
  console.log(`   Session Secret: ${config.auth.sessionSecret.length} characters`);
  console.log(`   Sentry: ${config.sentry.dsn ? 'Configured' : 'Not configured'}`);
  console.log(`   CORS Origins: ${config.security.allowedOrigins.length} origins`);
  console.log(`   Rate Limit: ${config.security.rateLimit.maxRequests} requests per ${config.security.rateLimit.windowMs / 1000}s`);
  console.log(`   Max File Size: ${(config.upload.maxFileSize / 1024 / 1024).toFixed(1)}MB`);
  console.log(`   Allowed File Types: ${config.upload.allowedTypes.join(', ')}`);
  
  console.log('\n🎉 All environment variables are properly configured!');
  
  // Environment-specific recommendations
  if (config.isDevelopment) {
    console.log('\n💡 Development Environment Tips:');
    console.log('   - Use strong secrets even in development');
    console.log('   - Test with real MongoDB Atlas and DigitalOcean Spaces');
    console.log('   - Verify Google OAuth works with your client ID');
  }
  
  if (config.isProduction) {
    console.log('\n🔒 Production Environment Security Check:');
    
    const securityIssues = [];
    
    if (config.auth.jwtSecret.length < 64) {
      securityIssues.push('JWT_SECRET should be at least 64 characters in production');
    }
    
    if (config.auth.sessionSecret.length < 64) {
      securityIssues.push('SESSION_SECRET should be at least 64 characters in production');
    }
    
    if (config.security.allowedOrigins.includes('http://localhost:3000')) {
      securityIssues.push('Remove localhost from ALLOWED_ORIGINS in production');
    }
    
    if (!config.sentry.dsn) {
      securityIssues.push('Consider configuring Sentry for error tracking in production');
    }
    
    if (securityIssues.length > 0) {
      console.log('\n⚠️  Security Recommendations:');
      securityIssues.forEach(issue => console.log(`   - ${issue}`));
    } else {
      console.log('   ✅ Security configuration looks good!');
    }
  }
  
  console.log('\n📖 Next Steps:');
  console.log('   1. Start the server: npm run dev');
  console.log('   2. Test health endpoint: curl http://localhost:3000/health');
  console.log('   3. Test file upload: npm run test:upload');
  console.log('   4. Test authentication: npm run test:auth');
  
  process.exit(0);
  
} catch (error) {
  console.error('❌ Environment validation failed:', error.message);
  console.error('\n🛠️  How to fix:');
  console.error('   1. Copy backend/.env.example to backend/.env');
  console.error('   2. Fill in all required values');
  console.error('   3. Run this script again: npm run validate:env');
  console.error('\n📚 Resources:');
  console.error('   - MongoDB Atlas: https://cloud.mongodb.com/');
  console.error('   - Google OAuth: https://console.developers.google.com/');
  console.error('   - DigitalOcean Spaces: https://cloud.digitalocean.com/spaces');
  console.error('   - Sentry: https://sentry.io/');
  
  process.exit(1);
}