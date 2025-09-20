const express = require('express');
const { UploadService, upload } = require('../services/uploadService');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
const uploadService = new UploadService();

/**
 * Test DigitalOcean Spaces connection
 * GET /api/upload/test
 */
router.get('/test', async (req, res) => {
  try {
    const result = await uploadService.testConnection();
    
    if (result.success) {
      res.json({
        success: true,
        data: result,
        error: null,
        code: null,
      });
    } else {
      res.status(500).json({
        success: false,
        data: null,
        error: result.message,
        code: 'CONNECTION_FAILED',
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      data: null,
      error: error.message,
      code: 'TEST_CONNECTION_ERROR',
    });
  }
});

/**
 * Upload profile image
 * POST /api/upload/profile/:userId
 */
router.post('/profile/:userId', requireAuth, (req, res) => {
  // Check if user is uploading to their own profile
  if (req.user._id.toString() !== req.params.userId) {
    return res.status(403).json({
      success: false,
      data: null,
      error: 'Access denied. You can only upload to your own profile.',
      code: 'ACCESS_DENIED',
    });
  }
  upload.single('image')(req, res, async (err) => {
    try {
      // Handle multer errors first
      if (err) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(413).json({
            success: false,
            data: null,
            error: 'File too large. Maximum size is 5MB.',
            code: 'FILE_TOO_LARGE',
          });
        }

        if (err.message.includes('Invalid file type')) {
          return res.status(400).json({
            success: false,
            data: null,
            error: err.message,
            code: 'INVALID_FILE_TYPE',
          });
        }

        return res.status(400).json({
          success: false,
          data: null,
          error: err.message,
          code: 'UPLOAD_ERROR',
        });
      }

      if (!req.file) {
        return res.status(400).json({
          success: false,
          data: null,
          error: 'No image file provided',
          code: 'NO_FILE_PROVIDED',
        });
      }

      const { userId } = req.params;
      const imageUrl = await uploadService.uploadProfileImage(userId, req.file);

      res.json({
        success: true,
        data: {
          imageUrl,
          originalName: req.file.originalname,
          size: req.file.size,
          mimeType: req.file.mimetype,
        },
        error: null,
        code: null,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        data: null,
        error: error.message,
        code: 'UPLOAD_ERROR',
      });
    }
  });
});

/**
 * Upload persona image
 * POST /api/upload/persona/:personaId
 */
router.post('/persona/:personaId', requireAuth, (req, res) => {
  upload.single('image')(req, res, async (err) => {
    try {
      // Handle multer errors first
      if (err) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(413).json({
            success: false,
            data: null,
            error: 'File too large. Maximum size is 5MB.',
            code: 'FILE_TOO_LARGE',
          });
        }

        if (err.message.includes('Invalid file type')) {
          return res.status(400).json({
            success: false,
            data: null,
            error: err.message,
            code: 'INVALID_FILE_TYPE',
          });
        }

        return res.status(400).json({
          success: false,
          data: null,
          error: err.message,
          code: 'UPLOAD_ERROR',
        });
      }

      if (!req.file) {
        return res.status(400).json({
          success: false,
          data: null,
          error: 'No image file provided',
          code: 'NO_FILE_PROVIDED',
        });
      }

      const { personaId } = req.params;
      const imageUrl = await uploadService.uploadPersonaImage(personaId, req.file);

      res.json({
        success: true,
        data: {
          imageUrl,
          originalName: req.file.originalname,
          size: req.file.size,
          mimeType: req.file.mimetype,
        },
        error: null,
        code: null,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        data: null,
        error: error.message,
        code: 'UPLOAD_ERROR',
      });
    }
  });
});

/**
 * Upload audio file
 * POST /api/upload/audio/:userId
 */
router.post('/audio/:userId', requireAuth, upload.single('audio'), async (req, res) => {
  // Check if user is uploading to their own account
  if (req.user._id.toString() !== req.params.userId) {
    return res.status(403).json({
      success: false,
      data: null,
      error: 'Access denied. You can only upload to your own account.',
      code: 'ACCESS_DENIED',
    });
  }
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        data: null,
        error: 'No audio file provided',
        code: 'NO_FILE_PROVIDED',
      });
    }

    const { userId } = req.params;
    const audioUrl = await uploadService.uploadAudioFile(userId, req.file);

    res.json({
      success: true,
      data: {
        audioUrl,
        originalName: req.file.originalname,
        size: req.file.size,
        mimeType: req.file.mimetype,
      },
      error: null,
      code: null,
    });
  } catch (error) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({
        success: false,
        data: null,
        error: 'File too large. Maximum size is 5MB.',
        code: 'FILE_TOO_LARGE',
      });
    }

    res.status(500).json({
      success: false,
      data: null,
      error: error.message,
      code: 'UPLOAD_ERROR',
    });
  }
});

/**
 * Delete file
 * DELETE /api/upload/file
 */
router.delete('/file', requireAuth, async (req, res) => {
  try {
    const { fileUrl } = req.body;

    if (!fileUrl) {
      return res.status(400).json({
        success: false,
        data: null,
        error: 'File URL is required',
        code: 'NO_FILE_URL',
      });
    }

    await uploadService.deleteFile(fileUrl);

    res.json({
      success: true,
      data: { message: 'File deleted successfully' },
      error: null,
      code: null,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      data: null,
      error: error.message,
      code: 'DELETE_ERROR',
    });
  }
});

/**
 * Get file metadata
 * GET /api/upload/metadata
 */
router.get('/metadata', async (req, res) => {
  try {
    const { fileUrl } = req.query;

    if (!fileUrl) {
      return res.status(400).json({
        success: false,
        data: null,
        error: 'File URL is required',
        code: 'NO_FILE_URL',
      });
    }

    const result = await uploadService.getFileMetadata(fileUrl);

    if (result.success) {
      res.json({
        success: true,
        data: result.data,
        error: null,
        code: null,
      });
    } else {
      res.status(404).json({
        success: false,
        data: null,
        error: result.error,
        code: 'FILE_NOT_FOUND',
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      data: null,
      error: error.message,
      code: 'METADATA_ERROR',
    });
  }
});

module.exports = router;