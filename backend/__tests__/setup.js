/**
 * Jest Test Setup
 *
 * Configures test environment, mocks, and utilities.
 * Runs before each test file.
 */

// ============================================
// Environment Variables
// ============================================

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-key-for-unit-tests';
process.env.PORT = 5001;

// ============================================
// Global Test Utilities
// ============================================

// Extend Jest matchers
expect.extend({
  toBeWithinRange(received, floor, ceiling) {
    const pass = received >= floor && received <= ceiling;
    if (pass) {
      return {
        message: () =>
          `expected ${received} not to be within range ${floor} - ${ceiling}`,
        pass: true,
      };
    } else {
      return {
        message: () =>
          `expected ${received} to be within range ${floor} - ${ceiling}`,
        pass: false,
      };
    }
  },
});

// ============================================
// Console Suppression (Optional)
// ============================================

// Suppress console.log during tests (comment out for debugging)
// global.console = {
//   ...console,
//   log: jest.fn(),
//   debug: jest.fn(),
//   info: jest.fn(),
// };

// ============================================
// Cleanup
// ============================================

afterAll(async () => {
  // Clean up any open handles
  await new Promise((resolve) => setTimeout(resolve, 100));
});