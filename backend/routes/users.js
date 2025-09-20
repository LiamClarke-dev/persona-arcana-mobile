const express = require('express');
const Joi = require('joi');
const User = require('../models/User');
const { asyncHandler, APIError } = require('../middleware/errorHandler');
const { validate, validateObjectId, schemas } = require('../middleware/validation');
const { rateLimits } = require('../middleware/security');
const { requireAuth, requireOwnership } = require('../middleware/auth');

const router = express.Router();

// Apply rate limiting to all user routes
router.use(rateLimits.general);

// GET /api/users - List users (for admin/testing purposes)
router.get('/', asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  
  const users = await User.find()
    .select('-__v') // Exclude version field
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .sort({ createdAt: -1 });

  const total = await User.countDocuments();

  res.json({
    success: true,
    data: {
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    },
    error: null,
    code: null,
  });
}));

// GET /api/users/me - Get current user profile
router.get('/me', 
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id).select('-__v');
    
    res.json({
      success: true,
      data: user,
      error: null,
      code: null,
    });
  })
);

// GET /api/users/:id - Get user by ID (requires ownership)
router.get('/:id', 
  validateObjectId('id'),
  requireAuth,
  asyncHandler(async (req, res) => {
    // Check if user is accessing their own profile
    if (req.user._id.toString() !== req.params.id) {
      throw new APIError('Access denied. You can only access your own profile.', 403, 'ACCESS_DENIED');
    }
    const user = await User.findById(req.params.id).select('-__v');
    
    if (!user) {
      throw new APIError('User not found', 404, 'USER_NOT_FOUND');
    }
    
    res.json({
      success: true,
      data: user,
      error: null,
      code: null,
    });
  })
);

// POST /api/users - Create new user
router.post('/',
  validate(schemas.createUser),
  asyncHandler(async (req, res) => {
    const { email, name, googleId, googleImage } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({ 
      $or: [{ email }, { googleId }] 
    });
    
    if (existingUser) {
      throw new APIError('User already exists', 409, 'USER_EXISTS');
    }
    
    const user = new User({
      email,
      name,
      googleId,
      googleImage,
    });
    
    await user.save();
    
    res.status(201).json({
      success: true,
      data: user,
      error: null,
      code: null,
    });
  })
);

// PUT /api/users/me - Update current user profile
router.put('/me',
  requireAuth,
  validate(schemas.updateUser),
  asyncHandler(async (req, res) => {
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { 
        ...req.body,
        updatedAt: new Date(),
      },
      { 
        new: true, 
        runValidators: true,
        select: '-__v',
      }
    );
    
    res.json({
      success: true,
      data: user,
      error: null,
      code: null,
    });
  })
);

// PUT /api/users/:id - Update user (requires ownership)
router.put('/:id',
  validateObjectId('id'),
  requireAuth,
  validate(schemas.updateUser),
  asyncHandler(async (req, res) => {
    // Check if user is updating their own profile
    if (req.user._id.toString() !== req.params.id) {
      throw new APIError('Access denied. You can only update your own profile.', 403, 'ACCESS_DENIED');
    }
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { 
        ...req.body,
        updatedAt: new Date(),
      },
      { 
        new: true, 
        runValidators: true,
        select: '-__v',
      }
    );
    
    if (!user) {
      throw new APIError('User not found', 404, 'USER_NOT_FOUND');
    }
    
    res.json({
      success: true,
      data: user,
      error: null,
      code: null,
    });
  })
);

// DELETE /api/users/:id - Delete user (requires ownership)
router.delete('/:id',
  validateObjectId('id'),
  requireAuth,
  asyncHandler(async (req, res) => {
    // Check if user is deleting their own account
    if (req.user._id.toString() !== req.params.id) {
      throw new APIError('Access denied. You can only delete your own account.', 403, 'ACCESS_DENIED');
    }
    const user = await User.findByIdAndDelete(req.params.id);
    
    if (!user) {
      throw new APIError('User not found', 404, 'USER_NOT_FOUND');
    }
    
    // TODO: In a real application, you might want to:
    // 1. Delete associated journal entries
    // 2. Delete uploaded files
    // 3. Log the deletion for audit purposes
    
    res.json({
      success: true,
      data: { 
        message: 'User deleted successfully',
        deletedUser: {
          id: user._id,
          email: user.email,
          name: user.name,
        },
      },
      error: null,
      code: null,
    });
  })
);

// GET /api/users/me/stats - Get current user statistics
router.get('/me/stats',
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id).select('stats');
    
    // Calculate additional stats
    const additionalStats = {
      accountAge: Math.floor((Date.now() - user.stats.joinedAt) / (1000 * 60 * 60 * 24)), // days
      lastActivity: user.stats.lastEntryDate ? 
        Math.floor((Date.now() - user.stats.lastEntryDate) / (1000 * 60 * 60 * 24)) : null, // days ago
    };
    
    res.json({
      success: true,
      data: {
        ...user.stats.toObject(),
        ...additionalStats,
      },
      error: null,
      code: null,
    });
  })
);

// GET /api/users/:id/stats - Get user statistics (requires ownership)
router.get('/:id/stats',
  validateObjectId('id'),
  requireAuth,
  asyncHandler(async (req, res) => {
    // Check if user is accessing their own stats
    if (req.user._id.toString() !== req.params.id) {
      throw new APIError('Access denied. You can only access your own statistics.', 403, 'ACCESS_DENIED');
    }
    const user = await User.findById(req.params.id).select('stats');
    
    if (!user) {
      throw new APIError('User not found', 404, 'USER_NOT_FOUND');
    }
    
    // Calculate additional stats
    const additionalStats = {
      accountAge: Math.floor((Date.now() - user.stats.joinedAt) / (1000 * 60 * 60 * 24)), // days
      lastActivity: user.stats.lastEntryDate ? 
        Math.floor((Date.now() - user.stats.lastEntryDate) / (1000 * 60 * 60 * 24)) : null, // days ago
    };
    
    res.json({
      success: true,
      data: {
        ...user.stats.toObject(),
        ...additionalStats,
      },
      error: null,
      code: null,
    });
  })
);

// PATCH /api/users/me/preferences - Update current user preferences
router.patch('/me/preferences',
  requireAuth,
  validate(Joi.object({
    notifications: Joi.object({
      enabled: Joi.boolean().optional(),
      pushToken: Joi.string().optional(),
      dailyReminder: Joi.boolean().optional(),
      reminderTime: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
    }).optional(),
  })),
  asyncHandler(async (req, res) => {
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { 
        $set: { 
          'preferences': req.body,
          updatedAt: new Date(),
        }
      },
      { 
        new: true, 
        runValidators: true,
        select: 'preferences',
      }
    );
    
    res.json({
      success: true,
      data: user.preferences,
      error: null,
      code: null,
    });
  })
);

// PATCH /api/users/:id/preferences - Update user preferences (requires ownership)
router.patch('/:id/preferences',
  validateObjectId('id'),
  requireAuth,
  validate(Joi.object({
    notifications: Joi.object({
      enabled: Joi.boolean().optional(),
      pushToken: Joi.string().optional(),
      dailyReminder: Joi.boolean().optional(),
      reminderTime: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
    }).optional(),
  })),
  asyncHandler(async (req, res) => {
    // Check if user is updating their own preferences
    if (req.user._id.toString() !== req.params.id) {
      throw new APIError('Access denied. You can only update your own preferences.', 403, 'ACCESS_DENIED');
    }
    
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { 
        $set: { 
          'preferences': req.body,
          updatedAt: new Date(),
        }
      },
      { 
        new: true, 
        runValidators: true,
        select: 'preferences',
      }
    );
    
    if (!user) {
      throw new APIError('User not found', 404, 'USER_NOT_FOUND');
    }
    
    res.json({
      success: true,
      data: user.preferences,
      error: null,
      code: null,
    });
  })
);

// PATCH /api/users/me/profile-image - Update current user profile image
router.patch('/me/profile-image',
  requireAuth,
  validate(Joi.object({
    profileImage: Joi.string().uri().required(),
  })),
  asyncHandler(async (req, res) => {
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { 
        profileImage: req.body.profileImage,
        updatedAt: new Date(),
      },
      { 
        new: true, 
        runValidators: true,
        select: '-__v',
      }
    );
    
    res.json({
      success: true,
      data: user,
      error: null,
      code: null,
    });
  })
);

// PATCH /api/users/:id/profile-image - Update user profile image (requires ownership)
router.patch('/:id/profile-image',
  validateObjectId('id'),
  requireAuth,
  validate(Joi.object({
    profileImage: Joi.string().uri().required(),
  })),
  asyncHandler(async (req, res) => {
    // Check if user is updating their own profile image
    if (req.user._id.toString() !== req.params.id) {
      throw new APIError('Access denied. You can only update your own profile image.', 403, 'ACCESS_DENIED');
    }
    
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { 
        profileImage: req.body.profileImage,
        updatedAt: new Date(),
      },
      { 
        new: true, 
        runValidators: true,
        select: '-__v',
      }
    );
    
    if (!user) {
      throw new APIError('User not found', 404, 'USER_NOT_FOUND');
    }
    
    res.json({
      success: true,
      data: user,
      error: null,
      code: null,
    });
  })
);

module.exports = router;