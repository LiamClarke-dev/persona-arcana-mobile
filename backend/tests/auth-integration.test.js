const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../models/User');

// Load environment variables
require('dotenv').config();

describe('Authentication Integration Tests', () => {
  let testUser;

  beforeAll(async () => {
    // Connect to test database if not already connected
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI);
    }
  });

  beforeEach(async () => {
    // Clean up test data
    await User.deleteMany({ email: { $regex: /test.*@example\.com/ } });
  });

  afterAll(async () => {
    // Clean up test data
    await User.deleteMany({ email: { $regex: /test.*@example\.com/ } });
  });

  describe('JWT Token System', () => {
    it('should generate and validate JWT tokens', () => {
      const userId = new mongoose.Types.ObjectId();
      const email = 'test-jwt@example.com';
      const name = 'Test User';

      // Generate token
      const token = jwt.sign(
        { userId, email, name },
        process.env.JWT_SECRET,
        { expiresIn: '30d', issuer: 'persona-arcana-api', audience: 'persona-arcana-mobile' }
      );

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');

      // Validate token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      expect(decoded.userId).toBe(userId.toString());
      expect(decoded.email).toBe(email);
      expect(decoded.name).toBe(name);
      expect(decoded.iss).toBe('persona-arcana-api');
      expect(decoded.aud).toBe('persona-arcana-mobile');
    });

    it('should reject expired tokens', () => {
      const token = jwt.sign(
        { userId: '123', email: 'test@example.com' },
        process.env.JWT_SECRET,
        { expiresIn: '-1h' } // Expired 1 hour ago
      );

      expect(() => {
        jwt.verify(token, process.env.JWT_SECRET);
      }).toThrow('jwt expired');
    });

    it('should reject tokens with wrong secret', () => {
      const token = jwt.sign(
        { userId: '123', email: 'test@example.com' },
        'wrong-secret',
        { expiresIn: '1h' }
      );

      expect(() => {
        jwt.verify(token, process.env.JWT_SECRET);
      }).toThrow('invalid signature');
    });
  });

  describe('User Model Integration', () => {
    it('should create user with Google OAuth data', async () => {
      const userData = {
        googleId: 'test-google-123',
        email: 'test-user@example.com',
        name: 'Test User',
        googleImage: 'https://example.com/photo.jpg'
      };

      const user = await User.create(userData);

      expect(user._id).toBeDefined();
      expect(user.email).toBe(userData.email);
      expect(user.name).toBe(userData.name);
      expect(user.googleId).toBe(userData.googleId);
      expect(user.googleImage).toBe(userData.googleImage);
      expect(user.onboarding.completed).toBe(false);
      expect(user.stats.totalEntries).toBe(0);
    });

    it('should update existing user with new Google data', async () => {
      // Create initial user
      const user = await User.create({
        googleId: 'test-google-456',
        email: 'test-update@example.com',
        name: 'Original Name',
        googleImage: 'https://example.com/old.jpg'
      });

      // Update user (simulating OAuth callback)
      user.name = 'Updated Name';
      user.googleImage = 'https://example.com/new.jpg';
      await user.save();

      // Verify update
      const updatedUser = await User.findById(user._id);
      expect(updatedUser.name).toBe('Updated Name');
      expect(updatedUser.googleImage).toBe('https://example.com/new.jpg');
      expect(updatedUser.email).toBe('test-update@example.com'); // Should remain unchanged
    });

    it('should enforce unique email constraint', async () => {
      const userData = {
        googleId: 'test-google-789',
        email: 'duplicate@example.com',
        name: 'First User'
      };

      await User.create(userData);

      // Try to create another user with same email
      await expect(User.create({
        googleId: 'test-google-999',
        email: 'duplicate@example.com',
        name: 'Second User'
      })).rejects.toThrow();
    });
  });

  describe('Environment Configuration', () => {
    it('should have all required environment variables', () => {
      expect(process.env.JWT_SECRET).toBeDefined();
      expect(process.env.JWT_SECRET.length).toBeGreaterThan(32);
      expect(process.env.GOOGLE_CLIENT_ID).toBeDefined();
      expect(process.env.GOOGLE_CLIENT_SECRET).toBeDefined();
      expect(process.env.MONGODB_URI).toBeDefined();
    });

    it('should have secure JWT secret', () => {
      const secret = process.env.JWT_SECRET;
      expect(secret.length).toBeGreaterThanOrEqual(64); // Should be at least 64 characters
      expect(secret).toMatch(/^[a-f0-9]+$/); // Should be hex string
    });
  });

  describe('Authentication Flow Simulation', () => {
    it('should simulate complete OAuth to JWT flow', async () => {
      // Step 1: Simulate Google OAuth callback with user data
      const googleUserData = {
        id: 'google-test-123',
        displayName: 'OAuth Test User',
        emails: [{ value: 'oauth-test@example.com' }],
        photos: [{ value: 'https://example.com/oauth-photo.jpg' }]
      };

      // Step 2: Create or update user (simulating passport strategy)
      let user = await User.findOne({ googleId: googleUserData.id });
      
      if (!user) {
        user = await User.create({
          googleId: googleUserData.id,
          email: googleUserData.emails[0].value,
          name: googleUserData.displayName,
          googleImage: googleUserData.photos[0].value
        });
      }

      expect(user).toBeDefined();
      expect(user.email).toBe('oauth-test@example.com');

      // Step 3: Generate JWT token (simulating callback route)
      const token = jwt.sign(
        {
          userId: user._id,
          email: user.email,
          name: user.name
        },
        process.env.JWT_SECRET,
        {
          expiresIn: '30d',
          issuer: 'persona-arcana-api',
          audience: 'persona-arcana-mobile'
        }
      );

      expect(token).toBeDefined();

      // Step 4: Validate token (simulating API request)
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      expect(decoded.userId).toBe(user._id.toString());
      expect(decoded.email).toBe(user.email);

      // Step 5: Load user from token (simulating middleware)
      const authenticatedUser = await User.findById(decoded.userId);
      expect(authenticatedUser).toBeDefined();
      expect(authenticatedUser.email).toBe(user.email);
    });
  });
});

console.log('🧪 Running Authentication Integration Tests...');
console.log('✅ JWT_SECRET configured:', !!process.env.JWT_SECRET);
console.log('✅ Google OAuth configured:', !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET));
console.log('✅ MongoDB configured:', !!process.env.MONGODB_URI);