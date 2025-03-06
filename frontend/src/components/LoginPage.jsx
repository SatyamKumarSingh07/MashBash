// src/components/LoginPage.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const BASE_URL = "https://mashbash.onrender.com"; // Your Render URL

const LoginPage = ({ onLoginSuccess }) => {
  const [id, setId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    setError("");
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      console.log("Attempting login with:", { id, password }); // Debug credentials
      const response = await axios.post(`${BASE_URL}/api/login`, { id, password });
      console.log("Login response:", response.data); // Debug response

      if (response.data.success) {
        localStorage.setItem("isAuthenticated", "true");
        localStorage.setItem("token", response.data.token);
        toast.success("Login successful!", {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
        if (onLoginSuccess) onLoginSuccess();
        const from = location.state?.from?.pathname || "/fixtures";
        setTimeout(() => navigate(from, { replace: true }), 1000);
      } else {
        setError(response.data.message || "Invalid ID or Password");
        toast.error(response.data.message || "Invalid ID or Password", {
          position: "top-right",
          autoClose: 3000,
        });
      }
    } catch (error) {
      const errorDetails = {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
      };
      console.error("Login error:", errorDetails); // Detailed error logging
      if (error.response) {
        setError(error.response.data.message || "Login failed. Please try again.");
        toast.error(error.response.data.message || "Login failed.", {
          position: "top-right",
          autoClose: 3000,
        });
      } else if (error.request) {
        setError("Network error. Check your connection or server status.");
        toast.error("Network error. Please try again later.", {
          position: "top-right",
          autoClose: 3000,
        });
      } else {
        setError("An unexpected error occurred.");
        toast.error("An unexpected error occurred.", {
          position: "top-right",
          autoClose: 3000,
        });
      }
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
              className={`input-field ${isLoading ? "loading" : ""}`}
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
              className={`input-field ${isLoading ? "loading" : ""}`}
              placeholder="Enter your Password"
              disabled={isLoading}
            />
          </div>
          {error && <p className="error">{error}</p>}
          <button
            type="submit"
            className={`login-button ${isLoading ? "loading" : ""}`}
            disabled={isLoading}
          >
            {isLoading ? "Logging in..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;