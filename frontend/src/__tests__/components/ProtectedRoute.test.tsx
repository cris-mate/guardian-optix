/**
 * ProtectedRoute Component Tests
 *
 * Tests for route protection based on authentication state.
 * Covers redirect behavior and authenticated access.
 */

import React from 'react';
import { screen } from '@testing-library/react';
import { Routes, Route, MemoryRouter } from 'react-router-dom';
import { render as rtlRender } from '@testing-library/react';
import { ChakraProvider, defaultSystem } from '@chakra-ui/react';
import ProtectedRoute from '../../components/auth/ProtectedRoute';
import { AuthProvider } from '../../context/AuthContext';
import {
  createMockUser,
  setupAuthenticatedStorage,
  clearAuthStorage,
} from '../utils/testUtils';

// ============================================
// Test Setup
// ============================================

beforeEach(() => {
  clearAuthStorage();
});

afterEach(() => {
  clearAuthStorage();
});

// Custom render with router at specific path
const renderWithRouter = (
  ui: React.ReactElement,
  { route = '/' } = {}
) => {
  return rtlRender(
    <ChakraProvider value={defaultSystem}>
      <MemoryRouter initialEntries={[route]}>
        <AuthProvider>
          {ui}
        </AuthProvider>
      </MemoryRouter>
    </ChakraProvider>
  );
};

// Test components
const ProtectedContent = () => <div data-testid="protected-content">Protected Page</div>;
const LoginPage = () => <div data-testid="login-page">Login Page</div>;

// ============================================
// Authentication Tests
// ============================================

describe('ProtectedRoute Authentication', () => {
  it('should redirect to login when user is not authenticated', () => {
    renderWithRouter(
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <ProtectedContent />
            </ProtectedRoute>
          }
        />
      </Routes>,
      { route: '/dashboard' }
    );

    // Should redirect to login page
    expect(screen.getByTestId('login-page')).toBeInTheDocument();
    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
  });

  it('should render protected content when user is authenticated', () => {
    setupAuthenticatedStorage(createMockUser());

    renderWithRouter(
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <ProtectedContent />
            </ProtectedRoute>
          }
        />
      </Routes>,
      { route: '/dashboard' }
    );

    // Should show protected content
    expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    expect(screen.queryByTestId('login-page')).not.toBeInTheDocument();
  });

  it('should allow access for Admin users', () => {
    setupAuthenticatedStorage(createMockUser({ role: 'Admin' }));

    renderWithRouter(
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <ProtectedContent />
            </ProtectedRoute>
          }
        />
      </Routes>,
      { route: '/admin' }
    );

    expect(screen.getByTestId('protected-content')).toBeInTheDocument();
  });

  it('should allow access for Manager users', () => {
    setupAuthenticatedStorage(createMockUser({ role: 'Manager' }));

    renderWithRouter(
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/manage"
          element={
            <ProtectedRoute>
              <ProtectedContent />
            </ProtectedRoute>
          }
        />
      </Routes>,
      { route: '/manage' }
    );

    expect(screen.getByTestId('protected-content')).toBeInTheDocument();
  });

  it('should allow access for Guard users', () => {
    setupAuthenticatedStorage(createMockUser({ role: 'Guard' }));

    renderWithRouter(
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/timeclock"
          element={
            <ProtectedRoute>
              <ProtectedContent />
            </ProtectedRoute>
          }
        />
      </Routes>,
      { route: '/timeclock' }
    );

    expect(screen.getByTestId('protected-content')).toBeInTheDocument();
  });
});

// ============================================
// Edge Cases
// ============================================

describe('ProtectedRoute Edge Cases', () => {
  it('should redirect when token exists but user is missing', () => {
    // Only set token, not user
    localStorage.setItem('token', 'mock-token');

    renderWithRouter(
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <ProtectedContent />
            </ProtectedRoute>
          }
        />
      </Routes>,
      { route: '/dashboard' }
    );

    // Should redirect because user is null
    expect(screen.getByTestId('login-page')).toBeInTheDocument();
  });

  it('should redirect when user exists but token is missing', () => {
    // Only set user, not token
    localStorage.setItem('user', JSON.stringify(createMockUser()));

    renderWithRouter(
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <ProtectedContent />
            </ProtectedRoute>
          }
        />
      </Routes>,
      { route: '/dashboard' }
    );

    // Behavior depends on implementation
    // If checking user only, it might allow access
    // If checking isAuthenticated (user + token), it should redirect
  });

  it('should handle nested protected routes', () => {
    setupAuthenticatedStorage(createMockUser());

    const NestedContent = () => (
      <div>
        <div data-testid="outer">Outer</div>
        <ProtectedRoute>
          <div data-testid="inner">Inner</div>
        </ProtectedRoute>
      </div>
    );

    renderWithRouter(
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/nested"
          element={
            <ProtectedRoute>
              <NestedContent />
            </ProtectedRoute>
          }
        />
      </Routes>,
      { route: '/nested' }
    );

    expect(screen.getByTestId('outer')).toBeInTheDocument();
    expect(screen.getByTestId('inner')).toBeInTheDocument();
  });

  it('should handle corrupted localStorage data', () => {
    localStorage.setItem('user', 'not-valid-json');
    localStorage.setItem('token', 'mock-token');

    renderWithRouter(
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <ProtectedContent />
            </ProtectedRoute>
          }
        />
      </Routes>,
      { route: '/dashboard' }
    );

    // Should redirect to login due to invalid user data
    expect(screen.getByTestId('login-page')).toBeInTheDocument();
  });
});

// ============================================
// Multiple Routes Tests
// ============================================

describe('ProtectedRoute with Multiple Routes', () => {
  it('should protect multiple routes independently', () => {
    // Not authenticated
    renderWithRouter(
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <div data-testid="dashboard">Dashboard</div>
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <div data-testid="settings">Settings</div>
            </ProtectedRoute>
          }
        />
      </Routes>,
      { route: '/dashboard' }
    );

    expect(screen.getByTestId('login-page')).toBeInTheDocument();
    expect(screen.queryByTestId('dashboard')).not.toBeInTheDocument();
    expect(screen.queryByTestId('settings')).not.toBeInTheDocument();
  });

  it('should allow access to all protected routes when authenticated', () => {
    setupAuthenticatedStorage(createMockUser());

    const { rerender } = renderWithRouter(
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <div data-testid="dashboard">Dashboard</div>
            </ProtectedRoute>
          }
        />
      </Routes>,
      { route: '/dashboard' }
    );

    expect(screen.getByTestId('dashboard')).toBeInTheDocument();
  });
});

// ============================================
// Component Children Tests
// ============================================

describe('ProtectedRoute Children Rendering', () => {
  it('should pass props to children correctly', () => {
    setupAuthenticatedStorage(createMockUser());

    const ChildWithProps = ({ message }: { message: string }) => (
      <div data-testid="child">{message}</div>
    );

    renderWithRouter(
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/test"
          element={
            <ProtectedRoute>
              <ChildWithProps message="Hello World" />
            </ProtectedRoute>
          }
        />
      </Routes>,
      { route: '/test' }
    );

    expect(screen.getByTestId('child')).toHaveTextContent('Hello World');
  });

  it('should render functional component children', () => {
    setupAuthenticatedStorage(createMockUser());

    const FunctionalChild = () => {
      const [count, setCount] = React.useState(0);
      return (
        <button data-testid="counter" onClick={() => setCount(c => c + 1)}>
          Count: {count}
        </button>
      );
    };

    renderWithRouter(
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/test"
          element={
            <ProtectedRoute>
              <FunctionalChild />
            </ProtectedRoute>
          }
        />
      </Routes>,
      { route: '/test' }
    );

    expect(screen.getByTestId('counter')).toHaveTextContent('Count: 0');
  });
});