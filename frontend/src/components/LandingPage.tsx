import React from 'react';
import { Link } from 'react-router-dom';

const LandingPage: React.FC = () => {
  return (
    <div>
      <header>
        <h1>Welcome to Guardian Optix,</h1>
        <p>Your all-in-one solution for modern security operations management.</p>
      </header>

      <main>
        <section>
          <h2>About the App</h2>
          <p>
            Guardian Optix is designed to help security companies streamline their operations,
            manage guard patrols, schedule tasks, ensure compliance and much more, all from one
            centralised dashboard.
          </p>
        </section>

        <section>
          <h2>Get Started</h2>
          <p>
            <Link to="/login">
              <button>Login</button>
            </Link>
            {' or '}
            <Link to="/register">
              <button>Create an account</button>
            </Link>
          </p>
        </section>
      </main>
    </div>
  );
};

export default LandingPage;
