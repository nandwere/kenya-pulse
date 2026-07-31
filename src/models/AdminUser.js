// src/models/AdminUser.js
const mongoose = require('mongoose');

const { Schema } = mongoose;

const adminUserSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: {
      type: String,
      enum: ['SUPER_ADMIN', 'MODERATOR', 'SUPPORT'],
      required: true,
      default: 'SUPPORT',
    },

    // MFA — secret is only persisted once setup is CONFIRMED via a valid code.
    // pendingTotpSecret holds an in-flight, unconfirmed enrollment attempt.
    mfaEnabled: { type: Boolean, default: false },
    totpSecret: { type: String, select: false },
    pendingTotpSecret: { type: String, select: false },

    mustChangePassword: { type: Boolean, default: true },
    active: { type: Boolean, default: true },

    failedLoginAttempts: { type: Number, default: 0 },
    lockedUntil: { type: Date, default: null },
    lastLoginAt: { type: Date, default: null },
  },
  { timestamps: true },
);

adminUserSchema.methods.isLocked = function isLocked() {
  return !!this.lockedUntil && this.lockedUntil.getTime() > Date.now();
};

module.exports = mongoose.model('AdminUser', adminUserSchema);
