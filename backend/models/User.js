const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    googleId: {
      type: String,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
    },
    name: {
      type: String,
      required: true,
    },
    profileImage: {
      type: String, // URL to image in DigitalOcean Spaces
      default: null,
    },
    googleImage: {
      type: String, // Original Google profile image
      default: null,
    },
    preferences: {
      notifications: {
        enabled: {
          type: Boolean,
          default: true,
        },
        pushToken: String, // Expo push token
        dailyReminder: {
          type: Boolean,
          default: true,
        },
        reminderTime: {
          type: String,
          default: '20:00', // 8 PM
        },
      },
    },
    onboarding: {
      completed: {
        type: Boolean,
        default: false,
      },
      step: {
        type: String,
        enum: ['welcome', 'first-entry', 'persona-intro', 'completed'],
        default: 'welcome',
      },
      completedAt: Date,
    },
    stats: {
      totalEntries: {
        type: Number,
        default: 0,
      },
      streakDays: {
        type: Number,
        default: 0,
      },
      lastEntryDate: Date,
      joinedAt: {
        type: Date,
        default: Date.now,
      },
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for performance
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ googleId: 1 }, { unique: true, sparse: true });
userSchema.index({ 'stats.lastEntryDate': -1 });

// Ensure no duplicate indexes by setting schema options
userSchema.set('autoIndex', true);

module.exports = mongoose.model('User', userSchema);