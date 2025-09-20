const express = require('express');
const mongoose = require('mongoose');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

// Basic health check
router.get('/', asyncHandler(async (req, res) => {
  const healthData = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0',
  };

  res.json({
    success: true,
    data: healthData,
    error: null,
    code: null,
  });
}));

// Detailed health check with dependencies
router.get('/detailed', asyncHandler(async (req, res) => {
  const checks = {
    server: {
      status: 'healthy',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      timestamp: new Date().toISOString(),
    },
    database: {
      status: 'unknown',
      connected: false,
      readyState: mongoose.connection.readyState,
    },
    environment: {
      nodeVersion: process.version,
      platform: process.platform,
      environment: process.env.NODE_ENV || 'development',
    },
  };

  // Check MongoDB connection
  try {
    if (mongoose.connection.readyState === 1) {
      // Test database with a simple operation
      await mongoose.connection.db.admin().ping();
      checks.database.status = 'healthy';
      checks.database.connected = true;
    } else {
      checks.database.status = 'unhealthy';
      checks.database.connected = false;
    }
  } catch (error) {
    checks.database.status = 'error';
    checks.database.error = error.message;
    checks.database.connected = false;
  }

  // Determine overall health
  const isHealthy = checks.database.status === 'healthy';
  const statusCode = isHealthy ? 200 : 503;

  res.status(statusCode).json({
    success: isHealthy,
    data: {
      status: isHealthy ? 'healthy' : 'unhealthy',
      checks,
    },
    error: isHealthy ? null : 'One or more health checks failed',
    code: isHealthy ? null : 'HEALTH_CHECK_FAILED',
  });
}));

// Readiness probe (for Kubernetes/container orchestration)
router.get('/ready', asyncHandler(async (req, res) => {
  // Check if the application is ready to serve requests
  const isReady = mongoose.connection.readyState === 1;

  if (isReady) {
    res.json({
      success: true,
      data: { status: 'ready', timestamp: new Date().toISOString() },
      error: null,
      code: null,
    });
  } else {
    res.status(503).json({
      success: false,
      data: null,
      error: 'Application not ready',
      code: 'NOT_READY',
    });
  }
}));

// Liveness probe (for Kubernetes/container orchestration)
router.get('/live', asyncHandler(async (req, res) => {
  // Simple liveness check - if this endpoint responds, the app is alive
  res.json({
    success: true,
    data: { status: 'alive', timestamp: new Date().toISOString() },
    error: null,
    code: null,
  });
}));

// Database connection test
router.get('/db', asyncHandler(async (req, res) => {
  try {
    // Test database connection with a simple query
    const result = await mongoose.connection.db.admin().ping();
    
    const dbInfo = {
      connected: true,
      readyState: mongoose.connection.readyState,
      host: mongoose.connection.host,
      port: mongoose.connection.port,
      name: mongoose.connection.name,
      ping: result,
    };

    res.json({
      success: true,
      data: dbInfo,
      error: null,
      code: null,
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      data: {
        connected: false,
        readyState: mongoose.connection.readyState,
        error: error.message,
      },
      error: 'Database connection failed',
      code: 'DB_CONNECTION_ERROR',
    });
  }
}));

module.exports = router;