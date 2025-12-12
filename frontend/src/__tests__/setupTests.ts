/**
 * Jest Setup for Frontend Tests
 *
 * Configures testing environment, mocks, and global utilities.
 */

import '@testing-library/jest-dom';

// ============================================
// LocalStorage Mock
// ============================================

const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
    get length() {
      return Object.keys(store).length;
    },
    key: jest.fn((index: number) => {
      const keys = Object.keys(store);
      return keys[index] || null;
    }),
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// ============================================
// Session Storage Mock
// ============================================

Object.defineProperty(window, 'sessionStorage', {
  value: localStorageMock,
});

// ============================================
// Match Media Mock
// ============================================

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// ============================================
// ResizeObserver Mock
// ============================================

global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// ============================================
// IntersectionObserver Mock
// ============================================

global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// ============================================
// Geolocation Mock
// ============================================

const mockGeolocation = {
  getCurrentPosition: jest.fn().mockImplementation((success) =>
    success({
      coords: {
        latitude: 51.5074,
        longitude: -0.1278,
        accuracy: 10,
        altitude: null,
        altitudeAccuracy: null,
        heading: null,
        speed: null,
      },
      timestamp: Date.now(),
    })
  ),
  watchPosition: jest.fn(),
  clearWatch: jest.fn(),
};

Object.defineProperty(navigator, 'geolocation', {
  value: mockGeolocation,
  configurable: true,
});

// ============================================
// Fetch Mock
// ============================================

global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({}),
    text: () => Promise.resolve(''),
    blob: () => Promise.resolve(new Blob()),
  })
) as jest.Mock;

// ============================================
// Console Error Suppression
// ============================================

// Suppress specific console errors during tests
const originalError = console.error;
beforeAll(() => {
  console.error = (...args: unknown[]) => {
    // Suppress React act() warnings
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Warning: An update to')
    ) {
      return;
    }
    // Suppress Chakra UI warnings
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Chakra UI')
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});

// ============================================
// Cleanup
// ============================================

afterEach(() => {
  // Clear all mocks after each test
  jest.clearAllMocks();

  // Clear localStorage
  localStorageMock.clear();
});

// ============================================
// Global Test Utilities
// ============================================

// Utility to wait for next tick
export const waitForNextTick = () => new Promise((resolve) => setTimeout(resolve, 0));

// Utility to flush promises
export const flushPromises = () => new Promise((resolve) => setImmediate(resolve));