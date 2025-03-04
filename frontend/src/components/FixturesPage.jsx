import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const FixturesPage = ({ matches, updateMatches }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isInitialFetchDone, setIsInitialFetchDone] = useState(false);
  const [tossSelection, setTossSelection] = useState(null); // Match ID for toss selection
  const [tossWinner, setTossWinner] = useState(""); // Selected toss winner
  const [courtSelection, setCourtSelection] = useState(null); // Match ID for court selection
  const [teamACourt, setTeamACourt] = useState({ right: "", left: "" }); // Team A court positions
  const [teamBCourt, setTeamBCourt] = useState({ right: "", left: "" }); // Team B court positions

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
        const response = await axios.delete(`http://localhost:5000/api/matches/${matchId}`);
        const updatedMatches = matches.filter((m) => m.id !== matchId);
        updateMatches(updatedMatches);
      } catch (err) {
        console.error("Failed to delete match:", err);
        if (err.response?.status === 404) {
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

  const getMatchResult = (match) => {
    if (match.status !== "completed" || !match.completedSets || match.completedSets.length === 0) {
      return { winner: "N/A", setPoints: "N/A" };
    }

    const isSingles = match.matchType.toLowerCase() === "singles";
    const entityA = isSingles ? match.playerA : `${match.teamA.player1}/${match.teamA.player2}`;
    const entityB = isSingles ? match.playerB : `${match.teamB.player1}/${match.teamB.player2}`;

    const winsA = match.completedSets.reduce(
      (count, set) => count + (set.winner === (isSingles ? match.playerA : "Team A") ? 1 : 0),
      0
    );
    const winsB = match.completedSets.reduce(
      (count, set) => count + (set.winner === (isSingles ? match.playerB : "Team B") ? 1 : 0),
      0
    );
    const winner = winsA > winsB 
      ? (isSingles ? `Player - ${entityA}` : `Team A - ${entityA}`)
      : (isSingles ? `Player - ${entityB}` : `Team B - ${entityB}`);
    const setPoints = match.completedSets.map(set => `${set.scoreA}-${set.scoreB}`).join(", ");

    return { winner, setPoints };
  };

  const pendingMatches = useMemo(() => matches.filter((match) => match.status === "pending"), [matches]);
  const ongoingMatches = useMemo(() => matches.filter((match) => match.status === "ongoing"), [matches]);
  const completedMatches = useMemo(() => matches.filter((match) => match.status === "completed"), [matches]);

  if (loading && !isInitialFetchDone) {
    return <div className="loading">Loading matches...</div>;
  }

  const renderPlayers = (match) => {
    const matchType = match.matchType.toLowerCase();
    if (matchType === "singles") {
      return (
        <>
          <span className="player-name">{match.playerA}</span> vs <span className="player-name">{match.playerB}</span>
        </>
      );
    } else if (matchType === "doubles" || matchType === "mixed") {
      return (
        <>
          <span className="player-name">{match.teamA.player1}/{match.teamA.player2}</span> vs{" "}
          <span className="player-name">{match.teamB.player1}/{match.teamB.player2}</span>
        </>
      );
    }
    return null;
  };

  const initiateToss = (matchId) => {
    setTossSelection(matchId);
    setTossWinner("");
  };

  const handleTossSubmit = async (matchId) => {
    if (!tossWinner) {
      setError("Please select a toss winner.");
      return;
    }

    setActionLoading(true);
    setError(null);
    try {
      const matchToUpdate = matches.find(m => m.id === matchId);
      const updatedMatch = { ...matchToUpdate, tossWinner };
      await axios.put(`http://localhost:5000/api/matches/${matchId}`, updatedMatch);
      updateMatches(matches.map(m => m.id === matchId ? updatedMatch : m));
      setTossSelection(null);
    } catch (err) {
      console.error("Failed to update toss winner:", err);
      setError("Failed to update toss winner. Please try again.");
    } finally {
      setActionLoading(false);
    }
  };

  const initiateCourtSelection = (matchId) => {
    setCourtSelection(matchId);
    const match = matches.find(m => m.id === matchId);
    setTeamACourt({ right: match.teamA.player1, left: match.teamA.player2 }); // Default initial values
    setTeamBCourt({ right: match.teamB.player1, left: match.teamB.player2 });
  };

  const handleCourtSubmit = async (matchId) => {
    if (!teamACourt.right || !teamACourt.left || !teamBCourt.right || !teamBCourt.left) {
      setError("Please assign all court positions.");
      return;
    }

    setActionLoading(true);
    setError(null);
    try {
      const matchToUpdate = matches.find(m => m.id === matchId);
      const updatedMatch = { 
        ...matchToUpdate, 
        teamACourt: { right: teamACourt.right, left: teamACourt.left },
        teamBCourt: { right: teamBCourt.right, left: teamBCourt.left }
      };
      await axios.put(`http://localhost:5000/api/matches/${matchId}`, updatedMatch);
      updateMatches(matches.map(m => m.id === matchId ? updatedMatch : m));
      setCourtSelection(null);
    } catch (err) {
      console.error("Failed to update court positions:", err);
      setError("Failed to update court positions. Please try again.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleServeChoice = async (matchId, choice) => {
    setActionLoading(true);
    setError(null);
    try {
      const matchToUpdate = matches.find(m => m.id === matchId);
      let servingTeam = matchToUpdate.tossWinner === "Team A" ? "Team A" : "Team B";
      if (choice === "Receive") {
        servingTeam = matchToUpdate.tossWinner === "Team A" ? "Team B" : "Team A";
      }

      const updatedMatch = { ...matchToUpdate, servingTeam };
      await axios.put(`http://localhost:5000/api/matches/${matchId}`, updatedMatch);
      updateMatches(matches.map(m => m.id === matchId ? updatedMatch : m));
      setTossSelection(null);
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

      <div className="fixtures-section">
        <h3>Pending Matches</h3>
        {pendingMatches.length === 0 ? (
          <p className="no-matches">No pending matches scheduled.</p>
        ) : (
          <div className="matches-grid">
            {pendingMatches.map((match) => (
              <div key={match.id} className="match-card">
                <div className="match-info">
                  <h2 className="match-title">{renderPlayers(match)}</h2>
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
                    disabled={actionLoading || !match.servingTeam || 
                              ((match.matchType.toLowerCase() === "doubles" || match.matchType.toLowerCase() === "mixed") && 
                               (!match.teamACourt || !match.teamBCourt))}
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
                      onClick={() => initiateToss(match.id)}
                      disabled={actionLoading}
                    >
                      Toss
                    </button>
                  )}
                  {tossSelection === match.id && !match.tossWinner && (
                    <div className="toss-result">
                      <p>Who won the toss?</p>
                      <select
                        value={tossWinner}
                        onChange={(e) => setTossWinner(e.target.value)}
                        disabled={actionLoading}
                      >
                        <option value="">Select Toss Winner</option>
                        {match.matchType.toLowerCase() === "singles" ? (
                          <>
                            <option value="Team A">{match.playerA}</option>
                            <option value="Team B">{match.playerB}</option>
                          </>
                        ) : (
                          <>
                            <option value="Team A">{`${match.teamA.player1}/${match.teamA.player2}`}</option>
                            <option value="Team B">{`${match.teamB.player1}/${match.teamB.player2}`}</option>
                          </>
                        )}
                      </select>
                      <button
                        className="submit-toss-btn"
                        onClick={() => handleTossSubmit(match.id)}
                        disabled={actionLoading || !tossWinner}
                      >
                        Submit Toss
                      </button>
                    </div>
                  )}
                  {match.tossWinner && !match.servingTeam && (
                    <div className="toss-result">
                      <p>Toss Winner: {match.tossWinner === "Team A" 
                        ? (match.matchType.toLowerCase() === "singles" ? match.playerA : `${match.teamA.player1}/${match.teamA.player2}`)
                        : (match.matchType.toLowerCase() === "singles" ? match.playerB : `${match.teamB.player1}/${match.teamB.player2}`)}</p>
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
                  {(match.matchType.toLowerCase() === "doubles" || match.matchType.toLowerCase() === "mixed") && match.servingTeam && !match.teamACourt && (
                    <button
                      className="court-btn"
                      onClick={() => initiateCourtSelection(match.id)}
                      disabled={actionLoading}
                    >
                      Set Court Positions
                    </button>
                  )}
                  {courtSelection === match.id && !match.teamACourt && (
                    <div className="court-selection">
                      <p>Team A Court Positions</p>
                      <select
                        value={teamACourt.right}
                        onChange={(e) => setTeamACourt({ ...teamACourt, right: e.target.value, left: e.target.value === match.teamA.player1 ? match.teamA.player2 : match.teamA.player1 })}
                        disabled={actionLoading}
                      >
                        <option value="">Select Right Side</option>
                        <option value={match.teamA.player1}>{match.teamA.player1}</option>
                        <option value={match.teamA.player2}>{match.teamA.player2}</option>
                      </select>
                      <select
                        value={teamACourt.left}
                        onChange={(e) => setTeamACourt({ ...teamACourt, left: e.target.value, right: e.target.value === match.teamA.player1 ? match.teamA.player2 : match.teamA.player1 })}
                        disabled={actionLoading}
                      >
                        <option value="">Select Left Side</option>
                        <option value={match.teamA.player1}>{match.teamA.player1}</option>
                        <option value={match.teamA.player2}>{match.teamA.player2}</option>
                      </select>
                      <p>Team B Court Positions</p>
                      <select
                        value={teamBCourt.right}
                        onChange={(e) => setTeamBCourt({ ...teamBCourt, right: e.target.value, left: e.target.value === match.teamB.player1 ? match.teamB.player2 : match.teamB.player1 })}
                        disabled={actionLoading}
                      >
                        <option value="">Select Right Side</option>
                        <option value={match.teamB.player1}>{match.teamB.player1}</option>
                        <option value={match.teamB.player2}>{match.teamB.player2}</option>
                      </select>
                      <select
                        value={teamBCourt.left}
                        onChange={(e) => setTeamBCourt({ ...teamBCourt, left: e.target.value, right: e.target.value === match.teamB.player1 ? match.teamB.player2 : match.teamB.player1 })}
                        disabled={actionLoading}
                      >
                        <option value="">Select Left Side</option>
                        <option value={match.teamB.player1}>{match.teamB.player1}</option>
                        <option value={match.teamB.player2}>{match.teamB.player2}</option>
                      </select>
                      <button
                        className="submit-court-btn"
                        onClick={() => handleCourtSubmit(match.id)}
                        disabled={actionLoading || !teamACourt.right || !teamACourt.left || !teamBCourt.right || !teamBCourt.left}
                      >
                        Submit Court Positions
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="fixtures-section">
        <h3>Matches In Progress</h3>
        {ongoingMatches.length === 0 ? (
          <p className="no-matches">No matches in progress.</p>
        ) : (
          <div className="matches-grid">
            {ongoingMatches.map((match) => (
              <div key={match.id} className="match-card ongoing">
                <div className="match-info">
                  <h2 className="match-title">{renderPlayers(match)}</h2>
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
                    <h2 className="match-title">{renderPlayers(match)}</h2>
                    <p className="details">Match Type: {match.matchType}</p>
                    <p className="details">Sets: {match.totalSets}</p>
                    <p className="details">Venue: {match.venue}</p>
                    <p className="details">Date: {new Date(match.date).toLocaleDateString()}</p>
                    <p className={`status ${match.status.toLowerCase()}`}>
                      Status: {match.status}
                    </p>
                    <p className="match-winner">Winner: {winner}</p>
                    <p className="set-points">Set Points: {setPoints}</p>
                  </div>
                  <div className="card-actions">
                    <button
                      className="summary-btn"
                      onClick={() => viewMatchSummary(match.id)}
                      disabled={actionLoading}
                    >
                      View Summary
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default FixturesPage;