/**
 * Test Application Setup
 *
 * Creates an isolated Express app instance for integration testing.
 * Uses mongodb-memory-server for in-memory database.
 */

const express = require('express');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

// ============================================
// Express App Factory
// ============================================

/**
 * Create Express app for testing
 * Mirrors production setup without starting server
 */
const createApp = () => {
  const app = express();

  // Middleware
  app.use(express.json());

  // Routes
  const authRoutes = require('../../routes/authRoutes');
  const clientRoutes = require('../../routes/clientRoutes');
  const siteRoutes = require('../../routes/siteRoutes');
  const guardsRoutes = require('../../routes/guardsRoutes');

  app.use('/api/auth', authRoutes);
  app.use('/api/clients', clientRoutes);
  app.use('/api/sites', siteRoutes);
  app.use('/api/guards', guardsRoutes);

  // Error handling (simplified for testing)
  app.use((err, req, res, next) => {
    console.error('Test Error:', err.message);
    res.status(err.statusCode || 500).json({
      success: false,
      message: err.message || 'Server Error',
    });
  });

  // 404 handler
  app.use((req, res) => {
    res.status(404).json({
      success: false,
      message: `Route ${req.method} ${req.originalUrl} not found`,
    });
  });

  return app;
};

// ============================================
// Database Setup/Teardown
// ============================================

let mongoServer;

/**
 * Connect to in-memory MongoDB
 */
const setupTestDB = async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();

  await mongoose.connect(mongoUri);
};

/**
 * Clear all collections
 */
const clearTestDB = async () => {
  const collections = mongoose.connection.collections;

  for (const key in collections) {
    await collections[key].deleteMany({});
  }
};

/**
 * Disconnect and stop in-memory MongoDB
 */
const closeTestDB = async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  await mongoServer.stop();
};

// ============================================
// Test Data Seeders
// ============================================

const bcrypt = require('bcryptjs');
const User = require('../../models/User');
const Client = require('../../models/Client');
const Site = require('../../models/Site');

/**
 * Seed test users for different roles
 */
const seedUsers = async () => {
  const hashedPassword = await bcrypt.hash('password123', 10);

  const users = await User.insertMany([
    {
      fullName: 'Admin User',
      username: 'adminuser',
      email: 'admin@test.com',
      phoneNumber: '07777000001',
      postCode: 'EC1A 1AA',
      password: hashedPassword,
      role: 'Admin',
    },
    {
      fullName: 'Manager User',
      username: 'manageruser',
      email: 'manager@test.com',
      phoneNumber: '07777000002',
      postCode: 'EC1A 1BB',
      password: hashedPassword,
      role: 'Manager',
      managerType: 'Operations Manager',
    },
    {
      fullName: 'Guard User',
      username: 'guarduser',
      email: 'guard@test.com',
      phoneNumber: '07777000003',
      postCode: 'EC1A 1CC',
      password: hashedPassword,
      role: 'Guard',
      guardType: 'Static',
      availability: true,
    },
  ]);

  return {
    admin: users[0],
    manager: users[1],
    guard: users[2],
  };
};

/**
 * Seed test client
 */
const seedClient = async () => {
  const client = await Client.create({
    name: 'Test Client Ltd',
    contactPerson: 'John Contact',
    email: 'client@test.com',
    phone: '02071234567',
    address: {
      street: '123 Test Street',
      city: 'London',
      postCode: 'EC1A 1AA',
      country: 'United Kingdom',
    },
    status: 'active',
  });

  return client;
};

/**
 * Seed test site
 */
const seedSite = async (clientId) => {
  const site = await Site.create({
    name: 'Test Site HQ',
    client: clientId,
    address: {
      street: '456 Site Road',
      city: 'London',
      postCode: 'EC1A 1BB',
      country: 'United Kingdom',
    },
    geofence: {
      center: { latitude: 51.5074, longitude: -0.1278 },
      radius: 150,
      isEnabled: true,
    },
    status: 'active',
  });

  return site;
};

// ============================================
// JWT Token Generator
// ============================================

const jwt = require('jsonwebtoken');

/**
 * Generate valid JWT for test user
 */
const generateToken = (user) => {
  return jwt.sign(
    { userId: user._id, role: user.role },
    process.env.JWT_SECRET || 'test-jwt-secret',
    { expiresIn: '1h' }
  );
};

// ============================================
// Exports
// ============================================

module.exports = {
  createApp,
  setupTestDB,
  clearTestDB,
  closeTestDB,
  seedUsers,
  seedClient,
  seedSite,
  generateToken,
};