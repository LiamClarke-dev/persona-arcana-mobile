const request = require('supertest');
const mongoose = require('mongoose');
const { app, User } = require('../server');

// Test database connection
describe('MongoDB Atlas Connection and User CRUD', () => {
  beforeAll(async () => {
    // Wait for database connection
    if (mongoose.connection.readyState !== 1) {
      await new Promise((resolve) => {
        mongoose.connection.on('connected', resolve);
      });
    }
  });

  afterAll(async () => {
    // Clean up test data
    await User.deleteMany({ email: { $regex: /test.*@example\.com/ } });
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    // Clean up before each test
    await User.deleteMany({ email: { $regex: /test.*@example\.com/ } });
  });

  describe('Database Connection', () => {
    it('should be connected to MongoDB Atlas', () => {
      expect(mongoose.connection.readyState).toBe(1);
    });

    it('should have User model available', () => {
      expect(User).toBeDefined();
      expect(User.modelName).toBe('User');
    });
  });

  describe('User CRUD Operations', () => {
    it('should create a new user', async () => {
      const userData = {
        email: 'test1@example.com',
        name: 'Test User 1',
        googleId: 'google-test-123',
      };

      const response = await request(app)
        .post('/api/users')
        .send(userData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.email).toBe(userData.email);
      expect(response.body.data.name).toBe(userData.name);
      expect(response.body.data.googleId).toBe(userData.googleId);
      expect(response.body.data._id).toBeDefined();
      
      // Check default values
      expect(response.body.data.preferences.notifications.enabled).toBe(true);
      expect(response.body.data.onboarding.completed).toBe(false);
      expect(response.body.data.stats.totalEntries).toBe(0);
    });

    it('should get user by ID', async () => {
      // Create a user first
      const user = new User({
        email: 'test2@example.com',
        name: 'Test User 2',
        googleId: 'google-test-456',
      });
      await user.save();

      const response = await request(app)
        .get(`/api/users/${user._id}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data._id).toBe(user._id.toString());
      expect(response.body.data.email).toBe(user.email);
    });

    it('should update user', async () => {
      // Create a user first
      const user = new User({
        email: 'test3@example.com',
        name: 'Test User 3',
        googleId: 'google-test-789',
      });
      await user.save();

      const updateData = {
        name: 'Updated Test User 3',
        'preferences.notifications.enabled': false,
      };

      const response = await request(app)
        .put(`/api/users/${user._id}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(updateData.name);
      expect(response.body.data.preferences.notifications.enabled).toBe(false);
    });

    it('should delete user', async () => {
      // Create a user first
      const user = new User({
        email: 'test4@example.com',
        name: 'Test User 4',
        googleId: 'google-test-101',
      });
      await user.save();

      const response = await request(app)
        .delete(`/api/users/${user._id}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.message).toBe('User deleted successfully');

      // Verify user is deleted
      const deletedUser = await User.findById(user._id);
      expect(deletedUser).toBeNull();
    });

    it('should handle user not found', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .get(`/api/users/${nonExistentId}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('USER_NOT_FOUND');
    });

    it('should validate required fields', async () => {
      const invalidUserData = {
        name: 'Test User Without Email',
      };

      const response = await request(app)
        .post('/api/users')
        .send(invalidUserData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('USER_CREATE_ERROR');
    });

    it('should enforce unique email constraint', async () => {
      // Clean up any existing users with this email and googleId first
      await User.deleteMany({ 
        $or: [
          { email: 'test-duplicate@example.com' },
          { googleId: { $in: ['google-first', 'google-second'] } }
        ]
      });
      
      const userData = {
        email: 'test-duplicate@example.com',
        name: 'First User',
        googleId: 'google-first',
      };

      // Create first user
      const firstResponse = await request(app)
        .post('/api/users')
        .send(userData)
        .expect(201);

      // Try to create second user with same email
      const duplicateData = {
        email: 'test-duplicate@example.com',
        name: 'Second User',
        googleId: 'google-second',
      };

      const response = await request(app)
        .post('/api/users')
        .send(duplicateData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('USER_CREATE_ERROR');
    });
  });

  describe('User Schema Validation', () => {
    it('should have proper indexes', async () => {
      const indexes = await User.collection.getIndexes();
      
      // Check that email index exists
      expect(indexes).toHaveProperty('email_1');
      
      // Check that googleId index exists
      expect(indexes).toHaveProperty('googleId_1');
      
      // Check that stats.lastEntryDate index exists
      const indexNames = Object.keys(indexes);
      expect(indexNames).toContain('stats.lastEntryDate_-1');
    });

    it('should validate onboarding step enum', async () => {
      const user = new User({
        email: 'test-enum@example.com',
        name: 'Test Enum User',
        onboarding: {
          step: 'invalid-step',
        },
      });

      await expect(user.save()).rejects.toThrow();
    });

    it('should set default values correctly', async () => {
      const user = new User({
        email: 'test-defaults@example.com',
        name: 'Test Defaults User',
      });

      await user.save();

      expect(user.preferences.notifications.enabled).toBe(true);
      expect(user.preferences.notifications.dailyReminder).toBe(true);
      expect(user.preferences.notifications.reminderTime).toBe('20:00');
      expect(user.onboarding.completed).toBe(false);
      expect(user.onboarding.step).toBe('welcome');
      expect(user.stats.totalEntries).toBe(0);
      expect(user.stats.streakDays).toBe(0);
      expect(user.stats.joinedAt).toBeDefined();
    });
  });
});