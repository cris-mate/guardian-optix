/**
 * Test Utilities & Fixtures
 *
 * Shared helpers, mock factories, and test data for unit tests.
 * Centralizes test setup to maintain DRY principles.
 */

// ============================================
// Mock Request/Response Factories
// ============================================

/**
 * Create mock Express request object
 * @param {Object} options - Request configuration
 * @returns {Object} Mock request object
 */
const createMockRequest = ({
                             body = {},
                             params = {},
                             query = {},
                             user = null,
                             headers = {},
                           } = {}) => ({
  body,
  params,
  query,
  user,
  headers,
  header: jest.fn((name) => headers[name] || null),
  get: jest.fn((name) => headers[name] || null),
});

/**
 * Create mock Express response object
 * @returns {Object} Mock response with chainable methods
 */
const createMockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  res.set = jest.fn().mockReturnValue(res);
  res.cookie = jest.fn().mockReturnValue(res);
  res.clearCookie = jest.fn().mockReturnValue(res);
  return res;
};

/**
 * Create mock next function
 * @returns {Function} Jest mock function
 */
const createMockNext = () => jest.fn();

// ============================================
// Test User Fixtures
// ============================================

const testUsers = {
  admin: {
    _id: '507f1f77bcf86cd799439001',
    fullName: 'Admin User',
    username: 'adminuser',
    email: 'admin@guardian.com',
    phoneNumber: '07777000001',
    postCode: 'EC1A 1AA',
    role: 'Admin',
    createdAt: new Date('2024-01-01'),
  },

  manager: {
    _id: '507f1f77bcf86cd799439002',
    fullName: 'Manager User',
    username: 'manageruser',
    email: 'manager@guardian.com',
    phoneNumber: '07777000002',
    postCode: 'EC1A 1BB',
    role: 'Manager',
    managerType: 'Operations Manager',
    createdAt: new Date('2024-01-01'),
  },

  guard: {
    _id: '507f1f77bcf86cd799439003',
    fullName: 'Guard User',
    username: 'guarduser',
    email: 'guard@guardian.com',
    phoneNumber: '07777000003',
    postCode: 'EC1A 1CC',
    role: 'Guard',
    guardType: 'Static',
    availability: true,
    createdAt: new Date('2024-01-01'),
  },

  guardUnavailable: {
    _id: '507f1f77bcf86cd799439004',
    fullName: 'Unavailable Guard',
    username: 'unavailableguard',
    email: 'unavailable@guardian.com',
    phoneNumber: '07777000004',
    postCode: 'EC1A 1DD',
    role: 'Guard',
    guardType: 'Mobile Patrol',
    availability: false,
    createdAt: new Date('2024-01-01'),
  },
};

// ============================================
// Test Site Fixtures
// ============================================

const testSites = {
  londonOffice: {
    _id: '507f1f77bcf86cd799439101',
    name: 'London Head Office',
    client: '507f1f77bcf86cd799439201',
    address: {
      street: '123 Security Lane',
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
    requiredGuardType: 'Static',
    requiredCertifications: ['First Aid'],
  },

  manchesterWarehouse: {
    _id: '507f1f77bcf86cd799439102',
    name: 'Manchester Distribution Centre',
    client: '507f1f77bcf86cd799439201',
    address: {
      street: '456 Warehouse Road',
      city: 'Manchester',
      postCode: 'M1 1AA',
      country: 'United Kingdom',
    },
    geofence: {
      center: { latitude: 53.4808, longitude: -2.2426 },
      radius: 200,
      isEnabled: true,
    },
    status: 'active',
    requiredGuardType: 'Dog Handler',
    requiredCertifications: ['First Aid', 'Fire Safety'],
  },

  noGeofenceSite: {
    _id: '507f1f77bcf86cd799439103',
    name: 'Remote Site',
    client: '507f1f77bcf86cd799439201',
    address: {
      street: '789 Remote Street',
      city: 'Birmingham',
      postCode: 'B1 1AA',
      country: 'United Kingdom',
    },
    geofence: {
      isEnabled: false,
    },
    status: 'active',
  },
};

// ============================================
// Test Shift Fixtures
// ============================================

const testShifts = {
  morningShift: {
    _id: '507f1f77bcf86cd799439301',
    guard: testUsers.guard._id,
    site: testSites.londonOffice._id,
    date: '2024-12-15',
    startTime: '06:00',
    endTime: '14:00',
    shiftType: 'Morning',
    status: 'scheduled',
  },

  nightShift: {
    _id: '507f1f77bcf86cd799439302',
    guard: testUsers.guard._id,
    site: testSites.manchesterWarehouse._id,
    date: '2024-12-15',
    startTime: '22:00',
    endTime: '06:00',
    shiftType: 'Night',
    status: 'scheduled',
  },
};

// ============================================
// GPS Location Fixtures
// ============================================

const testLocations = {
  // London locations
  londonCentral: { latitude: 51.5074, longitude: -0.1278 },
  londonNorth: { latitude: 51.5174, longitude: -0.1278 }, // ~1.1km north
  londonFar: { latitude: 51.6074, longitude: -0.1278 }, // ~11km north

  // Manchester locations
  manchesterCentral: { latitude: 53.4808, longitude: -2.2426 },

  // Edge cases
  equator: { latitude: 0, longitude: 0 },
  northPole: { latitude: 90, longitude: 0 },
};

// ============================================
// JWT Token Helpers
// ============================================

const jwt = require('jsonwebtoken');

/**
 * Generate valid JWT token for testing
 * @param {Object} user - User object
 * @param {string} expiresIn - Token expiry (default: 7d)
 * @returns {string} JWT token
 */
const generateTestToken = (user, expiresIn = '7d') => {
  return jwt.sign(
    { userId: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn }
  );
};

/**
 * Generate expired JWT token for testing
 * @param {Object} user - User object
 * @returns {string} Expired JWT token
 */
const generateExpiredToken = (user) => {
  return jwt.sign(
    { userId: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '-1h' }
  );
};

/**
 * Generate token with wrong secret
 * @param {Object} user - User object
 * @returns {string} Invalid JWT token
 */
const generateInvalidToken = (user) => {
  return jwt.sign(
    { userId: user._id, role: user.role },
    'wrong-secret-key',
    { expiresIn: '7d' }
  );
};

// ============================================
// Database Mock Helpers
// ============================================

/**
 * Create mock Mongoose model
 * @param {Object} defaultData - Default return data
 * @returns {Object} Mock model with common methods
 */
const createMockModel = (defaultData = {}) => ({
  find: jest.fn().mockReturnValue({
    populate: jest.fn().mockReturnThis(),
    sort: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    lean: jest.fn().mockResolvedValue([defaultData]),
    exec: jest.fn().mockResolvedValue([defaultData]),
  }),
  findOne: jest.fn().mockReturnValue({
    populate: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    lean: jest.fn().mockResolvedValue(defaultData),
    exec: jest.fn().mockResolvedValue(defaultData),
  }),
  findById: jest.fn().mockReturnValue({
    populate: jest.fn().mockReturnThis(),
    select: jest.fn().mockResolvedValue(defaultData),
    lean: jest.fn().mockResolvedValue(defaultData),
    exec: jest.fn().mockResolvedValue(defaultData),
  }),
  create: jest.fn().mockResolvedValue(defaultData),
  findByIdAndUpdate: jest.fn().mockResolvedValue(defaultData),
  findByIdAndDelete: jest.fn().mockResolvedValue(defaultData),
  countDocuments: jest.fn().mockResolvedValue(1),
});

// ============================================
// Assertion Helpers
// ============================================

/**
 * Assert response is successful JSON
 * @param {Object} res - Mock response object
 * @param {number} expectedStatus - Expected HTTP status (default: 200)
 */
const expectSuccessResponse = (res, expectedStatus = 200) => {
  if (expectedStatus !== 200) {
    expect(res.status).toHaveBeenCalledWith(expectedStatus);
  }
  expect(res.json).toHaveBeenCalled();
};

/**
 * Assert response is error
 * @param {Object} res - Mock response object
 * @param {number} expectedStatus - Expected HTTP status
 * @param {string} expectedMessage - Expected error message (optional)
 */
const expectErrorResponse = (res, expectedStatus, expectedMessage = null) => {
  expect(res.status).toHaveBeenCalledWith(expectedStatus);
  if (expectedMessage) {
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: expectedMessage })
    );
  }
};

// ============================================
// Exports
// ============================================

module.exports = {
  // Request/Response factories
  createMockRequest,
  createMockResponse,
  createMockNext,

  // Fixtures
  testUsers,
  testSites,
  testShifts,
  testLocations,

  // JWT helpers
  generateTestToken,
  generateExpiredToken,
  generateInvalidToken,

  // Database helpers
  createMockModel,

  // Assertion helpers
  expectSuccessResponse,
  expectErrorResponse,
};