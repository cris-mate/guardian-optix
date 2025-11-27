const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
require('dotenv').config(); // Load environment variables

// --- CONFIGURATION  VIA ENVIRONMENT VARIABLES ---
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@guardianoptix.co.uk';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

const dbURI = process.env.DB_URI || 'mongodb://localhost:27017/guardian-optix-db';

const seedAdmin = async () => {
  if (!ADMIN_PASSWORD) {
    console.error('ERROR: ADMIN_PASSWORD environment variable is required.');
    console.error('Set it in your .env file.');
    process.exit(1);
  }

  try {
    await mongoose.connect(dbURI);
    console.log('MongoDB connected for seeding...');

    // Check if an admin user already exists
    const existingAdmin = await User.findOne({ email: ADMIN_USERNAME });
    if (existingAdmin) {
      console.log('Admin user already exists. No action taken.');
      return;
    }

    // If no admin exists, create one
    console.log('Admin user not found, creating one...');
    const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 12);

    const adminUser = new User({
      fullName: 'Guardian Optix Admin',
      username: ADMIN_USERNAME,
      email: ADMIN_EMAIL,
      phoneNumber: '00000000',
      postCode: 'XX0 0XX',
      password: hashedPassword,
      role: 'Admin',
    });

    await adminUser.save();
    console.log('Admin user created successfully.');


  } catch (error) {
    console.log('Error during admin seeding: ', error);
  } finally {
    await mongoose.connection.close();
    console.log('MongoDB connection closed.');
  }
};

void seedAdmin();