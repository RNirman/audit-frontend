import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Home = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('http://localhost:4000/api/login', { username, password });
      
      // 1. Save Token and Role to Browser Storage
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('role', res.data.role);
      
      // 2. Redirect based on Role
      if (res.data.role === 'SME') {
        navigate('/sme');
      } else if (res.data.role === 'AUDITOR') {
        navigate('/auditor');
      }
    } catch (err) {
      setError('Invalid Username or Password');
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '100px auto', padding: '20px', border: '1px solid #ddd', borderRadius: '8px', textAlign: 'center' }}>
      <h1>🔐 System Login</h1>
      <form onSubmit={handleLogin}>
        <div style={{ marginBottom: '15px' }}>
          <input 
            type="text" 
            placeholder="Username" 
            value={username} 
            onChange={e => setUsername(e.target.value)}
            style={{ width: '100%', padding: '10px' }}
          />
        </div>
        <div style={{ marginBottom: '15px' }}>
          <input 
            type="password" 
            placeholder="Password" 
            value={password} 
            onChange={e => setPassword(e.target.value)}
            style={{ width: '100%', padding: '10px' }}
          />
        </div>
        <button type="submit" style={{ padding: '10px 20px', background: '#2563eb', color: '#fff', border: 'none', cursor: 'pointer', width: '100%' }}>
          Login
        </button>
      </form>
      {error && <p style={{ color: 'red', marginTop: '10px' }}>{error}</p>}
      
      <div style={{ marginTop: '20px', fontSize: '12px', color: '#666' }}>
        <p>Demo Credentials:</p>
        <p>SME: <b>sme01</b> / 123</p>
        <p>Auditor: <b>auditor01</b> / 123</p>
      </div>
    </div>
  );
};

export default Home;