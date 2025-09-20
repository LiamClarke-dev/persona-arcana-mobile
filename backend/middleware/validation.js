const Joi = require('joi');
const mongoose = require('mongoose');

/**
 * Validation middleware factory
 */
const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, { 
      abortEarly: false,
      stripUnknown: true 
    });
    
    if (error) {
      const details = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        value: detail.context?.value
      }));
      
      return res.status(400).json({
        success: false,
        data: null,
        error: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details
      });
    }
    
    next();
  };
};

/**
 * Validate MongoDB ObjectId
 */
const validateObjectId = (paramName) => {
  return (req, res, next) => {
    const id = req.params[paramName];
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        data: null,
        error: `Invalid ${paramName} format`,
        code: 'INVALID_OBJECT_ID'
      });
    }
    
    next();
  };
};

/**
 * Validation schemas
 */
const schemas = {
  createUser: Joi.object({
    email: Joi.string().email().required(),
    name: Joi.string().min(1).max(100).required(),
    googleId: Joi.string().optional(),
    googleImage: Joi.string().uri().optional(),
    profileImage: Joi.string().uri().optional()
  }),

  updateUser: Joi.object({
    name: Joi.string().min(1).max(100).optional(),
    profileImage: Joi.string().uri().allow(null).optional(),
    preferences: Joi.object({
      notifications: Joi.object({
        enabled: Joi.boolean().optional(),
        pushToken: Joi.string().optional(),
        dailyReminder: Joi.boolean().optional(),
        reminderTime: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).optional()
      }).optional()
    }).optional(),
    onboarding: Joi.object({
      completed: Joi.boolean().optional(),
      step: Joi.string().valid('welcome', 'first-entry', 'persona-intro', 'completed').optional(),
      completedAt: Joi.date().optional()
    }).optional()
  }),

  userPreferences: Joi.object({
    notifications: Joi.object({
      enabled: Joi.boolean().optional(),
      pushToken: Joi.string().optional(),
      dailyReminder: Joi.boolean().optional(),
      reminderTime: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).optional()
    }).optional()
  })
};

module.exports = {
  validate,
  validateObjectId,
  schemas
};