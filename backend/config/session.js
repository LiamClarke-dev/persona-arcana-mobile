const session = require('express-session');
const MongoStore = require('connect-mongo');
const mongoose = require('mongoose');

/**
 * Session configuration with MongoDB store
 */
const createSessionConfig = (config = null) => {
  // Use config object if provided (from environment validation)
  const sessionSecret = config?.auth?.sessionSecret || process.env.SESSION_SECRET || process.env.JWT_SECRET;
  const mongoUri = config?.mongodb?.uri || process.env.MONGODB_URI;

  if (!sessionSecret) {
    throw new Error('SESSION_SECRET environment variable is required for session configuration');
  }

  if (!mongoUri) {
    throw new Error('MONGODB_URI environment variable is required for session store');
  }

  const sessionConfig = {
    secret: sessionSecret, // Use dedicated session secret
    resave: false,
    saveUninitialized: false,
    name: 'persona-arcana-session', // Custom session name
    cookie: {
      secure: process.env.NODE_ENV === 'production', // HTTPS only in production
      httpOnly: true, // Prevent XSS attacks
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax' // Cross-site for mobile
    },
    store: MongoStore.create({
      client: mongoose.connection.getClient(),
      dbName: mongoose.connection.db.databaseName,
      collectionName: 'sessions',
      stringify: false,
      autoRemove: 'native', // Let MongoDB handle TTL
      touchAfter: 24 * 3600, // Lazy session update (24 hours)
      ttl: 24 * 60 * 60, // Session TTL in seconds (24 hours)
    })
  };

  // Additional security for production
  if (process.env.NODE_ENV === 'production') {
    sessionConfig.cookie.domain = process.env.COOKIE_DOMAIN || undefined;
    sessionConfig.proxy = true; // Trust first proxy (for load balancers)
  }

  return sessionConfig;
};

/**
 * Initialize session middleware
 */
const initializeSession = (envConfig = null) => {
  try {
    const config = createSessionConfig(envConfig);
    const sessionMiddleware = session(config);
    
    console.log('✅ Session middleware configured with MongoDB store');
    
    return sessionMiddleware;
  } catch (error) {
    console.error('❌ Failed to configure session middleware:', error.message);
    throw error;
  }
};

/**
 * Session cleanup utility
 */
const cleanupSessions = async () => {
  try {
    const store = MongoStore.create({
      client: mongoose.connection.getClient(),
      dbName: mongoose.connection.db.databaseName,
      collectionName: 'sessions'
    });

    // MongoDB TTL will handle automatic cleanup, but we can manually clean if needed
    console.log('Session cleanup completed (handled by MongoDB TTL)');
  } catch (error) {
    console.error('Session cleanup error:', error);
  }
};

module.exports = {
  createSessionConfig,
  initializeSession,
  cleanupSessions
};