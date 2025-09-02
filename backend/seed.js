const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/user');
require('dotenv').config(); // Load environment variables

// --- CONFIGURATION ---
const ADMIN_USERNAME = 'admin';
const ADMIN_EMAIL = 'admin@guardianoptix.co.uk'
const ADMIN_PASSWORD = 'secret';

const dbURI = process.env.DB_URI || 'mongodb://localhost:27017/guardian-optix-db';

const seedAdmin = async () => {
    try {
        await mongoose.connect(dbURI);
        console.log('MongoDB connected for seeding...');

        // Check if an admin user already exists
        const existingAdmin = await User.findOne({ email: ADMIN_EMAIL });
        if (existingAdmin) {
            console.log('Admin user already exists. No action taken.');
            return;
        }

        // If no admin exists, create one
        console.log('Admin user not found, creating one...');
        const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);

        const adminUser = new User({
            username: ADMIN_USERNAME,
            email: ADMIN_EMAIL,
            password: hashedPassword,
            role: 'admin',
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