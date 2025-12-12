/**
 * Jest Configuration for Backend Tests
 *
 * Configures Jest for Node.js/Express testing.
 * Supports both unit tests and integration tests.
 */

module.exports = {
  // Test environment
  testEnvironment: 'node',

  // Root directory
  rootDir: '.',

  // Test file patterns
  testMatch: [
    '**/__tests__/**/*.test.js',
    '**/__tests__/**/*.api.test.js',
    '**/*.spec.js',
  ],

  // Test path ignore patterns
  testPathIgnorePatterns: [
    '/node_modules/',
    '/__tests__/integration/testApp.js',
    '/__tests__/utils/testHelpers.js',
  ],

  // Projects for separate test suites
  projects: [
    {
      displayName: 'unit',
      testMatch: [
        '<rootDir>/__tests__/middleware/**/*.test.js',
        '<rootDir>/__tests__/controllers/**/*.test.js',
        '<rootDir>/__tests__/services/**/*.test.js',
        '<rootDir>/__tests__/utils/**/*.test.js',
      ],
      testEnvironment: 'node',
      setupFilesAfterEnv: ['<rootDir>/__tests__/setup.js'],
    },
    {
      displayName: 'integration',
      testMatch: ['<rootDir>/__tests__/integration/**/*.api.test.js'],
      testEnvironment: 'node',
      setupFilesAfterEnv: ['<rootDir>/__tests__/setup.js'],
      testTimeout: 30000,
    },
  ],

  // Coverage configuration
  collectCoverageFrom: [
    'controllers/**/*.js',
    'middleware/**/*.js',
    'services/**/*.js',
    'utils/**/*.js',
    'models/**/*.js',
    '!**/node_modules/**',
    '!**/__tests__/**',
  ],

  // Coverage thresholds (target: 80%+)
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 75,
      lines: 80,
      statements: 80,
    },
  },

  // Coverage output directory
  coverageDirectory: 'coverage',

  // Coverage reporters
  coverageReporters: ['text', 'lcov', 'html'],

  // Setup files
  setupFilesAfterEnv: ['<rootDir>/__tests__/setup.js'],

  // Module paths
  moduleDirectories: ['node_modules', '<rootDir>'],

  // Timeout for async tests
  testTimeout: 10000,

  // Clear mocks between tests
  clearMocks: true,

  // Verbose output
  verbose: true,

  // Force exit after tests complete
  forceExit: true,

  // Detect open handles
  detectOpenHandles: true,
};