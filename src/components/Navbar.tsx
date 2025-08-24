import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; // Import the useAuth hook properly
import './Dashboard.css'; // Import the CSS for styling

const Navbar: React.FC = () => {
  const { logout } = useAuth(); // Get the logout function from the context
  const navigate = useNavigate();

  const handleLogout = () => {
    logout(); // Clear user state
    navigate('/login'); // Redirect to login page
  };

  return (
    <nav className="navbar">
      <ul>
        <li><Link to="/dashboard">Dashboard</Link></li>
        <li><Link to="/employee-scheduling">Employee Scheduling</Link></li>
        <li><Link to="/people-management">People Management</Link></li>
        <li><Link to="/task-manager">Task Manager</Link></li>
        <li><Link to="/performance-monitoring">Performance Monitoring</Link></li>
        <li><Link to="/analytics">Analytics</Link></li>
        <li><Link to="/compliance">Compliance</Link></li>
        <li><button onClick={handleLogout}>Logout</button></li> {/* Logout button */}
      </ul>
    </nav>
  );
};

export default Navbar;
