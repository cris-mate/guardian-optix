import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout(); // Clear user state
    navigate('/');
  };

  return (
    <nav className="navbar">

      <div className="navbar-container">
        <div className="navbar-brand">
          <svg className="navbar-logo" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/>
          </svg>
          <h2>Guardian Optix</h2>
        </div>

        <div className="navbar-user">
          {user && (
            <>
              <span className="navbar-username">Logged in as, {user.username}</span>
              <button onClick={handleLogout} className="navbar-logout-button">
                Logout
              </button>
            </>
          )}
        </div>
      </div>


    </nav>
  );
};

export default Navbar;
