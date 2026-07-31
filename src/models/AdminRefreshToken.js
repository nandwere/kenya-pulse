// src/models/AdminRefreshToken.js
const mongoose = require('mongoose');

const { Schema } = mongoose;

const adminRefreshTokenSchema = new Schema(
  {
    admin: { type: Schema.Types.ObjectId, ref: 'AdminUser', required: true, index: true },
    tokenHash: { type: String, required: true, unique: true },
    expiresAt: { type: Date, required: true },
    revokedAt: { type: Date, default: null },
    ipAddress: { type: String },
    userAgent: { type: String },
  },
  { timestamps: true },
);

// MongoDB TTL index — automatically deletes documents once expiresAt passes,
// so revoked/expired tokens don't accumulate forever.
adminRefreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('AdminRefreshToken', adminRefreshTokenSchema);
