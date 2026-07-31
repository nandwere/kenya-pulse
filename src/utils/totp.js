// src/utils/totp.js
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');

const ISSUER = 'Masauti Admin';

/**
 * Generates a new TOTP secret for an admin who hasn't confirmed MFA yet.
 * Returns both the base32 secret (for manual entry) and a ready-to-render
 * QR code data URL — the caller decides where each gets shown.
 */
async function generateSecret(adminEmail) {
  const secret = speakeasy.generateSecret({
    name: `${ISSUER} (${adminEmail})`,
    issuer: ISSUER,
    length: 20,
  });

  const qrCodeDataUrl = await QRCode.toDataURL(secret.otpauth_url);

  return {
    base32: secret.base32,
    otpauthUrl: secret.otpauth_url,
    qrCodeDataUrl,
  };
}

/**
 * Verifies a 6-digit code against a base32 secret. `window: 1` tolerates
 * ±30s of clock drift between the server and the user's authenticator app.
 */
function verifyCode(base32Secret, code) {
  return speakeasy.totp.verify({
    secret: base32Secret,
    encoding: 'base32',
    token: code,
    window: 1,
  });
}

module.exports = { generateSecret, verifyCode };
