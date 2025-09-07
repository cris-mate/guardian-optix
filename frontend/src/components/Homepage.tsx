import React from 'react';
import { Link } from 'react-router-dom';

const Homepage: React.FC = () => {
  return (
    <div className="public-container">

      <header className="public-header">
        <h1>Welcome to Guardian Optix</h1>
        <p>A comprehensive solution for security operations management</p>
      </header>

      <main className="public-content-card public-content-homepage">
        <p className="public-intro-text">
          Guardian Optix web-application is designed to help security companies streamline their operations,
          manage guard patrols, schedule shifts, ensure compliance and much more, all from one
          centralised dashboard.
        </p>

        <div className="public-header">
          <h2>Get Started</h2>
          <p>Please login or register to continue.</p>
        </div>

        <div className="public-button-container">
          <Link to="/login" className="public-button public-button--primary">
            Login
          </Link>
          {' '}
          <Link to="/register" className="public-button public-button--secondary">
            Create an account
          </Link>
        </div>
      </main>

      <footer className="public-footer homepage-footer">
        <p>&copy; {new Date().getFullYear()} Guardian Optix. All rights reserved.</p>
      </footer>

    </div>
  );
};

export default Homepage;
