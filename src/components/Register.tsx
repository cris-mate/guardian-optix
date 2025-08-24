import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { register } from '../utils/api';

const Register: React.FC = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    role: 'guard',
    guardType: 'Static Guard',
  });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await register(formData.username, formData.email, formData.password, formData.role, formData.guardType);
      alert('Registration successful!');
      navigate('/login');
    } catch (error) {
      setError('Registration failed. Please try again.');
    }
  };

  return (
    <div>
      <h2>Register</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <form onSubmit={handleSubmit}>
        <input type="text" name="username" placeholder="Username" onChange={handleChange} required />
        <input type="email" name="email" placeholder="Email" onChange={handleChange} required />
        <input type="password" name="password" placeholder="Password" onChange={handleChange} required />
        <select name="role" onChange={handleChange} required>
          <option value="guard">Guard</option>
          <option value="manager">Manager</option>
          <option value="client">Client</option>
        </select>
        <select name="guardType" onChange={handleChange} required>
          <option value="Static Guard">Static Guard</option>
          <option value="Dog Handler Guard">Dog Handler Guard</option>
          <option value="Close Protection Guard">Close Protection Guard</option>
        </select>
        <button type="submit">Register</button>
      </form>
    </div>
  );
};

export default Register;
