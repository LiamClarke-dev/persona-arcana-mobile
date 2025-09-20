#!/usr/bin/env node

/**
 * DigitalOcean Spaces Setup Script
 * 
 * This script helps validate and test DigitalOcean Spaces configuration.
 * Run with: node scripts/setup-digitalocean.js
 */

require('dotenv').config();
const { UploadService } = require('../services/uploadService');

async function validateConfiguration() {
  console.log('🔧 Validating DigitalOcean Spaces Configuration...\n');

  // Check environment variables
  const requiredVars = [
    'DO_SPACES_ENDPOINT',
    'DO_SPACES_BUCKET',
    'DO_SPACES_ACCESS_KEY',
    'DO_SPACES_SECRET_KEY',
    'DO_SPACES_REGION'
  ];

  const missing = requiredVars.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:');
    missing.forEach(key => console.error(`   - ${key}`));
    console.error('\nPlease update your .env file with the missing variables.');
    console.error('Refer to .env.example for the required format.\n');
    return false;
  }

  console.log('✅ All required environment variables are present\n');

  // Display current configuration
  console.log('📋 Current Configuration:');
  console.log(`   Endpoint: ${process.env.DO_SPACES_ENDPOINT}`);
  console.log(`   Bucket: ${process.env.DO_SPACES_BUCKET}`);
  console.log(`   Region: ${process.env.DO_SPACES_REGION}`);
  console.log(`   Access Key: ${process.env.DO_SPACES_ACCESS_KEY.substring(0, 8)}...`);
  console.log('');

  return true;
}

async function testConnection() {
  console.log('🔗 Testing connection to DigitalOcean Spaces...\n');

  const uploadService = new UploadService();
  
  try {
    const result = await uploadService.testConnection();
    
    if (result.success) {
      console.log('✅ Connection successful!');
      console.log(`   Bucket: ${result.bucket}`);
      console.log(`   Endpoint: ${result.endpoint}`);
      console.log('');
      return true;
    } else {
      console.error('❌ Connection failed:');
      console.error(`   Error: ${result.message}`);
      console.error(`   Code: ${result.error || 'Unknown'}`);
      console.error('');
      return false;
    }
  } catch (error) {
    console.error('❌ Connection test failed:');
    console.error(`   ${error.message}`);
    console.error('');
    return false;
  }
}

function printSetupInstructions() {
  console.log('📚 DigitalOcean Spaces Setup Instructions:\n');
  
  console.log('1. Create a DigitalOcean Spaces bucket:');
  console.log('   - Go to https://cloud.digitalocean.com/spaces');
  console.log('   - Click "Create a Space"');
  console.log('   - Choose a region (e.g., NYC3)');
  console.log('   - Enter a unique bucket name');
  console.log('   - Set File Listing to "Public" for CDN access');
  console.log('');
  
  console.log('2. Generate API keys:');
  console.log('   - Go to https://cloud.digitalocean.com/account/api/spaces');
  console.log('   - Click "Generate New Key"');
  console.log('   - Copy the Access Key and Secret Key');
  console.log('');
  
  console.log('3. Update your .env file:');
  console.log('   DO_SPACES_ENDPOINT=https://[region].digitaloceanspaces.com');
  console.log('   DO_SPACES_BUCKET=your-bucket-name');
  console.log('   DO_SPACES_ACCESS_KEY=your-access-key');
  console.log('   DO_SPACES_SECRET_KEY=your-secret-key');
  console.log('   DO_SPACES_REGION=your-region');
  console.log('');
  
  console.log('4. Test the configuration:');
  console.log('   node scripts/setup-digitalocean.js');
  console.log('');
}

function printTroubleshooting() {
  console.log('🔧 Troubleshooting Common Issues:\n');
  
  console.log('• "Access Denied" errors:');
  console.log('  - Verify your Access Key and Secret Key are correct');
  console.log('  - Ensure the keys have Spaces read/write permissions');
  console.log('');
  
  console.log('• "Bucket not found" errors:');
  console.log('  - Check that the bucket name matches exactly');
  console.log('  - Verify the region in the endpoint matches your bucket region');
  console.log('');
  
  console.log('• "Network timeout" errors:');
  console.log('  - Check your internet connection');
  console.log('  - Verify the endpoint URL is correct for your region');
  console.log('');
  
  console.log('• CDN not working:');
  console.log('  - Ensure your Space is set to "Public" file listing');
  console.log('  - CDN URLs use format: https://[bucket].[region].cdn.digitaloceanspaces.com');
  console.log('');
}

async function main() {
  console.log('🚀 DigitalOcean Spaces Setup & Validation Tool\n');

  const configValid = await validateConfiguration();
  
  if (!configValid) {
    printSetupInstructions();
    process.exit(1);
  }

  const connectionSuccess = await testConnection();
  
  if (connectionSuccess) {
    console.log('🎉 DigitalOcean Spaces is configured correctly!');
    console.log('You can now use file upload functionality in your application.\n');
    
    console.log('📝 Next steps:');
    console.log('   - Start your server: npm run dev');
    console.log('   - Test uploads: POST /api/upload/test');
    console.log('   - Upload files: POST /api/upload/profile/:userId');
    console.log('');
  } else {
    console.log('❌ Setup incomplete. Please resolve the connection issues.\n');
    printTroubleshooting();
    process.exit(1);
  }
}

// Run the setup if this script is executed directly
if (require.main === module) {
  main().catch(error => {
    console.error('💥 Setup script failed:', error.message);
    process.exit(1);
  });
}

module.exports = { validateConfiguration, testConnection };