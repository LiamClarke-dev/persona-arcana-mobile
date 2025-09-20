const AWS = require('aws-sdk');
const multer = require('multer');
const sharp = require('sharp');
const path = require('path');

// Configure DigitalOcean Spaces (S3-compatible)
const spacesEndpoint = new AWS.Endpoint(process.env.DO_SPACES_ENDPOINT);
const s3 = new AWS.S3({
  endpoint: spacesEndpoint,
  accessKeyId: process.env.DO_SPACES_ACCESS_KEY,
  secretAccessKey: process.env.DO_SPACES_SECRET_KEY,
  region: process.env.DO_SPACES_REGION,
  s3ForcePathStyle: false, // Configures to use subdomain/virtual calling format
});

// File validation middleware
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error('Invalid file type. Only JPEG, PNG, and WebP are allowed.'),
      false
    );
  }
};

// Multer configuration for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter,
});

class UploadService {
  /**
   * Upload profile image to DigitalOcean Spaces
   * @param {string} userId - User ID for organizing files
   * @param {Object} file - Multer file object
   * @returns {Promise<string>} - URL of uploaded file
   */
  async uploadProfileImage(userId, file) {
    try {
      // Optimize image using Sharp
      const optimizedBuffer = await sharp(file.buffer)
        .resize(400, 400, { fit: 'cover' })
        .webp({ quality: 80 })
        .toBuffer();

      const key = `profiles/${userId}/${Date.now()}.webp`;

      const uploadParams = {
        Bucket: process.env.DO_SPACES_BUCKET,
        Key: key,
        Body: optimizedBuffer,
        ContentType: 'image/webp',
        ACL: 'public-read',
        CacheControl: 'max-age=31536000', // 1 year cache for CDN
      };

      const result = await s3.upload(uploadParams).promise();
      return result.Location;
    } catch (error) {
      throw new Error(`Profile image upload failed: ${error.message}`);
    }
  }

  /**
   * Upload persona card image to DigitalOcean Spaces
   * @param {string} personaId - Persona ID for organizing files
   * @param {Object} file - Multer file object
   * @returns {Promise<string>} - URL of uploaded file
   */
  async uploadPersonaImage(personaId, file) {
    try {
      // Optimize image for persona cards (larger size for quality)
      const optimizedBuffer = await sharp(file.buffer)
        .resize(600, 800, { fit: 'cover' })
        .webp({ quality: 85 })
        .toBuffer();

      const key = `personas/${personaId}/${Date.now()}.webp`;

      const uploadParams = {
        Bucket: process.env.DO_SPACES_BUCKET,
        Key: key,
        Body: optimizedBuffer,
        ContentType: 'image/webp',
        ACL: 'public-read',
        CacheControl: 'max-age=31536000', // 1 year cache for CDN
      };

      const result = await s3.upload(uploadParams).promise();
      return result.Location;
    } catch (error) {
      throw new Error(`Persona image upload failed: ${error.message}`);
    }
  }

  /**
   * Upload audio file to DigitalOcean Spaces
   * @param {string} userId - User ID for organizing files
   * @param {Object} file - Multer file object
   * @returns {Promise<string>} - URL of uploaded file
   */
  async uploadAudioFile(userId, file) {
    try {
      const fileExtension = path.extname(file.originalname);
      const key = `audio/${userId}/${Date.now()}${fileExtension}`;

      const uploadParams = {
        Bucket: process.env.DO_SPACES_BUCKET,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
        ACL: 'public-read',
        CacheControl: 'max-age=86400', // 1 day cache for audio files
      };

      const result = await s3.upload(uploadParams).promise();
      return result.Location;
    } catch (error) {
      throw new Error(`Audio file upload failed: ${error.message}`);
    }
  }

  /**
   * Delete file from DigitalOcean Spaces
   * @param {string} fileUrl - Full URL of the file to delete
   * @returns {Promise<boolean>} - Success status
   */
  async deleteFile(fileUrl) {
    try {
      // Extract key from URL
      const url = new URL(fileUrl);
      const key = url.pathname.substring(1); // Remove leading slash

      const deleteParams = {
        Bucket: process.env.DO_SPACES_BUCKET,
        Key: key,
      };

      await s3.deleteObject(deleteParams).promise();
      return true;
    } catch (error) {
      throw new Error(`File deletion failed: ${error.message}`);
    }
  }

  /**
   * Test connection to DigitalOcean Spaces
   * @returns {Promise<Object>} - Connection test result
   */
  async testConnection() {
    try {
      const params = {
        Bucket: process.env.DO_SPACES_BUCKET,
      };

      await s3.headBucket(params).promise();
      
      return {
        success: true,
        message: 'Successfully connected to DigitalOcean Spaces',
        bucket: process.env.DO_SPACES_BUCKET,
        endpoint: process.env.DO_SPACES_ENDPOINT,
      };
    } catch (error) {
      return {
        success: false,
        message: `Connection failed: ${error.message}`,
        error: error.code,
      };
    }
  }

  /**
   * Get file metadata from DigitalOcean Spaces
   * @param {string} fileUrl - Full URL of the file
   * @returns {Promise<Object>} - File metadata
   */
  async getFileMetadata(fileUrl) {
    try {
      const url = new URL(fileUrl);
      const key = url.pathname.substring(1);

      const params = {
        Bucket: process.env.DO_SPACES_BUCKET,
        Key: key,
      };

      const result = await s3.headObject(params).promise();
      
      return {
        success: true,
        data: {
          size: result.ContentLength,
          lastModified: result.LastModified,
          contentType: result.ContentType,
          cacheControl: result.CacheControl,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }
}

module.exports = { UploadService, upload };