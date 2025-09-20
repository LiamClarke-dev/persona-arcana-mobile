const mongoose = require('mongoose');

const journalEntrySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    wordCount: {
      type: Number,
      required: true,
    },

    // Vector search preparation (Phase 3+)
    embeddings: {
      type: [Number],
      default: undefined, // Will be populated in future phases
    },

    // AI Analysis (Phase 2+)
    summary: String,
    moodScore: {
      type: Number,
      min: 1,
      max: 10,
    },
    tags: [
      {
        name: String,
        namespace: {
          type: String,
          enum: [
            'emotion',
            'relationship',
            'growth',
            'activity',
            'challenge',
            'insight',
            'system',
          ],
        },
        confidence: {
          type: Number,
          min: 0,
          max: 1,
        },
        evidence: {
          quote: String,
          reasoning: String,
        },
      },
    ],

    processingStatus: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed', 'queued'],
      default: 'pending',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for performance and vector search preparation
journalEntrySchema.index({ userId: 1, date: -1 });
journalEntrySchema.index({ userId: 1, processingStatus: 1 });

// Vector search index (will be created when vector search is enabled)
// This prepares the schema but doesn't create the index until needed
journalEntrySchema.index(
  { embeddings: 1 },
  {
    name: 'vector_search_index',
    partialFilterExpression: { embeddings: { $exists: true, $ne: null } },
  }
);

module.exports = mongoose.model('JournalEntry', journalEntrySchema);