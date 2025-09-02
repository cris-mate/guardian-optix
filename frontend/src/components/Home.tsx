import React from 'react';
import { useNavigate } from 'react-router-dom';

const Home: React.FC = () => {
  const navigate = useNavigate();

  const handleLogin = () => {
    navigate('/login');
  };

  const handleRegister = () => {
    navigate('/register');
  };

  return (
    <div style={{ textAlign: 'center', marginTop: '50px' }}>
      <h2>Welcome to Guardian Optix</h2>
      <p>Please log in or register to continue.</p>
      <button onClick={handleLogin} style={{ margin: '10px', padding: '10px 20px', cursor: 'pointer' }}>
        Login
      </button>
      <button onClick={handleRegister} style={{ margin: '10px', padding: '10px 20px', cursor: 'pointer' }}>
        Register
      </button>
    </div>
  );
};

export default Home;
