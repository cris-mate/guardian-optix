import React, { createContext, useContext, useState, ReactNode } from 'react';

// Define blueprint for User object
interface User {
  _id: string;
  fullName: string;
  username: string;
  email: string;
  phoneNumber: string;
  postCode: string;
  password: string;
  role: 'Manager' | 'Guard';
  managerType?: string;
  guardType?: string;
}

// Define the types for the AuthContext
interface AuthContextType {
  user: User | null;
  login: (userData: User) => void;
  logout: () => void;
}

// Create the context with the initial type or undefined
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Create a provider component
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
    localStorage.setItem('user', JSON.stringify(userData)); // Save user to local storage
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user'); // Remove user from local storage
    localStorage.removeItem('token'); // Remove token from local storage
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use the AuthContext
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
