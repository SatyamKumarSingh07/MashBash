import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const LoginPage = ({ onLoginSuccess }) => { // Accept onLoginSuccess prop
  const [id, setId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Clear any existing error on mount
    setError('');
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await axios.post('https://mashbash-backend.onrender.com/api/login', {
        id,
        password,
      });

      if (response.data.success) {
        // Store authentication status and token
        localStorage.setItem('isAuthenticated', 'true');
        localStorage.setItem('token', response.data.token);
        toast.success('Login successful!', {
          position: 'top-right',
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
        // Call onLoginSuccess to update App.jsx state
        if (onLoginSuccess) onLoginSuccess();
        // Redirect to the intended page (e.g., fixtures or scorekeeper)
        const from = location.state?.from?.pathname || '/fixtures';
        setTimeout(() => navigate(from, { replace: true }), 1000); // Delay for animation
      } else {
        setError(response.data.message || 'Invalid ID or Password');
        toast.error(response.data.message || 'Invalid ID or Password', {
          position: 'top-right',
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
      }
    } catch (error) {
      setError('Login failed. Please try again.');
      toast.error('Login failed. Please try again.', {
        position: 'top-right',
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
      console.error('Login error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <ToastContainer />
      <div className="login-card">
        <h2 className="login-title">Login to Badminton App</h2>
        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="id">Unique ID:</label>
            <input
              type="text"
              id="id"
              value={id}
              onChange={(e) => setId(e.target.value)}
              required
              className={`input-field ${isLoading ? 'loading' : ''}`}
              placeholder="Enter your Unique ID"
              disabled={isLoading}
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password:</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className={`input-field ${isLoading ? 'loading' : ''}`}
              placeholder="Enter your Password"
              disabled={isLoading}
            />
          </div>
          {error && <p className="error">{error}</p>}
          <button
            type="submit"
            className={`login-button ${isLoading ? 'loading' : ''}`}
            disabled={isLoading}
          >
            {isLoading ? 'Logging in...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;