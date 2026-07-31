// src/models/CommunityPost.js
//
// Minimal shape matching your `POST /api/community` (Share an Insight)
// endpoint. Same note as User.js — if this already exists in your consumer
// app codebase, import that instead of this file.

const mongoose = require('mongoose');

const { Schema } = mongoose;

const communityPostSchema = new Schema(
  {
    author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    county: { type: String, index: true },
    text: { type: String, required: true, maxlength: 1000 },
    tag: { type: String },
    agreeCount: { type: Number, default: 0 },
  },
  { timestamps: true },
);

module.exports = mongoose.models.CommunityPost || mongoose.model('CommunityPost', communityPostSchema);
