const request = require('supertest');
const path = require('path');
const fs = require('fs');
const { app } = require('../server');
const { UploadService } = require('../services/uploadService');

describe('DigitalOcean Spaces Upload Tests', () => {
  let uploadService;

  beforeAll(() => {
    uploadService = new UploadService();
  });

  describe('Connection Tests', () => {
    it('should test DigitalOcean Spaces connection', async () => {
      const response = await request(app)
        .get('/api/upload/test')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.bucket).toBe(process.env.DO_SPACES_BUCKET);
      expect(response.body.data.endpoint).toBe(process.env.DO_SPACES_ENDPOINT);
    });
  });

  describe('Profile Image Upload', () => {
    it('should upload a valid profile image', async () => {
      // Create a test image buffer (1x1 pixel PNG)
      const testImageBuffer = Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==',
        'base64'
      );

      const response = await request(app)
        .post('/api/upload/profile/test-user-123')
        .attach('image', testImageBuffer, 'test.png')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.imageUrl).toContain('digitaloceanspaces.com');
      expect(response.body.data.imageUrl).toContain('profiles/test-user-123');
      expect(response.body.data.mimeType).toBe('image/png');
    });

    it('should reject oversized files', async () => {
      // Create a buffer larger than 5MB
      const largeBuffer = Buffer.alloc(6 * 1024 * 1024);

      const response = await request(app)
        .post('/api/upload/profile/test-user-123')
        .attach('image', largeBuffer, 'large.jpg')
        .expect(413);

      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('FILE_TOO_LARGE');
    });

    it('should reject unsupported file types', async () => {
      const textBuffer = Buffer.from('This is not an image');

      const response = await request(app)
        .post('/api/upload/profile/test-user-123')
        .attach('image', textBuffer, 'test.txt')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('INVALID_FILE_TYPE');
    });

    it('should return error when no file is provided', async () => {
      const response = await request(app)
        .post('/api/upload/profile/test-user-123')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('NO_FILE_PROVIDED');
    });
  });

  describe('Persona Image Upload', () => {
    it('should upload a valid persona image', async () => {
      const testImageBuffer = Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==',
        'base64'
      );

      const response = await request(app)
        .post('/api/upload/persona/test-persona-456')
        .attach('image', testImageBuffer, 'persona.png')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.imageUrl).toContain('digitaloceanspaces.com');
      expect(response.body.data.imageUrl).toContain('personas/test-persona-456');
    });
  });

  describe('File Metadata', () => {
    it('should return error for invalid file URL', async () => {
      const response = await request(app)
        .get('/api/upload/metadata?fileUrl=invalid-url')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('FILE_NOT_FOUND');
    });

    it('should return error when no file URL is provided', async () => {
      const response = await request(app)
        .get('/api/upload/metadata')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('NO_FILE_URL');
    });
  });

  describe('File Deletion', () => {
    it('should return error when no file URL is provided', async () => {
      const response = await request(app)
        .delete('/api/upload/file')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('NO_FILE_URL');
    });
  });

  describe('UploadService Unit Tests', () => {
    it('should handle connection test', async () => {
      const result = await uploadService.testConnection();
      
      // Should either succeed or fail gracefully
      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('message');
      
      if (result.success) {
        expect(result.bucket).toBe(process.env.DO_SPACES_BUCKET);
        expect(result.endpoint).toBe(process.env.DO_SPACES_ENDPOINT);
      }
    });
  });
});