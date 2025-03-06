// src/components/FixturesPage.jsx
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { fetchMatches, deleteMatch, updateMatch, exportMatches } from "../utils/api";

const FixturesPage = ({ matches, updateMatches }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isInitialFetchDone, setIsInitialFetchDone] = useState(false);
  const [tossSelection, setTossSelection] = useState(null);
  const [tossWinner, setTossWinner] = useState("");
  const [courtSelection, setCourtSelection] = useState(null);
  const [teamACourt, setTeamACourt] = useState({ right: "", left: "" });
  const [teamBCourt, setTeamBCourt] = useState({ right: "", left: "" });
  const [copySuccess, setCopySuccess] = useState(false); // State for copy feedback

  const fetchMatchesData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetchMatches();
      if (response.data && Array.isArray(response.data)) {
        console.log("Fetched matches in FixturesPage:", response.data);
        updateMatches(response.data);
      }
    } catch (err) {
      console.error("Failed to fetch matches:", err.response?.data || err.message);
      setError("Failed to load matches: " + (err.response?.data?.message || "Please try again."));
    } finally {
      setLoading(false);
      setIsInitialFetchDone(true);
    }
  }, [updateMatches]);

  useEffect(() => {
    console.log("FixturesPage received matches prop:", matches);
    if (!matches || matches.length === 0) {
      fetchMatchesData();
    } else {
      setIsInitialFetchDone(true);
    }
  }, [fetchMatchesData, matches]);

  const handleRefresh = () => {
    fetchMatchesData();
  };

  const deleteMatchAction = useCallback(
    async (matchId) => {
      if (!window.confirm(`Are you sure you want to delete match ${matchId}?`)) return;

      try {
        setActionLoading(true);
        setError(null);
        await deleteMatch(matchId);
        const updatedMatches = matches.filter((m) => m.id !== matchId);
        updateMatches(updatedMatches);
      } catch (err) {
        console.error("Failed to delete match:", err.response?.data || err.message);
        if (err.response?.status === 404) {
          const updatedMatches = matches.filter((m) => m.id !== matchId);
          updateMatches(updatedMatches);
        } else {
          setError("Failed to delete match: " + (err.response?.data?.message || err.message));
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

  const handleExport = useCallback(async () => {
    try {
      await exportMatches();
    } catch (err) {
      console.error("Failed to export matches:", err.response?.data || err.message);
      setError("Failed to export matches: " + (err.response?.data?.message || err.message));
    }
  }, []);

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
    const winner = winsA > winsB ? (isSingles ? `Player - ${entityA}` : `Team A - ${entityA}`) : winsB > winsA ? (isSingles ? `Player - ${entityB}` : `Team B - ${entityB}`) : "Tie";
    const setPoints = match.completedSets.map(set => `${set.scoreA}-${set.scoreB}`).join(", ");

    return { winner, setPoints };
  };

  const pendingMatches = useMemo(() => {
    console.log("Pending Matches:", matches.filter((match) => match.status === "pending"));
    return matches.filter((match) => match.status === "pending");
  }, [matches]);
  const ongoingMatches = useMemo(() => {
    console.log("Ongoing Matches:", matches.filter((match) => match.status === "ongoing"));
    return matches.filter((match) => match.status === "ongoing");
  }, [matches]);
  const completedMatches = useMemo(() => {
    console.log("Completed Matches:", matches.filter((match) => match.status === "completed"));
    return matches.filter((match) => match.status === "completed");
  }, [matches]);

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
      await updateMatch(matchId, updatedMatch);
      updateMatches(matches.map(m => m.id === matchId ? updatedMatch : m));
      setTossSelection(null);
    } catch (err) {
      console.error("Failed to update toss winner:", err.response?.data || err.message);
      setError("Failed to update toss winner: " + (err.response?.data?.message || err.message));
    } finally {
      setActionLoading(false);
    }
  };

  const initiateCourtSelection = (matchId) => {
    setCourtSelection(matchId);
    const match = matches.find(m => m.id === matchId);
    setTeamACourt({ right: match.teamA.player1, left: match.teamA.player2 });
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
      await updateMatch(matchId, updatedMatch);
      updateMatches(matches.map(m => m.id === matchId ? updatedMatch : m));
      setCourtSelection(null);
    } catch (err) {
      console.error("Failed to update court positions:", err.response?.data || err.message);
      setError("Failed to update court positions: " + (err.response?.data?.message || err.message));
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
      await updateMatch(matchId, updatedMatch);
      updateMatches(matches.map(m => m.id === matchId ? updatedMatch : m));
      setTossSelection(null);
    } catch (err) {
      console.error("Failed to set serve choice:", err.response?.data || err.message);
      setError("Failed to set serve choice: " + (err.response?.data?.message || err.message));
    } finally {
      setActionLoading(false);
    }
  };

  // Function to copy the public score link to clipboard
  const handleCopyLink = () => {
    const publicScoreUrl = "https://badbash.netlify.app/public-scores"; // Replace with your actual deployed URL
    navigator.clipboard.writeText(publicScoreUrl)
      .then(() => {
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000); // Reset after 2 seconds
      })
      .catch((err) => {
        console.error("Failed to copy link:", err);
        setError("Failed to copy link to clipboard");
      });
  };

  return (
    <div className="fixtures-container">
      <div className="fixtures-header">
        <h2>Fixtures</h2>
        <div className="header-actions">
          <div className="copy-link-container">
            <input
              type="text"
              value="https://badbash.netlify.app/public-scores"
              readOnly
              className="copy-link-input"
            />
            <button
              className="copy-link-btn"
              onClick={handleCopyLink}
              disabled={copySuccess}
            >
              {copySuccess ? "Copied!" : "Copy Link"}
            </button>
          </div>
          <button className="export-btn" onClick={handleExport}>
            Export to Excel
          </button>
          <button className="refresh-btn" onClick={handleRefresh} disabled={loading}>
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}
      {actionLoading && <div className="loading">Processing...</div>}

      <div className="fixtures-section">
        <h3>Pending Matches</h3>
        {loading && !isInitialFetchDone && <div className="loading">Loading matches...</div>}
        {!loading && isInitialFetchDone && pendingMatches.length === 0 && (
          <p className="no-matches">No pending matches scheduled.</p>
        )}
        {!loading && isInitialFetchDone && pendingMatches.length > 0 && (
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
                    onClick={() => deleteMatchAction(match.id)}
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
        {loading && !isInitialFetchDone && <div className="loading">Loading matches...</div>}
        {!loading && isInitialFetchDone && ongoingMatches.length === 0 && (
          <p className="no-matches">No matches in progress.</p>
        )}
        {!loading && isInitialFetchDone && ongoingMatches.length > 0 && (
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
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="fixtures-section">
        <h3>Completed Matches</h3>
        {loading && !isInitialFetchDone && <div className="loading">Loading matches...</div>}
        {!loading && isInitialFetchDone && completedMatches.length === 0 && (
          <p className="no-matches">No matches completed yet.</p>
        )}
        {!loading && isInitialFetchDone && completedMatches.length > 0 && (
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
                    {/* Removed View Summary button as per request */}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {!loading && isInitialFetchDone && matches.length === 0 && (
        <div className="no-matches-message">
          <p>No ongoing, upcoming, or completed matches.</p>
        </div>
      )}
    </div>
  );
};

export default FixturesPage;