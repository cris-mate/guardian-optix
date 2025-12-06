/**
 * AuthContext
 *
 * Provides authentication state and methods throughout the app.
 */

import React, { createContext, useContext, useState, ReactNode } from 'react';

// ============================================
// Types
// ============================================

/**
 * User type matching what the API returns (no password!)
 */
export interface User {
  _id: string;
  fullName: string;
  username: string;
  email: string;
  phoneNumber?: string;
  postCode?: string;
  role: 'Admin' | 'Manager' | 'Guard';
  managerType?: string;
  guardType?: string;
}


// Define the types for the AuthContext
interface AuthContextType {
  user: User | null;
  login: (userData: User) => void;
  logout: () => void;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (userData: User) => void;
  logout: () => void;
}

// ============================================
// Context
// ============================================

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ============================================
// Provider
// ============================================

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const storedUser = localStorage.getItem('user');
    try {
      return storedUser ? JSON.parse(storedUser) : null;
    } catch (error) {
      console.error('Error parsing user from local storage:', error);
      return null;
    }
  });

  const login = (userData: User) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  };

  const isAuthenticated = !!user && !!localStorage.getItem('token');

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// ============================================
// Hook
// ============================================

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};