const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
require('dotenv').config();

// --- CONFIGURATION ---
const ADMIN_USERNAME = 'admin';
const ADMIN_EMAIL = 'admin@guardianoptix.co.uk';
const ADMIN_PASSWORD = 'secret';

const dbURI = process.env.DB_URI || 'mongodb://localhost:27017/guardian-optix-db';

const seedAdmin = async () => {
  try {
    await mongoose.connect(dbURI);
    console.log('MongoDB connected for seeding...');

    // Delete existing admin first
    const deleted = await User.findOneAndDelete({
      $or: [{ email: ADMIN_EMAIL }, { username: ADMIN_USERNAME }]
    });

    if (deleted) {
      console.log('Existing admin deleted.');
    }

    // Create fresh admin
    const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);

    const adminUser = new User({
      fullName: 'Guardian Optix Admin',
      username: ADMIN_USERNAME,
      email: ADMIN_EMAIL,
      phoneNumber: '12345678',
      postCode: 'NN1 1AA',
      password: hashedPassword,
      role: 'Admin',
    });

    await adminUser.save();
    console.log('Admin user created successfully.');

  } catch (error) {
    console.error('Error during admin seeding:', error);
  } finally {
    await mongoose.connection.close();
    console.log('MongoDB connection closed.');
  }
};

void seedAdmin();