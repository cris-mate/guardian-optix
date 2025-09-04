import React from 'react';
import { Link } from 'react-router-dom';
import './Homepage.css';

const Homepage: React.FC = () => {
  return (
    <div className="homepage-container">
      <header className="homepage-header">
        <h1>Welcome to Guardian Optix,</h1>
        <p>Your all-in-one solution for modern security operations management.</p>
      </header>

      <main className="homepage-main">
        <section className="homepage-section">
          <h2>About the App</h2>
          <p>
            Guardian Optix is designed to help security companies streamline their operations,
            manage guard patrols, schedule tasks, ensure compliance and much more, all from one
            centralised dashboard.
          </p>
        </section>

        <section className="homepage-section">
          <h2>Get Started</h2>
          <p>Please login or register to continue.</p>
          <div className="homepage-actions">
            <Link to="/login" className="homepage-button primary">
              Login
            </Link>
            {' '}
            <Link to="/register" className="homepage-button secondary">
              Create an account
            </Link>
          </div>
        </section>
      </main>

      <footer className="homepage-footer">
        <p>&copy; {new Date().getFullYear()} Guardian Optix. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default Homepage;
