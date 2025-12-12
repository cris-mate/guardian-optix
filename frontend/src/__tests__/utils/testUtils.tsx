/**
 * Frontend Test Setup
 *
 * Configures React Testing Library with Chakra UI provider.
 * Includes custom render function and test utilities.
 */

import React, { ReactElement, ReactNode } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ChakraProvider, defaultSystem } from '@chakra-ui/react';
import { AuthProvider } from '../../context/AuthContext';

// ============================================
// Test Providers Wrapper
// ============================================

interface AllProvidersProps {
  children: ReactNode;
}

/**
 * Wraps component with all necessary providers for testing
 */
const AllProviders: React.FC<AllProvidersProps> = ({ children }) => {
  return (
    <ChakraProvider value={defaultSystem}>
      <BrowserRouter>
        <AuthProvider>
          {children}
        </AuthProvider>
      </BrowserRouter>
    </ChakraProvider>
  );
};

/**
 * Wrapper without AuthProvider for testing auth components in isolation
 */
const ProvidersWithoutAuth: React.FC<AllProvidersProps> = ({ children }) => {
  return (
    <ChakraProvider value={defaultSystem}>
      <BrowserRouter>
        {children}
      </BrowserRouter>
    </ChakraProvider>
  );
};

// ============================================
// Custom Render Functions
// ============================================

/**
 * Custom render with all providers
 */
const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllProviders, ...options });

/**
 * Render without AuthProvider (for testing AuthProvider itself)
 */
const renderWithoutAuth = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: ProvidersWithoutAuth, ...options });

// ============================================
// Mock Data Factories
// ============================================

/**
 * Create mock user for testing
 */
export const createMockUser = (overrides = {}) => ({
  _id: 'test-user-id',
  fullName: 'Test User',
  username: 'testuser',
  email: 'test@guardian.com',
  phoneNumber: '07777123456',
  postCode: 'EC1A 1BB',
  role: 'Guard' as const,
  guardType: 'Static',
  ...overrides,
});

/**
 * Create mock admin user
 */
export const createMockAdmin = (overrides = {}) => ({
  ...createMockUser(),
  _id: 'admin-user-id',
  fullName: 'Admin User',
  username: 'adminuser',
  email: 'admin@guardian.com',
  role: 'Admin' as const,
  ...overrides,
});

/**
 * Create mock manager user
 */
export const createMockManager = (overrides = {}) => ({
  ...createMockUser(),
  _id: 'manager-user-id',
  fullName: 'Manager User',
  username: 'manageruser',
  email: 'manager@guardian.com',
  role: 'Manager' as const,
  managerType: 'Operations Manager',
  ...overrides,
});

/**
 * Create mock GPS location
 */
export const createMockLocation = (overrides = {}) => ({
  latitude: 51.5074,
  longitude: -0.1278,
  accuracy: 10,
  timestamp: new Date().toISOString(),
  address: '123 Test Street, London',
  ...overrides,
});

/**
 * Create mock shift
 */
export const createMockShift = (overrides = {}) => ({
  _id: 'shift-id',
  site: {
    _id: 'site-id',
    name: 'Test Site',
  },
  date: new Date().toISOString().split('T')[0],
  startTime: '09:00',
  endTime: '17:00',
  status: 'scheduled',
  ...overrides,
});

// ============================================
// Local Storage Mocks
// ============================================

/**
 * Setup localStorage mock with token and user
 */
export const setupAuthenticatedStorage = (user = createMockUser()) => {
  localStorage.setItem('token', 'mock-jwt-token');
  localStorage.setItem('user', JSON.stringify(user));
};

/**
 * Clear localStorage auth data
 */
export const clearAuthStorage = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};

// ============================================
// Navigation Mock
// ============================================

const mockNavigate = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

export { mockNavigate };

// ============================================
// API Mock Helpers
// ============================================

/**
 * Mock successful API response
 */
export const mockApiSuccess = (data: unknown) => {
  return Promise.resolve({ data });
};

/**
 * Mock API error response
 */
export const mockApiError = (message: string, status = 400) => {
  const error = new Error(message) as Error & { response?: { status: number; data: { message: string } } };
  error.response = { status, data: { message } };
  return Promise.reject(error);
};

// ============================================
// Async Helpers
// ============================================

/**
 * Wait for async operations to complete
 */
export const waitForAsync = () => new Promise(resolve => setTimeout(resolve, 0));

// ============================================
// Re-exports
// ============================================

export * from '@testing-library/react';
export { customRender as render, renderWithoutAuth };
export { default as userEvent } from '@testing-library/user-event';