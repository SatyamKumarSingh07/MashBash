// src/App.jsx
import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import ConductMatchPage from "./components/ConductMatchPage";
import FixturesPage from "./components/FixturesPage";
import ScorekeeperPage from "./components/ScorekeeperPage";
import MatchSummaryPage from "./components/MatchSummaryPage";
import LeaderboardPage from "./components/LeaderboardPage";
import ScoreViewerPage from "./components/ScoreViewerPage"; // Add this import
import axios from "axios";
import "./App.css";

function App() {
  const [matches, setMatches] = useState([]);

  useEffect(() => {
    fetchMatches();
  }, []);

  const fetchMatches = async () => {
    try {
      const response = await axios.get("http://localhost:5000/api/matches");
      setMatches(response.data);
    } catch (err) {
      console.error("Failed to fetch matches:", err.message, err.response?.data);
    }
  };

  const updateMatches = (updatedMatches) => {
    setMatches(Array.isArray(updatedMatches) ? updatedMatches : matches.map((m) => (m.id === updatedMatches.id ? updatedMatches : m)));
  };

  const addMatch = (newMatch) => {
    setMatches((prevMatches) => [...prevMatches, newMatch]);
  };

  return (
    <BrowserRouter>
      <div className="App">
        <Navbar matches={matches} />
        <Routes>
          <Route path="/" element={<ConductMatchPage addMatch={addMatch} />} />
          <Route
            path="/fixtures"
            element={<FixturesPage matches={matches} updateMatches={updateMatches} />}
          />
          <Route
            path="/scorekeeper/:matchId"
            element={<ScorekeeperPage matches={matches} updateMatches={updateMatches} />}
          />
          <Route path="/summary/:matchId" element={<MatchSummaryPage matches={matches} />} />
          <Route path="/standings" element={<LeaderboardPage matches={matches} />} />
          <Route path="/match/:matchId/scores" element={<ScoreViewerPage />} /> {/* New route */}
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;