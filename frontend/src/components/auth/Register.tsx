import React, { useState } from 'react';
import {Link, useNavigate} from 'react-router-dom';
import { register } from '../../utils/api';
import axios from "axios";
import '../PublicPages.css';

const Register: React.FC = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    username: '',
    email: '',
    phoneNumber: '',
    postCode: '',
    password: '',
    role: 'Manager',
    managerType: 'Operations Manager',
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
      if (dataToSend.role === 'Manager') {
        delete (dataToSend as any).guardType;
      } else if (dataToSend.role === 'Guard') {
        delete (dataToSend as any).managerType;
      }
      await register(
        dataToSend.fullName,
        dataToSend.username,
        dataToSend.email,
        dataToSend.phoneNumber,
        dataToSend.postCode,
        dataToSend.password,
        dataToSend.role,
        dataToSend.managerType,
        dataToSend.guardType
      );

      setError('');
      setSuccessMessage('Registration successful! Redirecting to login...');
      setTimeout(() => {
        navigate('/login');
      }, 1500);
    } catch (error) {
      // Checks if the error is a network response from our server
      if (axios.isAxiosError(error) && error.response) {
        // Displays the specific error sent by the backend
        setError(error.response.data.message);
      } else {
        // Otherwise, send  generic error message
        setError('An unexpected error occurred. Please check the details and try again.');
      }
    }
  };

  return (
    <div className="public-container">
      <div className="public-content-card public-content-card--auth">
        <header className="public-header">
          <h2>Create an Account</h2>
        </header>

        {error && <p style={{ color: 'red', marginBottom: "1.25rem"}}>{error}</p>}
        {successMessage && <p style={{ color: 'green', marginBottom: "1.25rem" }}>{successMessage}</p>}

        <form onSubmit={handleSubmit} className="public-form">
          <div className="public-form-group">
            <label htmlFor="fullName">Full Name:</label>
            <input type="text" name="fullName" className="public-form-input" onChange={handleChange} required />
          </div>
          <div className="public-form-group">
            <label htmlFor="username">Username:</label>
            <input type="text" name="username" className="public-form-input" onChange={handleChange} required />
          </div>
          <div className="public-form-group">
            <label htmlFor="email" >Email:</label>
            <input type="email" name="email" className="public-form-input" onChange={handleChange} required />
          </div>
          <div className="public-form-group">
            <label htmlFor="phoneNumber">Phone Number:</label>
            <input type="text" name="phoneNumber" className="public-form-input" onChange={handleChange} required />
          </div>
          <div className="public-form-group">
            <label htmlFor="postCode">Post Code:</label>
            <input type="text" name="postCode" className="public-form-input" onChange={handleChange} required />
          </div>
          <div className="public-form-group">
            <label htmlFor="password" >Password:</label>
            <input type="password" name="password" className="public-form-input" onChange={handleChange} required />
          </div>
          <div className="public-form-group">
            <label htmlFor="role" >Choose Your Role:</label>
            <select name="role" value={formData.role} className="public-form-input" onChange={handleChange} required>
              <option value="Manager">Manager</option>
              <option value="Guard">Guard</option>
            </select>
          </div>

          {formData.role === 'Manager' && (
            <div className="public-form-group">
              <label htmlFor="managerType">Manager Type:</label>
              <select id="managerType" name="managerType" value={formData.managerType} className="public-form-input" onChange={handleChange} required>
                <option value="Operations Manager">Operations Manager</option>
                <option value="Account Manager">Account Manager</option>
                <option value="Business Support Manager">Business Support Manager</option>
              </select>
            </div>
          )}

          {formData.role === 'Guard' && (
            <div className="public-form-group">
              <label htmlFor="guardType">Guard Type:</label>
              <select id="guardType" name="guardType" value={formData.guardType} className="public-form-input" onChange={handleChange} required>
                <option value="Static">Static</option>
                <option value="Dog Handler">Dog Handler</option>
                <option value="Close Protection">Close Protection</option>
                <option value="Mobile Patrol">Mobile Patrol</option>
              </select>
            </div>
          )}
          <button type="submit" className="public-button public-button--primary single-button">Register Account</button>
        </form>
        <footer className="public-footer">
          Already have an account?{' '}
          <Link to="/login">
            Sign in here
          </Link>
        </footer>
      </div>
    </div>
  );
};

export default Register;
