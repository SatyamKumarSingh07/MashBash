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

  return (
    <BrowserRouter>
      <div className="App">
        {isAuthenticated && <Navbar matches={matches} />}
        <Routes>
          <Route
            path="/login"
            element={<LoginPage onLoginSuccess={handleLoginSuccess} />}
          />
          <Route
            path="/"
            element={
              isAuthenticated ? (
                <ConductMatchPage addMatch={addMatch} />
              ) : (
                <Navigate to="/login" replace state={{ from: "/" }} />
              )
            }
          />
          <Route
            path="/fixtures"
            element={
              isAuthenticated ? (
                <FixturesPage matches={matches} updateMatches={updateMatches} />
              ) : (
                <Navigate to="/login" replace state={{ from: "/fixtures" }} />
              )
            }
          />
          <Route
            path="/scorekeeper/:matchId"
            element={
              isAuthenticated ? (
                <ScorekeeperPage matches={matches} updateMatches={updateMatches} />
              ) : (
                <Navigate to="/login" replace state={{ from: "/scorekeeper/:matchId" }} />
              )
            }
          />
          <Route
            path="/summary/:matchId"
            element={
              isAuthenticated ? (
                <MatchSummaryPage matches={matches} />
              ) : (
                <Navigate to="/login" replace state={{ from: "/summary/:matchId" }} />
              )
            }
          />
          <Route
            path="/standings"
            element={
              isAuthenticated ? (
                <LeaderboardPage matches={matches} />
              ) : (
                <Navigate to="/login" replace state={{ from: "/standings" }} />
              )
            }
          />
          {/* Public route for audience */}
          <Route path="/view-score/:matchId" element={<ScoreViewerPage />} />
          {/* Existing authenticated route for ScoreViewer (optional) */}
          <Route
            path="/match/:matchId/scores"
            element={
              isAuthenticated ? (
                <ScoreViewerPage />
              ) : (
                <Navigate to="/login" replace state={{ from: "/match/:matchId/scores" }} />
              )
            }
          />
          <Route
            path="*"
            element={
              isAuthenticated ? (
                <Navigate to="/" replace />
              ) : (
                <Navigate to="/login" replace state={{ from: "/" }} />
              )
            }
          />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;