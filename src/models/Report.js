// src/models/Report.js
const mongoose = require('mongoose');

const { Schema } = mongoose;

const reportSchema = new Schema(
  {
    reporter: { type: Schema.Types.ObjectId, ref: 'User', required: true },

    entityType: {
      type: String,
      enum: ['USER', 'POST', 'COMMENT'],
      required: true,
    },
    entityId: { type: Schema.Types.ObjectId, required: true },

    reason: {
      type: String,
      enum: ['SPAM', 'HARASSMENT', 'HATE_SPEECH', 'MISINFORMATION', 'INAPPROPRIATE_CONTENT', 'OTHER'],
      required: true,
    },
    details: { type: String, maxlength: 500 },

    status: {
      type: String,
      enum: ['PENDING', 'REVIEWED', 'ACTIONED', 'DISMISSED'],
      default: 'PENDING',
      index: true,
    },

    resolution: {
      type: String,
      enum: ['DISMISS', 'WARN_USER', 'SUSPEND_USER', 'BAN_USER', 'REMOVE_CONTENT'],
      default: null,
    },
    resolutionNote: { type: String, maxlength: 500 },
    resolvedByAdmin: { type: Schema.Types.ObjectId, ref: 'AdminUser', default: null },
    resolvedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

module.exports = mongoose.model('Report', reportSchema);
