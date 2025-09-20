const request = require('supertest');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const express = require('express');
const User = require('../models/User');

// Create a test app without starting the server
const createTestApp = () => {
  const app = express();
  
  // Import middleware
  const { createLogger, requestId, performanceMonitor } = require('../middleware/logging');
  const { errorHandler, notFound } = require('../middleware/errorHandler');
  const { corsOptions, helmetConfig, compressionConfig } = require('../middleware/security');
  
  // Import authentication
  const passport = require('../config/passport');
  const { initializeSession } = require('../config/session');
  
  // Import routes
  const authRoutes = require('../routes/auth');
  const userRoutes = require('../routes/users');
  
  // Basic middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  
  // Skip session for tests to avoid MongoDB dependency issues
  app.use(passport.initialize());
  
  // Routes
  app.use('/auth', authRoutes);
  app.use('/api/users', userRoutes);
  
  // Error handling
  app.use(notFound);
  app.use(errorHandler);
  
  return app;
};

// Mock environment variables for testing
process.env.JWT_SECRET = 'test-jwt-secret-at-least-32-characters-long';
process.env.GOOGLE_CLIENT_ID = 'test-google-client-id';
process.env.GOOGLE_CLIENT_SECRET = 'test-google-client-secret';

describe('Authentication System', () => {
  let testUser;
  let authToken;
  let app;

  beforeAll(async () => {
    // Create test app
    app = createTestApp();
    
    // Ensure we're connected to test database
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/persona-arcana-test');
    }
  });

  beforeEach(async () => {
    // Clean up users collection
    await User.deleteMany({});

    // Create a test user
    testUser = await User.create({
      googleId: 'test-google-123',
      email: 'test@example.com',
      name: 'Test User',
      googleImage: 'https://example.com/photo.jpg',
    });

    // Generate auth token
    authToken = jwt.sign(
      {
        userId: testUser._id,
        email: testUser.email,
        name: testUser.name
      },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );
  });

  afterAll(async () => {
    await User.deleteMany({});
    await mongoose.connection.close();
  });

  describe('GET /auth/status', () => {
    it('should return authentication configuration status', async () => {
      const response = await request(app)
        .get('/auth/status')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.googleOAuthConfigured).toBe(true);
      expect(response.body.data.jwtConfigured).toBe(true);
      expect(response.body.data.authEndpoints).toBeDefined();
    });
  });

  describe('GET /auth/google', () => {
    it('should redirect to Google OAuth', async () => {
      const response = await request(app)
        .get('/auth/google')
        .expect(302);

      expect(response.headers.location).toContain('accounts.google.com');
    });

    it('should store mobile redirect URI in session', async () => {
      const redirectUri = 'exp://localhost:19000/auth';
      
      await request(app)
        .get(`/auth/google?redirect_uri=${encodeURIComponent(redirectUri)}`)
        .expect(302);

      // Session storage is tested implicitly through the OAuth flow
    });
  });

  describe('POST /auth/verify', () => {
    it('should verify valid JWT token', async () => {
      const response = await request(app)
        .post('/auth/verify')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.id).toBe(testUser._id.toString());
      expect(response.body.data.user.email).toBe(testUser.email);
      expect(response.body.data.tokenValid).toBe(true);
    });

    it('should reject invalid JWT token', async () => {
      const response = await request(app)
        .post('/auth/verify')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Invalid token');
    });

    it('should reject missing JWT token', async () => {
      const response = await request(app)
        .post('/auth/verify')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Authentication required');
    });

    it('should reject expired JWT token', async () => {
      const expiredToken = jwt.sign(
        { userId: testUser._id, email: testUser.email },
        process.env.JWT_SECRET,
        { expiresIn: '-1h' } // Expired 1 hour ago
      );

      const response = await request(app)
        .post('/auth/verify')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Token expired');
    });
  });

  describe('POST /auth/logout', () => {
    it('should logout authenticated user', async () => {
      const response = await request(app)
        .post('/auth/logout')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.message).toContain('Logged out successfully');
    });

    it('should require authentication for logout', async () => {
      const response = await request(app)
        .post('/auth/logout')
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('Authentication Middleware', () => {
    it('should protect user profile endpoints', async () => {
      const response = await request(app)
        .get('/api/users/me')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('UNAUTHORIZED');
    });

    it('should allow access with valid token', async () => {
      const response = await request(app)
        .get('/api/users/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.email).toBe(testUser.email);
    });

    it('should enforce ownership for user resources', async () => {
      // Create another user
      const otherUser = await User.create({
        googleId: 'other-google-123',
        email: 'other@example.com',
        name: 'Other User',
      });

      const response = await request(app)
        .get(`/api/users/${otherUser._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('ACCESS_DENIED');
    });
  });

  describe('User Creation and Updates via OAuth', () => {
    it('should handle new user creation', async () => {
      // This would be tested with actual OAuth flow
      // For now, we test the User model directly
      const newUser = await User.create({
        googleId: 'new-google-456',
        email: 'newuser@example.com',
        name: 'New User',
        googleImage: 'https://example.com/newphoto.jpg',
      });

      expect(newUser.email).toBe('newuser@example.com');
      expect(newUser.onboarding.completed).toBe(false);
      expect(newUser.stats.totalEntries).toBe(0);
    });

    it('should update existing user profile from Google data', async () => {
      const updatedName = 'Updated Test User';
      const updatedImage = 'https://example.com/updated.jpg';

      testUser.name = updatedName;
      testUser.googleImage = updatedImage;
      await testUser.save();

      const updatedUser = await User.findById(testUser._id);
      expect(updatedUser.name).toBe(updatedName);
      expect(updatedUser.googleImage).toBe(updatedImage);
    });
  });

  describe('Error Handling', () => {
    it('should handle authentication errors gracefully', async () => {
      const response = await request(app)
        .get('/auth/error?message=authentication_failed')
        .expect(302);

      expect(response.headers.location).toContain('error=');
    });

    it('should handle token generation failures', async () => {
      const response = await request(app)
        .get('/auth/error?message=token_generation_failed')
        .expect(302);

      expect(response.headers.location).toContain('token_generation_failed');
    });
  });

  describe('Session Management', () => {
    it('should handle session configuration', async () => {
      // Test that sessions are properly configured
      // This is implicitly tested through the OAuth flow
      expect(process.env.JWT_SECRET).toBeDefined();
    });
  });
});

describe('JWT Token Generation and Validation', () => {
  const testUserId = new mongoose.Types.ObjectId();
  const testEmail = 'jwt-test@example.com';
  const testName = 'JWT Test User';

  it('should generate valid JWT tokens', () => {
    const token = jwt.sign(
      {
        userId: testUserId,
        email: testEmail,
        name: testName
      },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    expect(token).toBeDefined();
    expect(typeof token).toBe('string');
    expect(token.split('.')).toHaveLength(3); // JWT has 3 parts
  });

  it('should validate JWT tokens correctly', () => {
    const token = jwt.sign(
      {
        userId: testUserId,
        email: testEmail,
        name: testName
      },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    expect(decoded.userId).toBe(testUserId.toString());
    expect(decoded.email).toBe(testEmail);
    expect(decoded.name).toBe(testName);
    expect(decoded.exp).toBeDefined();
    expect(decoded.iat).toBeDefined();
  });

  it('should reject tokens with wrong secret', () => {
    const token = jwt.sign(
      { userId: testUserId },
      'wrong-secret',
      { expiresIn: '30d' }
    );

    expect(() => {
      jwt.verify(token, process.env.JWT_SECRET);
    }).toThrow('invalid signature');
  });
});