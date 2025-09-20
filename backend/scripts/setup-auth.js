#!/usr/bin/env node

/**
 * Setup script for Google OAuth authentication
 * This script helps configure the authentication system
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

console.log('🔐 Persona Arcana - Authentication Setup');
console.log('=====================================\n');

// Generate a secure JWT secret
function generateJWTSecret() {
  return crypto.randomBytes(64).toString('hex');
}

// Check if .env file exists
const envPath = path.join(__dirname, '..', '.env');
const envExamplePath = path.join(__dirname, '..', '.env.example');

if (!fs.existsSync(envPath)) {
  console.log('📄 Creating .env file from .env.example...');
  
  if (fs.existsSync(envExamplePath)) {
    fs.copyFileSync(envExamplePath, envPath);
    console.log('✅ .env file created');
  } else {
    console.error('❌ .env.example file not found');
    process.exit(1);
  }
}

// Read current .env file
let envContent = fs.readFileSync(envPath, 'utf8');

// Generate JWT secret if not present
if (!envContent.includes('JWT_SECRET=') || envContent.includes('JWT_SECRET=your-jwt-secret')) {
  const jwtSecret = generateJWTSecret();
  
  if (envContent.includes('JWT_SECRET=your-jwt-secret')) {
    envContent = envContent.replace('JWT_SECRET=your-jwt-secret-at-least-32-characters-long', `JWT_SECRET=${jwtSecret}`);
  } else {
    envContent += `\nJWT_SECRET=${jwtSecret}`;
  }
  
  console.log('🔑 Generated secure JWT secret');
}

// Add Google OAuth placeholders if not present
if (!envContent.includes('GOOGLE_CLIENT_ID=')) {
  envContent += '\nGOOGLE_CLIENT_ID=your-google-client-id';
}

if (!envContent.includes('GOOGLE_CLIENT_SECRET=')) {
  envContent += '\nGOOGLE_CLIENT_SECRET=your-google-client-secret';
}

// Add mobile app scheme if not present
if (!envContent.includes('MOBILE_APP_SCHEME=')) {
  envContent += '\nMOBILE_APP_SCHEME=exp://localhost:19000';
}

// Write updated .env file
fs.writeFileSync(envPath, envContent);

console.log('\n📋 Next Steps:');
console.log('==============');
console.log('1. Go to Google Cloud Console: https://console.developers.google.com/');
console.log('2. Create a new project or select an existing one');
console.log('3. Enable the Google+ API');
console.log('4. Create OAuth 2.0 credentials:');
console.log('   - Application type: Web application');
console.log('   - Authorized redirect URIs: http://localhost:3000/auth/google/callback');
console.log('5. Copy the Client ID and Client Secret to your .env file');
console.log('6. Update GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env');
console.log('\n🔧 Configuration:');
console.log('================');
console.log('✅ JWT_SECRET: Generated automatically');
console.log('⚠️  GOOGLE_CLIENT_ID: Needs to be set');
console.log('⚠️  GOOGLE_CLIENT_SECRET: Needs to be set');
console.log('✅ MOBILE_APP_SCHEME: Set to default Expo scheme');

console.log('\n📱 For mobile development:');
console.log('=========================');
console.log('- Update MOBILE_APP_SCHEME when you have your custom scheme');
console.log('- Add your production domain to Google OAuth redirect URIs');
console.log('- Test the authentication flow with: npm run test:auth');

console.log('\n🚀 Ready to start the server with: npm run dev');