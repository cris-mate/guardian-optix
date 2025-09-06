import React, { useState } from 'react';
import {Link, useNavigate} from 'react-router-dom';
import { register } from '../utils/api';
import './Register.css';

const Register: React.FC = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    role: 'Manager',
    guardType: 'Static',
  });
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const dataToSend = { ...formData};
      if (dataToSend.role !== 'Guard') {
        delete (dataToSend as any).guardType;
      }
      await register(dataToSend.username, dataToSend.email, dataToSend.password, dataToSend.role, dataToSend.guardType);
      setError('');
      setSuccessMessage('Registration successful! Redirecting to login...');
      setTimeout(() => {
        navigate('/login');
      }, 1500);
    } catch (error) {
      setError('Registration failed. Please check the details and try again.');
    }
  };

  return (
    <div className="form-container">
      <div className="form-card">
        <header className="form-header">
          <h2>Create an Account</h2>
        </header>

        {error && <p style={{ color: 'red' }}>{error}</p>}
        {successMessage && <p style={{ color: 'green' }}>{successMessage}</p>}

        <form onSubmit={handleSubmit} className="register-form">
          <div className="form-group">
            <label htmlFor="username">Username:</label>
            <input type="text" name="username" className="form-input" onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label htmlFor="email" >Email:</label>
            <input type="email" name="email" className="form-input" onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label htmlFor="password" >Password:</label>
            <input type="password" name="password" className="form-input" onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label htmlFor="role" >Choose Your Role:</label>
            <select name="role" value={formData.role} className="form-input" onChange={handleChange} required>
              <option value="Manager">Manager</option>
              <option value="Guard">Guard</option>
            </select>
          </div>

          {formData.role === 'Guard' && (
            <div className="form-group">
              <label htmlFor="guardType">Guard Type:</label>
              <select id="guardType" name="guardType" value={formData.guardType} className="form-input" onChange={handleChange} required>
                <option value="Static">Static</option>
                <option value="Dog Handler">Dog Handler</option>
                <option value="Close Protection">Close Protection</option>
                <option value="Mobile Patrol">Mobile Patrol</option>
              </select>
            </div>
          )}
          <button type="submit" className="form-button">Register Account</button>
        </form>
        <p className="form-footer">
          Already have an account?{' '}
          <Link to="/login">Sign in here</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
