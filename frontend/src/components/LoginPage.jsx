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
      console.log("Attempting login with:", { id, password });
      const response = await axios.post(`${BASE_URL}/api/login`, { id, password });
      console.log("Login response:", response.data);

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
      console.error("Login error:", errorDetails);
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
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-100 to-pink-100 flex items-center justify-center py-6 px-4 sm:px-6 lg:px-8">
      <ToastContainer />
      <div className="w-full max-w-md bg-white/90 backdrop-blur-md rounded-xl shadow-xl p-6 sm:p-8 animate-fade-in">
        <h2 className="text-3xl sm:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 tracking-tight text-center mb-6">
          Login to Badminton App
        </h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label
              htmlFor="id"
              className="block text-sm font-medium text-gray-700"
            >
              Unique ID
            </label>
            <input
              type="text"
              id="id"
              value={id}
              onChange={(e) => setId(e.target.value)}
              required
              className={`w-full px-4 py-2 border border-indigo-200 rounded-lg bg-indigo-50 text-indigo-800 placeholder-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-all duration-200 ${
                isLoading ? "opacity-50 cursor-not-allowed" : ""
              }`}
              placeholder="Enter your Unique ID"
              disabled={isLoading}
            />
          </div>
          <div className="space-y-2">
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700"
            >
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className={`w-full px-4 py-2 border border-indigo-200 rounded-lg bg-indigo-50 text-indigo-800 placeholder-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-all duration-200 ${
                isLoading ? "opacity-50 cursor-not-allowed" : ""
              }`}
              placeholder="Enter your Password"
              disabled={isLoading}
            />
          </div>
          {error && (
            <p className="text-red-600 text-sm bg-red-100/90 backdrop-blur-sm p-3 rounded-lg shadow-inner animate-slide-in">
              {error}
            </p>
          )}
          <button
            type="submit"
            className={`w-full px-4 py-2 rounded-lg text-white font-semibold transition-all duration-300 shadow-md ${
              isLoading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
            }`}
            disabled={isLoading}
          >
            {isLoading ? "Logging in..." : "Login"}
          </button>
        </form>
      </div>

      {/* Global Styles for Animations */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideIn {
          from { transform: translateY(-20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .animate-fade-in {
          animation: fadeIn 0.6s ease-out;
        }
        .animate-slide-in {
          animation: slideIn 0.5s ease-out;
        }
      `}</style>
    </div>
  );
};

export default LoginPage;