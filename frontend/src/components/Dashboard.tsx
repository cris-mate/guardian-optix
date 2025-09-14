import React from 'react';
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const handleLogout = () => {
    logout();
  };

  return (
    <div>

      <div>
        <header>
          <h2>Welcome to your Dashboard, {user?.username || 'User'}!</h2>
          <p>This is a protected area of the application.</p>
          <p>Select a feature from the options below to get started.</p>
        </header>

      </div>
    </div>

  );
};

export default Dashboard;
