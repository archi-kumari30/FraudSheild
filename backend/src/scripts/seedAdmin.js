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
