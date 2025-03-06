// src/components/AdminDashboard.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const AdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [activeSessions, setActiveSessions] = useState({});
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const fetchUserData = async () => {
    try {
      const response = await axios.get('https://mashbash.onrender.com/api/admin/users', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setUsers(response.data.users || []);
      setActiveSessions(response.data.activeSessions || {});
      setError(null);
    } catch (error) {
      console.error('Error fetching user data:', error);
      if (error.response?.status === 404) {
        setError('Admin endpoint not found. Please check server configuration.');
      } else if (error.response?.status === 403) {
        setError('Unauthorized access. Logging out...');
        setTimeout(() => {
          localStorage.removeItem('isAuthenticated');
          localStorage.removeItem('token');
          navigate('/login');
        }, 2000);
      } else {
        setError('Failed to fetch user data. Please try again later.');
      }
    }
  };

  useEffect(() => {
    fetchUserData();
  }, []);

  const logoutUser = async (userId) => {
    try {
      await axios.post(
        `https://mashbash.onrender.com/api/admin/logout/${userId}`,
        {},
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      fetchUserData(); // Refresh data after logout
      alert('User logged out successfully');
    } catch (error) {
      console.error('Error logging out user:', error);
      if (error.response?.status === 403) {
        setError('Unauthorized action. Logging out...');
        setTimeout(() => {
          localStorage.removeItem('isAuthenticated');
          localStorage.removeItem('token');
          navigate('/login');
        }, 2000);
      } else {
        setError('Failed to logout user. Please try again.');
      }
    }
  };

  return (
    <div className="admin-dashboard">
      <h2>User Management</h2>
      {error && <div className="error">{error}</div>}
      {users.length === 0 && !error ? (
        <p>No users have logged in yet.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>User ID</th>
              <th>Last Login</th>
              <th>Login Count</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id}>
                <td>{user.id}</td>
                <td>{new Date(user.lastLogin).toLocaleString()}</td>
                <td>{user.loginCount}</td>
                <td>{activeSessions[user.id] ? 'Active' : 'Inactive'}</td>
                <td>
                  {activeSessions[user.id] && (
                    <button onClick={() => logoutUser(user.id)}>
                      Logout
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default AdminDashboard;