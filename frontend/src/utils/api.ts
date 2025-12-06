/**
 * API Utility
 *
 * Axios instance with authentication interceptor.
 * All API calls should use this instance to automatically include JWT token.
 */

import axios from 'axios';

// ============================================
// Configuration
// ============================================

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// ============================================
// Axios Instance
// ============================================

export const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ============================================
// Request Interceptor - Attach JWT Token
// ============================================

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// ============================================
// Response Interceptor - Handle Auth Errors
// ============================================

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle 401 Unauthorized - token expired or invalid
    if (error.response?.status === 401) {
      // Clear invalid token
      localStorage.removeItem('token');
      localStorage.removeItem('user');

      // Redirect to login (only if not already on auth pages)
      const currentPath = window.location.pathname;
      if (!currentPath.includes('/login') && !currentPath.includes('/register')) {
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

// ============================================
// Authentication Functions
// ============================================

export interface LoginUserResponse {
  _id: string;
  fullName: string;
  username: string;
  email: string;
  phoneNumber?: string;
  postCode?: string;
  role: 'Admin' | 'Manager' | 'Guard';
  guardType?: string;
  managerType?: string;
}

export interface LoginResponse {
  token: string;
  user: LoginUserResponse;
}

export interface RegisterPayload {
  fullName: string;
  username: string;
  email: string;
  phoneNumber: string;
  postCode: string;
  password: string;
  role: string;
  managerType?: string;
  guardType?: string;
}

/**
 * Login user and store token
 */
export const login = async (identifier: string, password: string): Promise<LoginResponse> => {
  try {
    const response = await axios.post<LoginResponse>(`${API_URL}/auth/login`, {
      identifier,
      password
    });

    // Store token and user data on successful login
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }

    return response.data;
  } catch (error) {
    console.error('Login request failed:', error);
    throw error;
  }
};

export interface RegisterResponse {
  message: string;
}

/**
 * Register new user
 * Note: Backend returns only a message, not a token.
 * User must login separately after registration.
 */
export const register = async (payload: RegisterPayload): Promise<RegisterResponse> => {
  try {
    const response = await axios.post<RegisterResponse>(`${API_URL}/auth/register`, payload);
    return response.data;
  } catch (error) {
    console.error('Registration request failed:', error);
    throw error;
  }
};

/**
 * Logout user and clear stored data
 */
export const logout = (): void => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = '/login';
};

/**
 * Get current user from storage
 */
export const getCurrentUser = () => {
  const userStr = localStorage.getItem('user');
  if (userStr) {
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  }
  return null;
};

/**
 * Check if user is authenticated
 */
export const isAuthenticated = (): boolean => {
  return !!localStorage.getItem('token');
};