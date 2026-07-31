// scripts/seedSuperAdmin.js
//
// Run with: npm run seed:superadmin -- --email you@masauti.app --password Temp1234!
// Creates the first SUPER_ADMIN, with mustChangePassword=true and
// mfaEnabled=false — they'll be walked through MFA enrollment and a forced
// password change on first login, same as any admin created later.

require('dotenv').config();
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const env = require('../src/config/env');
const AdminUser = require('../models/AdminUser');

function parseArgs() {
  const args = {};
  process.argv.slice(2).forEach((arg, i, arr) => {
    if (arg.startsWith('--')) {
      const key = arg.slice(2);
      const value = arr[i + 1];
      args[key] = value;
    }
  });
  return args;
}

async function main() {
  const { email, password } = parseArgs();

  if (!email || !password) {
    console.error('Usage: npm run seed:superadmin -- --email you@masauti.app --password Temp1234!');
    process.exit(1);
  }

  await mongoose.connect(env.mongoUri);

  const existing = await AdminUser.findOne({ email: email.toLowerCase() });
  if (existing) {
    console.error(`An admin with email ${email} already exists.`);
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(password, env.bcryptRounds);

  const admin = await AdminUser.create({
    email: email.toLowerCase(),
    passwordHash,
    role: 'SUPER_ADMIN',
    mustChangePassword: true,
    mfaEnabled: false,
    active: true,
  });

  console.log(`Created SUPER_ADMIN ${admin.email} (id: ${admin._id})`);
  console.log('They will be prompted to set up MFA and change their password on first login.');

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
