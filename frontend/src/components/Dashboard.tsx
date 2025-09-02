import React from 'react';
import Navbar from './Navbar';
import './Dashboard.css'; // Import the new CSS styles

const Dashboard: React.FC = () => {
  return (
    <div className="dashboard-container">
      <Navbar />
      <div className="dashboard-header">
        <h2>Welcome to the Guardian Optix Dashboard</h2>
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
          <button onClick={() => alert('Logout feature coming soon!')}>Logout</button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
