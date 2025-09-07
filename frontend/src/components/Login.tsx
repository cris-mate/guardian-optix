import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import {Link} from "react-router-dom";

const Login: React.FC = () => {
  const [formData, setFormData] = useState({ identifier: '', password: '' });
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const navigate = useNavigate();
  const { login: authLogin } = useAuth(); // Get the login function from the AuthContext

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await login(formData.identifier, formData.password); // Authenticate user
      authLogin(response.user); // Login function also stores the token
      setError('');
      setSuccessMessage('Login successful! Redirecting to dashboard...');
      setTimeout(() => {
        navigate('/dashboard'); // Redirect to dashboard after successful login
      }, 2000);
    } catch (error) {
      setError('Login failed. Please check your username or password.');
    }
  };

  return (
    <div className={"public-container"}>
      <div className="public-content-card public-content-card--auth">
        <header className="public-header">
          <h2>Login</h2>
        </header>

        {error && <p style={{ color: 'red' }}>{error}</p>}
        {successMessage && <p style={{ color: 'green' }}>{successMessage}</p>}

        <form onSubmit={handleSubmit} className="public-form">
          <div className="public-form-group">
            <label htmlFor="identifier">Username or Email:</label>
            <input
              className="public-form-input"
              type="text"
              name="identifier"
              value={formData.identifier}
              onChange={handleChange}
              required
            />
          </div>
          <div className="public-form-group">
            <label htmlFor="password">Password:</label>
            <input
              className="public-form-input"
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>
          <button type="submit" className="public-button public-button--primary single-button">Login</button>
        </form>

        <p className="public-footer">
          Don't have an account?{' '}
          <Link to="/register">
            Register here
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
