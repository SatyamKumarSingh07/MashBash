// src/App.jsx
import React, { useState, useEffect, useCallback } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import ConductMatchPage from "./components/ConductMatchPage";
import FixturesPage from "./components/FixturesPage";
import ScorekeeperPage from "./components/ScorekeeperPage";
import MatchSummaryPage from "./components/MatchSummaryPage";
import LeaderboardPage from "./components/LeaderboardPage";
import PublicScoreViewPage from "./components/PublicScoreViewPage";
import LoginPage from "./components/LoginPage";
import { fetchMatches } from "./utils/api";
import "./App.css";

function App() {
  const [matches, setMatches] = useState([]);
  const [isAuthenticated, setIsAuthenticated] = useState(
    localStorage.getItem("isAuthenticated") === "true"
  );
  const [fetchError, setFetchError] = useState(null);

  // Memoize fetchMatchesData to avoid redefinition on every render
  const fetchMatchesData = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setFetchError("No authentication token found. Please log in again.");
        handleLogout();
        return;
      }
      console.log("Fetching matches with token:", token);
      const response = await fetchMatches();
      console.log("Fetch matches response:", response.data);
      if (response.data && Array.isArray(response.data)) {
        setMatches(response.data);
        setFetchError(null);
      } else {
        setFetchError("Invalid response format from server");
      }
    } catch (err) {
      console.error("Failed to fetch matches:", err.response?.data || err.message);
      setFetchError(`Failed to fetch matches: ${err.response?.data?.message || err.message}`);
      if (err.response?.status === 403 || err.response?.status === 401) {
        console.log("Authentication failed, logging out...");
        handleLogout();
      }
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchMatchesData();
  }, [fetchMatchesData]);

  const updateMatches = useCallback((updatedMatches) => {
    setMatches((prevMatches) =>
      Array.isArray(updatedMatches)
        ? updatedMatches
        : prevMatches.map((m) => (m.id === updatedMatches.id ? updatedMatches : m))
    );
  }, []);

  const addMatch = useCallback((newMatch) => {
    setMatches((prevMatches) => [...prevMatches, newMatch]);
  }, []);

  const handleLoginSuccess = useCallback(() => {
    setIsAuthenticated(true);
    localStorage.setItem("isAuthenticated", "true");
    setFetchError(null);
  }, []);

  const handleLogout = useCallback(() => {
    setIsAuthenticated(false);
    setMatches([]);
    setFetchError(null);
    localStorage.removeItem("isAuthenticated");
    localStorage.removeItem("token");
  }, []);

  const ProtectedRoute = ({ children }) => {
    const [isValid, setIsValid] = useState(null);

    // Memoize verifyToken to prevent redefinition
    const verifyToken = useCallback(async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("No token found");
        console.log("Verifying token:", token);
        await fetchMatches();
        setIsValid(true);
      } catch (error) {
        console.error("Token verification failed:", {
          message: error.message,
          status: error.response?.status,
          data: error.response?.data,
        });
        setIsValid(false);
      }
    }, []);

    useEffect(() => {
      let isMounted = true;

      if (isAuthenticated) {
        verifyToken().then(() => {
          if (!isMounted) return;
        });
      } else {
        if (isMounted) setIsValid(false);
      }

      return () => {
        isMounted = false;
      };
    }, [isAuthenticated, verifyToken]); // Dependencies are stable

    if (isValid === null) return <div>Verifying authentication...</div>;
    return isValid ? children : <Navigate to="/login" replace />;
  };

  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/public-scores" element={<PublicScoreViewPage />} />

        {/* Authenticated Routes */}
        <Route
          path="/*"
          element={
            <div className="App">
              {isAuthenticated && <Navbar matches={matches} onLogout={handleLogout} />}
              {fetchError && <div className="error-message">{fetchError}</div>}
              <Routes>
                <Route
                  path="/login"
                  element={<LoginPage onLoginSuccess={handleLoginSuccess} />}
                />
                <Route
                  path="/"
                  element={
                    <ProtectedRoute>
                      <ConductMatchPage addMatch={addMatch} />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/fixtures"
                  element={
                    <ProtectedRoute>
                      <FixturesPage matches={matches} updateMatches={updateMatches} />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/scorekeeper/:matchId"
                  element={
                    <ProtectedRoute>
                      <ScorekeeperPage matches={matches} updateMatches={updateMatches} />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/summary/:matchId"
                  element={
                    <ProtectedRoute>
                      <MatchSummaryPage matches={matches} />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/standings"
                  element={
                    <ProtectedRoute>
                      <LeaderboardPage matches={matches} />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="*"
                  element={<Navigate to={isAuthenticated ? "/" : "/login"} replace />}
                />
              </Routes>
            </div>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;