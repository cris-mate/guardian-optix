import React from 'react';
import Navbar from './Navbar';
import './Dashboard.css';
import {useAuth} from "../context/AuthContext";
import {useNavigate} from "react-router-dom"; // Import the new CSS styles

const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="dashboard-container">
      <Navbar />
      <div className="dashboard-header">
        <h2>Welcome to your Dashboard, {user?.username || 'User'}!</h2>
        <p>This is a protected area of the application.</p>
        <p>Select a feature from the options below to get started.</p>
      </div>
      <div className="feature-links">
        <div className="feature-card">
          <a href="/employee-scheduling">Employee Scheduling</a>
        </div>
        <div className="feature-card">
          <a href="/people-management">People Management</a>
        </div>
        <div className="feature-card">
          <a href="/task-manager">Task Manager</a>
        </div>
        <div className="feature-card">
          <a href="/performance-monitoring">Performance Monitoring</a>
        </div>
        <div className="feature-card">
          <a href="/analytics">Analytics</a>
        </div>
        <div className="feature-card">
          <a href="/compliance">Compliance</a>
        </div>
        <div className="feature-card">
          <button onClick={handleLogout}>Logout</button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
