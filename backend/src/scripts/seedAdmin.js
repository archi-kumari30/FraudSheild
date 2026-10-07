const { connectDB, disconnectDB } = require('../config/db');
const config = require('../config');
const User = require('../models/User');

const seedAdmin = async (shouldDisconnect = (require.main === module)) => {
  try {
    await connectDB();

    const adminEmail = config.adminSeed.email.toLowerCase();
    const existingAdmin = await User.findOne({ email: adminEmail });

    if (existingAdmin) {
      console.log(`[SEED] Admin account (${adminEmail}) already exists. Role: ${existingAdmin.role}`);
      if (shouldDisconnect) await disconnectDB();
      return existingAdmin;
    }

    if (process.env.NODE_ENV === 'production' && !process.env.ALLOW_ADMIN_SEED_IN_PRODUCTION) {
      console.warn('[SEED GUARD] Auto-seeding default admin in production is disallowed for security.');
      if (shouldDisconnect) await disconnectDB();
      return null;
    }

    const passwordHash = await User.hashPassword(config.adminSeed.password);

    const adminUser = new User({
      name: config.adminSeed.name,
      email: adminEmail,
      passwordHash,
      role: 'admin',
      isActive: true
    });

    await adminUser.save();
    console.log(`[SEED] Admin account provisioned successfully: ${adminEmail}`);
    console.log(`[SEED] Login via web interface: ${adminEmail} / [configured ADMIN_PASSWORD]`);

    if (shouldDisconnect) await disconnectDB();
    return adminUser;
  } catch (error) {
    console.error('[SEED ERROR] Failed to provision admin account:', error.message);
    if (shouldDisconnect) {
      await disconnectDB();
      process.exit(1);
    }
    throw error;
  }
};

if (require.main === module) {
  seedAdmin(true);
}

module.exports = seedAdmin;
