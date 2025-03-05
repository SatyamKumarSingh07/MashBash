import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import ConductMatchPage from "./components/ConductMatchPage";
import FixturesPage from "./components/FixturesPage";
import ScorekeeperPage from "./components/ScorekeeperPage";
import MatchSummaryPage from "./components/MatchSummaryPage";
import LeaderboardPage from "./components/LeaderboardPage";
import ScoreViewerPage from "./components/ScoreViewerPage";
import LoginPage from "./components/LoginPage"; // Import LoginPage
import { fetchMatches } from "./utils/api"; // Use the updated utility
import "./App.css";

function App() {
  const [matches, setMatches] = useState([]);
  const [isAuthenticated, setIsAuthenticated] = useState(
    localStorage.getItem("isAuthenticated") === "true"
  );

  useEffect(() => {
    fetchMatches()
      .then((response) => setMatches(response.data))
      .catch((err) =>
        console.error("Failed to fetch matches:", err.message, err.response?.data)
      );
  }, []);

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

  // Handle login success (called from LoginPage)
  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
    localStorage.setItem("isAuthenticated", "true");
  };

  // Handle logout (optional, if you want to add a logout feature later)
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
          {/* Public Route: Login Page */}
          <Route
            path="/login"
            element={<LoginPage onLoginSuccess={handleLoginSuccess} />}
          />

          {/* Protected Routes: Require Authentication */}
          <Route
            path="/"
            element={
              isAuthenticated ? (
                <ConductMatchPage addMatch={addMatch} />
              ) : (
                <Navigate to="/login" replace state={{ from: { pathname: location.pathname } }} />
              )
            }
          />
          <Route
            path="/fixtures"
            element={
              isAuthenticated ? (
                <FixturesPage matches={matches} updateMatches={updateMatches} />
              ) : (
                <Navigate to="/login" replace state={{ from: { pathname: location.pathname } }} />
              )
            }
          />
          <Route
            path="/scorekeeper/:matchId"
            element={
              isAuthenticated ? (
                <ScorekeeperPage matches={matches} updateMatches={updateMatches} />
              ) : (
                <Navigate to="/login" replace state={{ from: { pathname: location.pathname } }} />
              )
            }
          />
          <Route
            path="/summary/:matchId"
            element={
              isAuthenticated ? (
                <MatchSummaryPage matches={matches} />
              ) : (
                <Navigate to="/login" replace state={{ from: { pathname: location.pathname } }} />
              )
            }
          />
          <Route
            path="/standings"
            element={
              isAuthenticated ? (
                <LeaderboardPage matches={matches} />
              ) : (
                <Navigate to="/login" replace state={{ from: { pathname: location.pathname } }} />
              )
            }
          />
          <Route
            path="/match/:matchId/scores"
            element={
              isAuthenticated ? (
                <ScoreViewerPage />
              ) : (
                <Navigate to="/login" replace state={{ from: { pathname: location.pathname } }} />
              )
            }
          />

          {/* Default Route: Redirect to Login if not authenticated */}
          <Route
            path="*"
            element={
              isAuthenticated ? (
                <Navigate to="/" replace />
              ) : (
                <Navigate to="/login" replace state={{ from: { pathname: "/" } }} />
              )
            }
          />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;