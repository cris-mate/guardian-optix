/**
 * API Configuration
 *
 * Centralised configuration for API behavior across the application.
 * Toggle USE_MOCK_DATA to switch between mock data and live API calls.
 *
 * Usage:
 *   import { USE_MOCK_DATA } from '@/config/api.config';
 *   // or for granular control:
 *   import { MOCK_CONFIG } from '@/config/api.config';
 */

// ============================================
// Master Toggle
// ============================================

/**
 * Master switch for mock data
 * - true: Use mock data (no backend required)
 * - false: Use live API calls (backend must be running)
 */
export const USE_MOCK_DATA = false;

// ============================================
// Granular Feature Toggles
// ============================================

/**
 * Per-feature mock data configuration
 * Inherits from USE_MOCK_DATA by default, but can be overridden
 * individually for testing specific features.
 *
 * Example: Test scheduling with live API while other features use mock:
 *   scheduling: false,
 *   guards: USE_MOCK_DATA, // still uses master toggle
 */
export const MOCK_CONFIG = {
  // Core features
  scheduling: USE_MOCK_DATA,
  clients: USE_MOCK_DATA,
  guards: USE_MOCK_DATA,
  incidents: USE_MOCK_DATA,
  timeClock: USE_MOCK_DATA,
  dashboard: USE_MOCK_DATA,
  reports: USE_MOCK_DATA,

  // Supporting features
  activityHub: USE_MOCK_DATA,
  compliance: USE_MOCK_DATA,
  analytics: USE_MOCK_DATA,
  notifications: USE_MOCK_DATA,

  // Specific components
  recommendedOfficers: USE_MOCK_DATA,
} as const;

// ============================================
// API Configuration
// ============================================

/**
 * API base URL configuration
 */
export const API_CONFIG = {
  baseUrl: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  timeout: 30000,
  retryAttempts: 3,
} as const;

// ============================================
// Development Helpers
// ============================================

/**
 * Simulated API delay for mock data (milliseconds)
 * Makes mock data feel more realistic
 */
export const MOCK_DELAY = {
  short: 300,
  medium: 500,
  long: 800,
} as const;

/**
 * Helper to simulate API delay in mock mode
 */
export const simulateDelay = (duration: keyof typeof MOCK_DELAY = 'medium'): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, MOCK_DELAY[duration]));
};

// ============================================
// Type Exports
// ============================================

export type MockConfigKey = keyof typeof MOCK_CONFIG;