import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const FixturesPage = ({ matches, updateMatches }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isInitialFetchDone, setIsInitialFetchDone] = useState(false);
  const [tossResult, setTossResult] = useState(null); // State to track toss result
  const [serveChoice, setServeChoice] = useState(null); // State to track serve choice

  useEffect(() => {
    const fetchMatches = async () => {
      try {
        setLoading(true);
        const response = await axios.get("http://localhost:5000/api/matches");
        if (response.data && Array.isArray(response.data)) {
          console.log("Initial fetch - Fetched matches:", response.data);
          updateMatches(response.data);
        }
      } catch (err) {
        console.error("Failed to fetch matches:", err);
        setError("Failed to load matches. Please try again.");
      } finally {
        setLoading(false);
        setIsInitialFetchDone(true);
      }
    };

    if (!isInitialFetchDone && (!matches || matches.length === 0)) {
      fetchMatches();
    }
  }, [updateMatches, isInitialFetchDone, matches]);

  const deleteMatch = useCallback(
    async (matchId) => {
      if (!window.confirm(`Are you sure you want to delete match ${matchId}?`)) return;

      try {
        setActionLoading(true);
        setError(null);
        console.log(`Sending DELETE request for match ID: ${matchId}`);
        const response = await axios.delete(`http://localhost:5000/api/matches/${matchId}`);
        console.log("DELETE response:", response.data);

        const updatedMatches = matches.filter((m) => m.id !== matchId);
        updateMatches(updatedMatches);
        console.log(`Match ${matchId} removed from frontend state`);
      } catch (err) {
        console.error("Failed to delete match:", err);
        if (err.response?.status === 404) {
          console.warn(`Match ${matchId} not found on backend, syncing frontend`);
          const updatedMatches = matches.filter((m) => m.id !== matchId);
          updateMatches(updatedMatches);
        } else {
          setError("Failed to delete match: " + (err.response?.data?.error || err.message));
        }
      } finally {
        setActionLoading(false);
      }
    },
    [matches, updateMatches]
  );

  const handleStartMatch = useCallback(
    (matchId) => navigate(`/scorekeeper/${matchId}`),
    [navigate]
  );

  const handleExport = useCallback(() => {
    window.location.href = "http://localhost:5000/api/export";
  }, []);

  const viewMatchSummary = useCallback(
    (matchId) => navigate(`/summary/${matchId}`),
    [navigate]
  );

  // Calculate winner and set points for a match
  const getMatchResult = (match) => {
    if (match.status !== "completed" || !match.completedSets || match.completedSets.length === 0) {
      return { winner: "N/A", setPoints: "N/A" };
    }

    const winsA = match.completedSets.reduce(
      (count, set) =>
        count +
        (match.matchType.toLowerCase() === "singles"
          ? set.winner === match.playerA
          : set.winner === "Team A"
        ) ? 1 : 0,
      0
    );
    const winsB = match.completedSets.reduce(
      (count, set) =>
        count +
        (match.matchType.toLowerCase() === "singles"
          ? set.winner === match.playerB
          : set.winner === "Team B"
        ) ? 1 : 0,
      0
    );
    const winner = winsA > winsB 
      ? (match.matchType.toLowerCase() === "singles" ? match.playerA : "Team A") 
      : (match.matchType.toLowerCase() === "singles" ? match.playerB : "Team B");
    const setPoints = match.completedSets.map(set => `${set.scoreA}-${set.scoreB}`).join(", ");

    return { winner, setPoints };
  };

  const pendingMatches = useMemo(
    () => matches.filter((match) => match.status === "pending"),
    [matches]
  );
  const ongoingMatches = useMemo(
    () => matches.filter((match) => match.status === "ongoing"),
    [matches]
  );
  const completedMatches = useMemo(
    () => matches.filter((match) => match.status === "completed"),
    [matches]
  );

  if (loading && !isInitialFetchDone) {
    return <div className="loading">Loading matches...</div>;
  }

  const renderPlayers = (match) => {
    if (match.matchType.toLowerCase() === "singles") {
      return (
        <>
          <span className="player-name">{match.playerA}</span> vs <span className="player-name">{match.playerB}</span>
        </>
      );
    } else if (match.matchType.toLowerCase() === "mixed") {
      return (
        <>
          <span className="player-name">{match.teamA.player1} / {match.teamA.player2}</span> vs{" "}
          <span className="player-name">{match.teamB.player1} / {match.teamB.player2}</span>
        </>
      );
    }
    return null;
  };

  // Function to handle toss for a match
  const handleToss = async (matchId) => {
    setActionLoading(true);
    setError(null);
    try {
      // Simulate a delay for the toss (e.g., 2 seconds)
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Randomly decide toss winner (Team A or Team B)
      const tossWinner = Math.random() < 0.5 ? "Team A" : "Team B";
      setTossResult(tossWinner);

      // Update match data in backend with toss result
      const matchToUpdate = matches.find(m => m.id === matchId);
      const updatedMatch = { ...matchToUpdate, tossWinner };
      await axios.put(`http://localhost:5000/api/matches/${matchId}`, updatedMatch);
      updateMatches(matches.map(m => m.id === matchId ? updatedMatch : m));
    } catch (err) {
      console.error("Failed to perform toss:", err);
      setError("Failed to perform toss. Please try again.");
    } finally {
      setActionLoading(false);
    }
  };

  // Function to handle serve choice after toss
  const handleServeChoice = async (matchId, choice) => {
    setActionLoading(true);
    setError(null);
    try {
      const matchToUpdate = matches.find(m => m.id === matchId);
      const servingTeam = tossResult === "Team A" ? "Team A" : "Team B";
      if (choice === "Receive") {
        // If the toss winner chooses to receive, the opponent serves
        servingTeam = tossResult === "Team A" ? "Team B" : "Team A";
      }
      const updatedMatch = { ...matchToUpdate, servingTeam, tossWinner: tossResult };
      await axios.put(`http://localhost:5000/api/matches/${matchId}`, updatedMatch);
      updateMatches(matches.map(m => m.id === matchId ? updatedMatch : m));
      setServeChoice(choice);
      setTossResult(null); // Reset toss result after choice
    } catch (err) {
      console.error("Failed to set serve choice:", err);
      setError("Failed to set serve choice. Please try again.");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="fixtures-container">
      <div className="fixtures-header">
        <h2>Fixtures</h2>
        <button className="export-btn" onClick={handleExport}>
          Export to Excel
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}
      {actionLoading && <div className="loading">Processing...</div>}

      {/* Pending Matches Section */}
      <div className="fixtures-section">
        <h3>Pending Matches</h3>
        {pendingMatches.length === 0 ? (
          <p className="no-matches">No pending matches scheduled.</p>
        ) : (
          <div className="matches-grid">
            {pendingMatches.map((match) => (
              <div key={match.id} className="match-card">
                <div className="match-info">
                  <h2 className="match-title">{renderPlayers(match)}</h2> {/* Add player names/teams at the top */}
                  <p className="details">Match Type: {match.matchType}</p>
                  <p className="details">Sets: {match.totalSets}</p>
                  <p className="details">Venue: {match.venue}</p>
                  <p className="details">Date: {new Date(match.date).toLocaleDateString()}</p>
                  <p className={`status ${match.status.toLowerCase()}`}>
                    Status: {match.status}
                  </p>
                </div>
                <div className="card-actions">
                  <button
                    className="start-btn"
                    onClick={() => handleStartMatch(match.id)}
                    disabled={actionLoading || !match.servingTeam} // Disable until toss and serve are set
                  >
                    Start Match
                  </button>
                  <button
                    className="delete-btn"
                    onClick={() => deleteMatch(match.id)}
                    disabled={actionLoading}
                  >
                    Delete
                  </button>
                  {!match.tossWinner && (
                    <button
                      className="toss-btn"
                      onClick={() => handleToss(match.id)}
                      disabled={actionLoading}
                    >
                      Toss
                    </button>
                  )}
                  {tossResult && !match.servingTeam && (
                    <div className="toss-result">
                      <p>Toss Winner: {tossResult === "Team A" ? (match.matchType.toLowerCase() === "singles" ? match.playerA : `${match.teamA.player1}/${match.teamA.player2}`) : (match.matchType.toLowerCase() === "singles" ? match.playerB : `${match.teamB.player1}/${match.teamB.player2}`)}</p>
                      <button
                        className="serve-btn"
                        onClick={() => handleServeChoice(match.id, "Serve")}
                        disabled={actionLoading}
                      >
                        Serve
                      </button>
                      <button
                        className="receive-btn"
                        onClick={() => handleServeChoice(match.id, "Receive")}
                        disabled={actionLoading}
                      >
                        Receive
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Ongoing Matches Section */}
      <div className="fixtures-section">
        <h3>Matches In Progress</h3>
        {ongoingMatches.length === 0 ? (
          <p className="no-matches">No matches in progress.</p>
        ) : (
          <div className="matches-grid">
            {ongoingMatches.map((match) => (
              <div key={match.id} className="match-card ongoing">
                <div className="match-info">
                  <h2 className="match-title">{renderPlayers(match)}</h2> {/* Add player names/teams at the top */}
                  <p className="details">Match Type: {match.matchType}</p>
                  <p className="details">Sets: {match.totalSets}</p>
                  <p className="details">Venue: {match.venue}</p>
                  <p className="details">Date: {new Date(match.date).toLocaleDateString()}</p>
                  <p className="details">
                    Sets Completed: {(match.completedSets || []).length} of {match.totalSets}
                  </p>
                  <p className={`status ${match.status.toLowerCase()}`}>
                    Status: {match.status}
                  </p>
                </div>
                <div className="card-actions">
                  <button
                    className="continue-btn"
                    onClick={() => handleStartMatch(match.id)}
                    disabled={actionLoading}
                  >
                    Continue Match
                  </button>
                  <button
                    className="summary-btn"
                    onClick={() => viewMatchSummary(match.id)}
                    disabled={actionLoading}
                  >
                    View Summary
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Completed Matches Section */}
      <div className="fixtures-section">
        <h3>Completed Matches</h3>
        {completedMatches.length === 0 ? (
          <p className="no-matches">No matches completed yet.</p>
        ) : (
          <div className="matches-grid">
            {completedMatches.map((match) => {
              const { winner, setPoints } = getMatchResult(match);
              return (
                <div key={match.id} className="match-card completed">
                  <div className="match-info">
                    <h2 className="match-title">{renderPlayers(match)}</h2> {/* Add player names/teams at the top */}
                    <p className="details">Match Type: {match.matchType}</p>
                    <p className="details">Sets: {match.totalSets}</p>
                    <p className="details">Venue: {match.venue}</p>
                    <p className="details">Date: {new Date(match.date).toLocaleDateString()}</p>
                    <p className={`status ${match.status.toLowerCase()}`}>
                      Status: {match.status}
                    </p>
                    <p className="details">Winner: <span className="winner">{winner}</span></p>
                    <p className="details">Set Points: {setPoints}</p>
                  </div>
                  <div className="card-actions">
                    <button
                      className="summary-btn"
                      onClick={() => viewMatchSummary(match.id)}
                      disabled={actionLoading}
                    >
                      View Summary
                    </button>
                    <button
                      className="delete-btn"
                      onClick={() => deleteMatch(match.id)}
                      disabled={actionLoading}
                    >
                      Delete Match
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <button
        className="add-match-btn"
        onClick={() => navigate("/")}
        disabled={actionLoading}
      >
        Add New Match
      </button>
    </div>
  );
};

export default FixturesPage;