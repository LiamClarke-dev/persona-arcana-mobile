#!/usr/bin/env node

/**
 * Sentry Error Tracking Test Script
 * 
 * This script tests Sentry integration by generating various types of errors
 * and performance events to verify that error tracking is working correctly.
 * 
 * Usage:
 *   node scripts/test-sentry.js
 * 
 * Make sure SENTRY_DSN is configured in your .env file before running.
 */

require('dotenv').config();
const { initSentry, captureError, captureMessage, startTransaction, addBreadcrumb } = require('../config/sentry');

// Initialize Sentry
initSentry();

console.log('🧪 Testing Sentry Error Tracking Integration...\n');

async function testErrorCapture() {
  console.log('1. Testing manual error capture...');
  
  try {
    // Simulate an error
    throw new Error('Test error for Sentry integration');
  } catch (error) {
    captureError(error, {
      test: 'manual_error_capture',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
    });
    console.log('   ✅ Manual error captured');
  }
}

async function testMessageCapture() {
  console.log('2. Testing message capture...');
  
  captureMessage('Test message for Sentry integration', 'info', {
    test: 'message_capture',
    component: 'test-script',
  });
  console.log('   ✅ Message captured');
}

async function testBreadcrumbs() {
  console.log('3. Testing breadcrumbs...');
  
  addBreadcrumb('Starting test sequence', 'test', 'info', {
    step: 1,
    action: 'test_start',
  });
  
  addBreadcrumb('Processing test data', 'test', 'info', {
    step: 2,
    action: 'data_processing',
  });
  
  addBreadcrumb('Test sequence completed', 'test', 'info', {
    step: 3,
    action: 'test_complete',
  });
  
  console.log('   ✅ Breadcrumbs added');
}

async function testPerformanceMonitoring() {
  console.log('4. Testing performance monitoring...');
  
  const transaction = startTransaction('test-operation', 'test');
  
  // Simulate some work
  await new Promise(resolve => setTimeout(resolve, 100));
  
  transaction.setStatus('ok');
  transaction.finish();
  
  console.log('   ✅ Performance transaction completed');
}

async function testErrorWithContext() {
  console.log('5. Testing error with rich context...');
  
  try {
    // Simulate a database error
    const fakeDbError = new Error('Database connection timeout');
    fakeDbError.code = 'MONGODB_TIMEOUT';
    fakeDbError.errno = 110;
    
    throw fakeDbError;
  } catch (error) {
    captureError(error, {
      operation: 'database_query',
      query: 'User.findById()',
      userId: 'test-user-123',
      duration: 5000,
      retryCount: 3,
      database: {
        host: 'cluster.mongodb.net',
        collection: 'users',
      },
    });
    console.log('   ✅ Error with context captured');
  }
}

async function testSensitiveDataFiltering() {
  console.log('6. Testing sensitive data filtering...');
  
  try {
    const sensitiveError = new Error('Authentication failed');
    throw sensitiveError;
  } catch (error) {
    captureError(error, {
      operation: 'user_authentication',
      // These should be filtered out by Sentry configuration
      password: 'secret123',
      token: 'jwt-token-here',
      secret: 'api-secret-key',
      // These should be kept
      userId: 'user-123',
      method: 'google-oauth',
      timestamp: new Date().toISOString(),
    });
    console.log('   ✅ Error with sensitive data captured (should be filtered)');
  }
}

async function testAsyncError() {
  console.log('7. Testing async error handling...');
  
  const asyncOperation = async () => {
    await new Promise(resolve => setTimeout(resolve, 50));
    throw new Error('Async operation failed');
  };
  
  try {
    await asyncOperation();
  } catch (error) {
    captureError(error, {
      operation: 'async_test',
      type: 'promise_rejection',
    });
    console.log('   ✅ Async error captured');
  }
}

async function runTests() {
  if (!process.env.SENTRY_DSN) {
    console.error('❌ SENTRY_DSN not configured in .env file');
    console.log('Please add SENTRY_DSN=your-sentry-dsn to your .env file');
    process.exit(1);
  }
  
  console.log(`📡 Sentry DSN configured: ${process.env.SENTRY_DSN.substring(0, 20)}...`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}\n`);
  
  try {
    await testErrorCapture();
    await testMessageCapture();
    await testBreadcrumbs();
    await testPerformanceMonitoring();
    await testErrorWithContext();
    await testSensitiveDataFiltering();
    await testAsyncError();
    
    console.log('\n🎉 All Sentry tests completed successfully!');
    console.log('📊 Check your Sentry dashboard to verify events were received.');
    console.log('🔗 Sentry Dashboard: https://sentry.io/');
    
    // Give Sentry time to send events
    console.log('\n⏳ Waiting 3 seconds for events to be sent...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    captureError(error, {
      test: 'sentry_test_script',
      failure: true,
    });
  }
  
  console.log('✅ Test script completed');
  process.exit(0);
}

// Handle unhandled rejections for testing
process.on('unhandledRejection', (reason, promise) => {
  console.log('🔍 Caught unhandled rejection for testing:', reason);
  captureError(new Error(`Unhandled rejection: ${reason}`), {
    type: 'unhandled_rejection',
    promise: promise.toString(),
  });
});

// Run the tests
runTests().catch(error => {
  console.error('❌ Fatal error in test script:', error);
  process.exit(1);
});