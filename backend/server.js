// server.js
const express = require('express');
const mongoose = require('mongoose');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
require('dotenv').config();

// Initialize Sentry first
const { initSentry, sentryMiddleware, sentryErrorHandler } = require('./config/sentry');
initSentry();

// Import middleware
const { createLogger, requestId, performanceMonitor, errorLogger } = require('./middleware/logging');
const { errorHandler, notFound } = require('./middleware/errorHandler');
const { corsOptions, helmetConfig, compressionConfig } = require('./middleware/security');

// Import authentication
const passport = require('./config/passport');
const { initializeSession } = require('./config/session');

// Import routes
const healthRoutes = require('./routes/health');
const userRoutes = require('./routes/users');
const uploadRoutes = require('./routes/upload');
const authRoutes = require('./routes/auth');

const app = express();
const PORT = process.env.PORT || 3000;

// Import environment validation
const { validateEnvironment, getEnvironmentConfig } = require('./config/environment');

// Validate and get environment configuration
let config;
try {
  const env = validateEnvironment();
  config = getEnvironmentConfig(env);
  console.log('✅ Environment validation successful');
  console.log(`🌍 Environment: ${config.nodeEnv}`);
  console.log(`🗄️  Database: ${config.mongodb.uri.replace(/\/\/.*@/, '//***:***@')}`);
  console.log(`📦 Spaces: ${config.spaces.bucket} (${config.spaces.region})`);
} catch (error) {
  console.error('❌ Environment validation failed:', error.message);
  process.exit(1);
}

// Connect to MongoDB with Mongoose
async function connectDB() {
  try {
    await mongoose.connect(config.mongodb.uri, config.mongodb.options);
    console.log('✅ Connected to MongoDB Atlas with Mongoose');
    
    // Handle connection events
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err);
    });
    
    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️  MongoDB disconnected');
    });
    
    mongoose.connection.on('reconnected', () => {
      console.log('✅ MongoDB reconnected');
    });
    
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    throw error;
  }
}

// Security middleware (must be early in the stack)
app.use(helmet(helmetConfig));
app.use(cors(corsOptions));
app.use(compression(compressionConfig));

// Sentry middleware (must be before other middleware)
app.use(...sentryMiddleware());

// Logging and monitoring middleware
app.use(requestId);
app.use(createLogger());
app.use(performanceMonitor);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// API Routes
app.use('/health', healthRoutes);
app.use('/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/upload', uploadRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    data: { 
      message: 'Persona Arcana API - Phase 1 Foundation',
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString(),
    },
    error: null,
    code: null,
  });
});

// API info endpoint
app.get('/api', (req, res) => {
  res.json({
    success: true,
    data: {
      name: 'Persona Arcana API',
      version: '1.0.0',
      description: 'Backend API for Persona Arcana mobile app',
      endpoints: {
        health: '/health',
        auth: '/auth',
        users: '/api/users',
        upload: '/api/upload',
      },
      documentation: 'https://github.com/your-repo/persona-arcana-mobile#api-documentation',
    },
    error: null,
    code: null,
  });
});

// Error handling middleware (must be after all routes)
app.use(errorLogger);
app.use(sentryErrorHandler());
app.use(notFound);
app.use(errorHandler);

// Graceful shutdown
const gracefulShutdown = async (signal) => {
  console.log(`\n🛑 Received ${signal}. Starting graceful shutdown...`);
  
  try {
    // Close MongoDB connection
    await mongoose.connection.close();
    console.log('✅ MongoDB connection closed');
    
    // Close server
    if (server) {
      server.close(() => {
        console.log('✅ HTTP server closed');
        process.exit(0);
      });
    } else {
      process.exit(0);
    }
  } catch (error) {
    console.error('❌ Error during shutdown:', error);
    process.exit(1);
  }
};

// Handle shutdown signals
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start server
let server;

async function start() {
  try {
    await connectDB();
    
    // Initialize session and passport after DB connection
    app.use(initializeSession(config));
    app.use(passport.initialize());
    app.use(passport.session());
    
    server = app.listen(config.port, () => {
      console.log(`🚀 Server running on port ${config.port}`);
      console.log(`📁 DigitalOcean Spaces: ${config.spaces.bucket}`);
      console.log(`🌐 Endpoint: ${config.spaces.endpoint}`);
      console.log(`🔒 Environment: ${config.nodeEnv}`);
      
      if (config.isDevelopment) {
        console.log(`📖 API Documentation: http://localhost:${config.port}/api`);
        console.log(`❤️  Health Check: http://localhost:${config.port}/health`);
      }
    });
    
    // Handle server errors
    server.on('error', (error) => {
      console.error('❌ Server error:', error);
      process.exit(1);
    });
    
  } catch (err) {
    
    process.exit(1);
  }
}

// Start the server
start();

module.exports = { app };
