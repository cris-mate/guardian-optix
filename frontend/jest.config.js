/**
 * Jest Configuration for Frontend Tests
 *
 * Configures Jest for React Testing Library with TypeScript.
 */

module.exports = {
  // Test environment
  testEnvironment: 'jsdom',

  // Root directory
  rootDir: 'src',

  // Setup files
  setupFilesAfterEnv: ['<rootDir>/__tests__/setupTests.ts'],

  // Test file patterns
  testMatch: [
    '**/__tests__/**/*.test.ts',
    '**/__tests__/**/*.test.tsx',
  ],

  // Ignore patterns
  testPathIgnorePatterns: [
    '/node_modules/',
    '/__tests__/utils/',
  ],

  // Module name mapping for path aliases and assets
  moduleNameMapper: {
    // Handle CSS imports
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    // Handle image imports
    '\\.(jpg|jpeg|png|gif|webp|svg)$': '<rootDir>/__tests__/__mocks__/fileMock.js',
    // Handle path aliases (if using)
    '^@/(.*)$': '<rootDir>/$1',
  },

  // Transform TypeScript files
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
  },

  // Collect coverage
  collectCoverageFrom: [
    'components/**/*.{ts,tsx}',
    'context/**/*.{ts,tsx}',
    'hooks/**/*.{ts,tsx}',
    'pages/**/*.{ts,tsx}',
    '!**/*.d.ts',
    '!**/index.ts',
    '!**/__tests__/**',
  ],

  // Coverage thresholds
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 75,
      lines: 80,
      statements: 80,
    },
  },

  // Coverage output directory
  coverageDirectory: '../coverage/frontend',

  // Module file extensions
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],

  // Verbose output
  verbose: true,

  // Test timeout
  testTimeout: 10000,
};