import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactElement;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user } = useAuth(); // Get the user from the AuthContext

  if (!user) {
    return <Navigate to="/login" />; // Redirect to login if the user is not authenticated
  }

  return children; // Render the protected route content if the user is authenticated
};

export default ProtectedRoute;
