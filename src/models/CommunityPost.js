const mongoose = require('mongoose');

const communityPostSchema = new mongoose.Schema(
  {
    anonId: {
      type: String,
      required: true,
    },
    county: {
      type: String,
      required: true,
      index: true,
    },
    subLocation: {
      // e.g. "Kisumu East" within Kisumu
      type: String,
      default: null,
    },
    text: {
      type: String,
      required: true,
      maxlength: 600,
    },
    category: {
      type: String,
      required: true,
      index: true,
    },
    agreeCount: {
      type: Number,
      default: 0,
    },
    agreedBy: [
      {
        type: String, // anonId, prevents double-agreeing
      },
    ],
    flagged: {
      type: Boolean,
      default: false,
    },
    moderationStatus: {
      type: String,
      enum: ['approved', 'pending', 'rejected'],
      default: 'approved',
    },
  },
  { timestamps: true }
);

communityPostSchema.index({ createdAt: -1 });

module.exports = mongoose.model('CommunityPost', communityPostSchema);
