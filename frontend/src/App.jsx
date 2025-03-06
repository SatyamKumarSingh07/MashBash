import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import ConductMatchPage from "./components/ConductMatchPage";
import FixturesPage from "./components/FixturesPage";
import ScorekeeperPage from "./components/ScorekeeperPage";
import MatchSummaryPage from "./components/MatchSummaryPage";
import LeaderboardPage from "./components/LeaderboardPage";
import ScoreViewerPage from "./components/ScoreViewerPage";
import LoginPage from "./components/LoginPage";
import AdminDashboard from "./components/AdminDashboard";
import { fetchMatches } from "./utils/api";
import "./App.css";

function App() {
  const [matches, setMatches] = useState([]);
  const [isAuthenticated, setIsAuthenticated] = useState(
    localStorage.getItem("isAuthenticated") === "true"
  );

  useEffect(() => {
    if (isAuthenticated) {
      fetchMatches()
        .then((response) => {
          if (response.data && Array.isArray(response.data)) {
            setMatches(response.data);
          }
        })
        .catch((err) => {
          console.error("Failed to fetch matches:", err.response?.data || err.message);
          if (err.response?.status === 403) {
            handleLogout();
          }
        });
    }
  }, [isAuthenticated]);

  const updateMatches = (updatedMatches) => {
    setMatches(
      Array.isArray(updatedMatches)
        ? updatedMatches
        : matches.map((m) => (m.id === updatedMatches.id ? updatedMatches : m))
    );
  };

  const addMatch = (newMatch) => {
    setMatches((prevMatches) => [...prevMatches, newMatch]);
  };

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
    localStorage.setItem("isAuthenticated", "true");
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem("isAuthenticated");
    localStorage.removeItem("token");
  };

  const ProtectedRoute = ({ children }) => {
    const [isValid, setIsValid] = useState(null);

    useEffect(() => {
      const verifyToken = async () => {
        try {
          await fetchMatches();
          setIsValid(true);
        } catch (error) {
          setIsValid(false);
          handleLogout();
        }
      };
      if (isAuthenticated) {
        verifyToken();
      } else {
        setIsValid(false);
      }
    }, []);

    if (isValid === null) return <div>Loading...</div>;
    return isValid ? children : <Navigate to="/login" replace />;
  };

  return (
    <BrowserRouter>
      <Routes>
        {/* Public Route */}
        <Route path="/view-score/:matchId" element={<ScoreViewerPage />} />

        {/* Authenticated Routes */}
        <Route
          path="/*"
          element={
            <div className="App">
              {isAuthenticated && <Navbar matches={matches} onLogout={handleLogout} />}
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
                  path="/admin"
                  element={
                    <ProtectedRoute>
                      <AdminDashboard />
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