// src/components/ScorekeeperPage.jsx
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { fetchMatch, updateMatch } from "../utils/api";

const ScorekeeperPage = ({ matches, updateMatches }) => {
  const { matchId } = useParams();
  const navigate = useNavigate();
  const [match, setMatch] = useState(null);
  const [currentSet, setCurrentSet] = useState(1);
  const [notificationA, setNotificationA] = useState(null);
  const [notificationB, setNotificationB] = useState(null);
  const [matchWinner, setMatchWinner] = useState(null);
  const [servingTeam, setServingTeam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [correctionsLog, setCorrectionsLog] = useState([]);

  useEffect(() => {
    const fetchMatchData = async () => {
      try {
        setLoading(true);
        const response = await fetchMatch(matchId);
        if (response.data) {
          setMatch(response.data);
          initializeMatchState(response.data);
          setServingTeam(response.data.servingTeam || "Team A"); // Default to Team A if not set
        } else {
          setError("Match not found");
          setTimeout(() => navigate("/fixtures"), 3000);
        }
      } catch (err) {
        console.error("Failed to fetch match:", err);
        setError("Failed to load match data: " + (err.response?.data?.message || err.message));
        setTimeout(() => navigate("/fixtures"), 3000);
      } finally {
        setLoading(false);
      }
    };

    const foundMatch = matches.find((m) => m.id === matchId);
    if (foundMatch) {
      setMatch(foundMatch);
      initializeMatchState(foundMatch);
      setServingTeam(foundMatch.servingTeam || "Team A"); // Default to Team A if not set
      setLoading(false);
    } else {
      fetchMatchData();
    }
  }, [matchId, matches, navigate]);

  const initializeMatchState = (matchData) => {
    const completedSets = Array.isArray(matchData.completedSets) ? matchData.completedSets : [];
    if (completedSets.length < matchData.totalSets && matchData.status !== "completed") {
      setCurrentSet(completedSets.length + 1);
    } else if (matchData.status === "completed") {
      const winsA = completedSets.reduce(
        (count, s) => count + (s.winner === (matchData.matchType.toLowerCase() === "singles" ? matchData.playerA : "Team A") ? 1 : 0),
        0
      );
      const winsB = completedSets.reduce(
        (count, s) => count + (s.winner === (matchData.matchType.toLowerCase() === "singles" ? matchData.playerB : "Team B") ? 1 : 0),
        0
      );
      setMatchWinner(
        winsA > winsB
          ? matchData.matchType.toLowerCase() === "singles"
            ? matchData.playerA
            : `${matchData.teamA.player1}/${matchData.teamA.player2}`
          : matchData.matchType.toLowerCase() === "singles"
          ? matchData.playerB
          : `${matchData.teamB.player1}/${matchData.teamB.player2}`
      );
    }
  };

  const getCurrentSetData = (currentMatch) => {
    const completedSets = Array.isArray(currentMatch.completedSets) ? currentMatch.completedSets : [];
    const points = Array.isArray(currentMatch.points) ? currentMatch.points : [];
    const currentSetPoints = points.filter((p) => p.setNumber === currentSet);
    const scoreA = currentSetPoints.reduce((sum, p) => sum + (p.scorer === "A" ? 1 : 0), 0);
    const scoreB = currentSetPoints.reduce((sum, p) => sum + (p.scorer === "B" ? 1 : 0), 0);
    return { completedSets, points: currentSetPoints, scoreA, scoreB };
  };

  const showNotification = (message, player) => {
    if (player === "A") {
      setNotificationA(message);
      setTimeout(() => setNotificationA(null), 3000);
    } else if (player === "B") {
      setNotificationB(message);
      setTimeout(() => setNotificationB(null), 3000);
    } else {
      setNotificationA(message);
      setTimeout(() => setNotificationA(null), 3000);
    }
  };

  const checkSetStatus = (newScoreA, newScoreB, player) => {
    const matchPoints = match.matchPoints || 21; // Default to 21 if not specified
    const entityA = match.matchType.toLowerCase() === "singles" ? match.playerA : "Team A";
    const entityB = match.matchType.toLowerCase() === "singles" ? match.playerB : "Team B";

    // Golden points
    const goldenPoint = matchPoints === 15 ? 20 : matchPoints === 21 ? 30 : null;

    // Check for golden point win
    if (goldenPoint) {
      if (newScoreA >= goldenPoint) {
        endSet(match.matchType.toLowerCase() === "singles" ? match.playerA : "Team A", newScoreA, newScoreB);
        return true;
      } else if (newScoreB >= goldenPoint) {
        endSet(match.matchType.toLowerCase() === "singles" ? match.playerB : "Team B", newScoreA, newScoreB);
        return true;
      }
    }

    // Match points logic
    if (matchPoints === 11) {
      // For 11 points, first to 11 wins, no deuce/advantage
      if (newScoreA >= 11) {
        endSet(match.matchType.toLowerCase() === "singles" ? match.playerA : "Team A", newScoreA, newScoreB);
        return true;
      } else if (newScoreB >= 11) {
        endSet(match.matchType.toLowerCase() === "singles" ? match.playerB : "Team B", newScoreA, newScoreB);
        return true;
      }
    } else if (matchPoints === 15) {
      // For 15 points, must win by 2 points, with deuce/advantage at 14-14
      if (newScoreA >= 15 && newScoreA - newScoreB >= 2) {
        endSet(match.matchType.toLowerCase() === "singles" ? match.playerA : "Team A", newScoreA, newScoreB);
        return true;
      } else if (newScoreB >= 15 && newScoreB - newScoreA >= 2) {
        endSet(match.matchType.toLowerCase() === "singles" ? match.playerB : "Team B", newScoreA, newScoreB);
        return true;
      }

      // Deuce and advantage logic at 14-14
      if (newScoreA >= 14 && newScoreB >= 14) {
        if (newScoreA === newScoreB) {
          showNotification("Deuce");
        } else if (newScoreA === newScoreB + 1) {
          showNotification(`Advantage ${entityA}`);
        } else if (newScoreB === newScoreA + 1) {
          showNotification(`Advantage ${entityB}`);
        }
      } else if (newScoreA === 14 && newScoreB < 13) {
        showNotification(`${entityA} is on set point`);
      } else if (newScoreB === 14 && newScoreA < 13) {
        showNotification(`${entityB} is on set point`);
      }
    } else if (matchPoints === 21) {
      // For 21 points, existing logic (win by 2 points, deuce/advantage at 20-20)
      if (newScoreA >= 21 && newScoreA - newScoreB >= 2) {
        endSet(match.matchType.toLowerCase() === "singles" ? match.playerA : "Team A", newScoreA, newScoreB);
        return true;
      } else if (newScoreB >= 21 && newScoreB - newScoreA >= 2) {
        endSet(match.matchType.toLowerCase() === "singles" ? match.playerB : "Team B", newScoreA, newScoreB);
        return true;
      }

      if (newScoreA >= 20 && newScoreB >= 20) {
        if (newScoreA === newScoreB) {
          showNotification("Deuce");
        } else if (newScoreA === newScoreB + 1) {
          showNotification(`Advantage ${entityA}`);
        } else if (newScoreB === newScoreA + 1) {
          showNotification(`Advantage ${entityB}`);
        }
      } else if (newScoreA === 20 && newScoreB < 19) {
        showNotification(`${entityA} is on set point`);
      } else if (newScoreB === 20 && newScoreA < 19) {
        showNotification(`${entityB} is on set point`);
      }
    }

    return false;
  };

  const endSet = (setWinner, finalScoreA, finalScoreB) => {
    const newSet = { setNumber: currentSet, scoreA: finalScoreA, scoreB: finalScoreB, winner: setWinner };
    const updatedCompletedSets = [...(match.completedSets || []), newSet];
    const winsA = updatedCompletedSets.reduce(
      (count, s) => count + (s.winner === (match.matchType.toLowerCase() === "singles" ? match.playerA : "Team A") ? 1 : 0),
      0
    );
    const winsB = updatedCompletedSets.reduce(
      (count, s) => count + (s.winner === (match.matchType.toLowerCase() === "singles" ? match.playerB : "Team B") ? 1 : 0),
      0
    );
    const maxSets = match.totalSets;
    const requiredWins = Math.floor(maxSets / 2) + 1;

    if (winsA >= requiredWins || winsB >= requiredWins) {
      setMatchWinner(
        winsA > winsB
          ? match.matchType.toLowerCase() === "singles"
            ? match.playerA
            : `${match.teamA.player1}/${match.teamA.player2}`
          : match.matchType.toLowerCase() === "singles"
          ? match.playerB
          : `${match.teamB.player1}/${match.teamB.player2}`
      );
      updateMatchStatus("completed", updatedCompletedSets);
    } else if (currentSet < maxSets) {
      setCurrentSet(currentSet + 1);
      const nextServingTeam = setWinner === (match.matchType.toLowerCase() === "singles" ? match.playerA : "Team A") ? setWinner : setWinner === "Team A" ? "Team B" : "Team A";
      setServingTeam(nextServingTeam);
      showNotification(`Set ${currentSet} won by ${setWinner}. Starting Set ${currentSet + 1}.`);
      updateMatchStatus("ongoing", updatedCompletedSets);
    } else {
      setMatchWinner(
        winsA > winsB
          ? match.matchType.toLowerCase() === "singles"
            ? match.playerA
            : `${match.teamA.player1}/${match.teamA.player2}`
          : match.matchType.toLowerCase() === "singles"
          ? match.playerB
          : `${match.teamB.player1}/${match.teamB.player2}`
      );
      updateMatchStatus("completed", updatedCompletedSets);
    }
  };

  const updateMatchStatus = async (status, updatedCompletedSets) => {
    try {
      const updatedMatch = { ...match, status, completedSets: updatedCompletedSets, servingTeam };
      await updateMatch(matchId, updatedMatch);
      setMatch(updatedMatch);
      updateMatches(matches.map((m) => (m.id === matchId ? updatedMatch : m)));
      showNotification(`Match status updated to ${status}`);
    } catch (err) {
      console.error("Failed to update match status:", err);
      showNotification("Failed to update match status!");
    }
  };

  const addPoint = async (player) => {
    if (match.points.length >= 60) {
      showNotification("Maximum points reached for this set");
      return;
    }

    // Save previous state for rollback
    const previousMatch = { ...match };
    const previousServingTeam = servingTeam;

    try {
      const pointId = `${Date.now()}-${player}`;
      const newPoint = {
        id: pointId,
        scorer: player,
        timestamp: new Date().toISOString(),
        setNumber: currentSet,
      };
      const updatedPoints = [...(match.points || []), newPoint];

      // Serve logic: The team that wins the point keeps the serve
      const newServingTeam = player === "A" ? "Team A" : "Team B";

      // Optimistically update state
      const updatedMatch = {
        ...match,
        points: updatedPoints,
        status: match.status === "pending" ? "ongoing" : match.status,
        servingTeam: newServingTeam,
      };
      setMatch(updatedMatch);
      setServingTeam(newServingTeam);
      updateMatches(matches.map((m) => (m.id === matchId ? updatedMatch : m)));

      // Update backend asynchronously
      await updateMatch(matchId, updatedMatch);

      const entityA = match.matchType.toLowerCase() === "singles" ? match.playerA : `${match.teamA.player1}/${match.teamA.player2}`;
      const entityB = match.matchType.toLowerCase() === "singles" ? match.playerB : `${match.teamB.player1}/${match.teamB.player2}`;
      const { scoreA: newScoreA, scoreB: newScoreB } = getCurrentSetData(updatedMatch);
      if (player === "A") {
        showNotification(`${entityA} scores! ${newScoreA} - ${newScoreB}`, "A");
      } else {
        showNotification(`${entityB} scores! ${newScoreA} - ${newScoreB}`, "B");
      }
      checkSetStatus(newScoreA, newScoreB, player);
    } catch (err) {
      // Revert on failure
      setMatch(previousMatch);
      setServingTeam(previousServingTeam);
      updateMatches(matches.map((m) => (m.id === matchId ? previousMatch : m)));
      console.error("Failed to add point:", err);
      showNotification("Failed to update score: " + (err.response?.data?.message || err.message));
    }
  };

  const removePoint = async (player) => {
    if (!match.points || match.points.length === 0) {
      showNotification("No points to remove");
      return;
    }

    const entityA = match.matchType.toLowerCase() === "singles" ? match.playerA : `${match.teamA.player1}/${match.teamA.player2}`;
    const entityB = match.matchType.toLowerCase() === "singles" ? match.playerB : `${match.teamB.player1}/${match.teamB.player2}`;

    try {
      const lastPoint = match.points[match.points.length - 1];
      if (lastPoint.scorer !== player) {
        showNotification(`Last point was not scored by ${player === "A" ? entityA : entityB}`);
        return;
      }

      const updatedPoints = match.points.slice(0, -1);
      let newServingTeam = servingTeam;

      const { scoreA, scoreB, completedSets } = getCurrentSetData({ ...match, points: updatedPoints });

      let newStatus = match.status;
      let newCompletedSets = [...(match.completedSets || [])];
      if (completedSets.length > 0 && lastPoint.setNumber === completedSets[completedSets.length - 1].setNumber) {
        const lastSet = completedSets[completedSets.length - 1];
        if (lastSet.scoreA === (scoreA + (lastPoint.scorer === "A" ? 1 : 0)) && lastSet.scoreB === (scoreB + (lastPoint.scorer === "B" ? 1 : 0))) {
          newCompletedSets = completedSets.slice(0, -1);
          newStatus = newCompletedSets.length === 0 ? "ongoing" : match.totalSets > newCompletedSets.length ? "ongoing" : "completed";
          setCurrentSet(lastSet.setNumber);
          setMatchWinner(null);
        }
      }

      // Serve logic after removing a point: Use the previous point to determine the serving team
      const prevPoint = updatedPoints[updatedPoints.length - 1];
      if (prevPoint) {
        newServingTeam = prevPoint.scorer === "A" ? "Team A" : "Team B";
      } else {
        newServingTeam = match.servingTeam || "Team A";
      }

      const updatedMatch = {
        ...match,
        points: updatedPoints,
        status: newStatus,
        completedSets: newCompletedSets,
        servingTeam: newServingTeam,
      };
      await updateMatch(matchId, updatedMatch);
      setMatch(updatedMatch);
      setServingTeam(newServingTeam);
      updateMatches(matches.map((m) => (m.id === matchId ? updatedMatch : m)));

      const removedPlayer = lastPoint.scorer === "A" ? entityA : entityB;
      showNotification(`Removed point for ${removedPlayer}. Score: ${scoreA} - ${scoreB}`);

      setCorrectionsLog([
        ...correctionsLog,
        {
          timestamp: new Date().toISOString(),
          action: `Removed point for ${removedPlayer} in Set ${lastPoint.setNumber}`,
          oldScore: `${scoreA + (lastPoint.scorer === "A" ? 1 : 0)} - ${scoreB + (lastPoint.scorer === "B" ? 1 : 0)}`,
          newScore: `${scoreA} - ${scoreB}`,
        },
      ]);
    } catch (err) {
      console.error("Failed to remove point:", err);
      showNotification("Failed to remove point!");
    }
  };

  const resetMatch = async () => {
    try {
      const resetMatch = {
        ...match,
        points: [],
        completedSets: [],
        status: "pending",
        servingTeam: match.servingTeam,
      };
      await updateMatch(matchId, resetMatch);
      setMatch(resetMatch);
      setCurrentSet(1);
      setMatchWinner(null);
      setServingTeam(resetMatch.servingTeam);
      updateMatches(matches.map((m) => (m.id === matchId ? resetMatch : m)));
      setCorrectionsLog([]);
      showNotification("Match reset successfully!");
    } catch (err) {
      console.error("Failed to reset match:", err);
      showNotification("Failed to reset match!");
    }
  };

  const handleViewSummary = () => {
    navigate(`/summary/${matchId}`);
  };

  const closeWinnerPopup = () => {
    setMatchWinner(null);
  };

  if (loading) return <div className="loading">Loading Match...</div>;
  if (error) return <div className="error">{error}</div>;
  if (!match) return <div className="not-found">Match not found</div>;

  const { scoreA, scoreB, points, completedSets } = getCurrentSetData(match);
  const pointsWithScores = points.map((point, index) => {
    const priorPoints = points.slice(0, index + 1);
    const scoreA = priorPoints.reduce((sum, p) => sum + (p.scorer === "A" ? 1 : 0), 0);
    const scoreB = priorPoints.reduce((sum, p) => sum + (p.scorer === "B" ? 1 : 0), 0);
    return { ...point, scoreA, scoreB };
  });

  const renderPlayers = () => {
    if (match.matchType.toLowerCase() === "singles") {
      return (
        <>
          <span className="player-highlight">{match.playerA}</span> vs <span className="player-highlight">{match.playerB}</span>
        </>
      );
    } else if (match.matchType.toLowerCase() === "mixed" || match.matchType.toLowerCase() === "doubles") {
      return (
        <>
          <span className="player-highlight">{match.teamA.player1} / {match.teamA.player2}</span> vs{" "}
          <span className="player-highlight">{match.teamB.player1} / {match.teamB.player2}</span>
        </>
      );
    }
    return null;
  };

  const entityA = match.matchType.toLowerCase() === "singles" ? match.playerA : `${match.teamA.player1}/${match.teamA.player2}`;
  const entityB = match.matchType.toLowerCase() === "singles" ? match.playerB : `${match.teamB.player1}/${match.teamB.player2}`;
  const isDoublesOrMixed = match.matchType.toLowerCase() === "doubles" || match.matchType.toLowerCase() === "mixed";

  return (
    <div className="scorekeeper-wrapper">
      <div className="scorekeeper-container">
        <div className="match-header">
          <h2 className="match-title">Set {currentSet} of {match.totalSets}</h2>
          <div className="match-players uppercase">{renderPlayers()}</div>
          <p><span className="font-medium text-white">Match Format:</span> Best of {match.totalSets} sets, {match.matchPoints || 21}-points match</p>
        </div>

        <div className="sets-summary">
          <h3>Completed Sets</h3>
          {completedSets.length === 0 ? (
            <div className="no-sets-message">
              <p>No sets completed yet.</p>
            </div>
          ) : (
            <div className="completed-sets-grid">
              {completedSets.map((set) => (
                <div key={set.setNumber} className="set-info">
                  <p>Set {set.setNumber}: {set.scoreA} - {set.scoreB}</p>
                  <p>Winner: <span className="winner-name">{set.winner}</span></p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="score-grid">
          <div className="player-section">
            {servingTeam && (
              <p className="serve-status">
                {servingTeam === "Team A" ? "Serving" : "Receiving"}
              </p>
            )}
            <h3 className="player-name">{entityA}</h3>
            {notificationA && <div className="green-notification">{notificationA}</div>}
            <div className="score-box">{scoreA}</div>
            {match.matchPoints !== 11 && scoreA >= (match.matchPoints - 1) && scoreA > scoreB && scoreA - scoreB === 1 && (
              <p className="advantage-text">Advantage {entityA}</p>
            )}
            {match.matchPoints !== 11 && scoreA >= (match.matchPoints - 1) && scoreA === scoreB && (
              <p className="deuce-text">Deuce</p>
            )}
            <div className="score-buttons">
              <button className="score-btn add-btn player-a" onClick={() => addPoint("A")}>
                +1
              </button>
              <button className="score-btn remove-btn player-a" onClick={() => removePoint("A")} disabled={scoreA === 0}>
                -1
              </button>
            </div>
          </div>
          <div className="vs-section">
            <span className="vs-text">VS</span>
          </div>
          <div className="player-section">
            {servingTeam && (
              <p className="serve-status">
                {servingTeam === "Team B" ? "Serving" : "Receiving"}
              </p>
            )}
            <h3 className="player-name">{entityB}</h3>
            {notificationB && <div className="green-notification">{notificationB}</div>}
            <div className="score-box">{scoreB}</div>
            {match.matchPoints !== 11 && scoreB >= (match.matchPoints - 1) && scoreB > scoreA && scoreB - scoreA === 1 && (
              <p className="advantage-text">Advantage {entityB}</p>
            )}
            {match.matchPoints !== 11 && scoreB >= (match.matchPoints - 1) && scoreB === scoreA && (
              <p className="deuce-text">Deuce</p>
            )}
            <div className="score-buttons">
              <button className="score-btn add-btn player-b" onClick={() => addPoint("B")}>
                +1
              </button>
              <button className="score-btn remove-btn player-b" onClick={() => removePoint("B")} disabled={scoreB === 0}>
                -1
              </button>
            </div>
          </div>
        </div>

        <div className="points-history">
          <h3>Points History (Set {currentSet})</h3>
          {points.length === 0 ? (
            <p className="no-points">No points recorded yet.</p>
          ) : (
            <ul className="points-list">
              {pointsWithScores.slice().reverse().map((point) => (
                <li key={point.id} className={`point-item ${point.scorer === "A" ? "player-a" : "player-b"}`}>
                  <div className="point-details">
                    <span className="point-action">
                      {point.scorer === "A" ? entityA : entityB} scored
                    </span>
                    <span className="point-time">{new Date(point.timestamp).toLocaleTimeString()}</span>
                  </div>
                  <span>{point.scoreA} - {point.scoreB}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="corrections-log">
          <h3>Corrections Log</h3>
          {correctionsLog.length === 0 ? (
            <p>No corrections made yet.</p>
          ) : (
            <ul className="corrections-list">
              {correctionsLog.map((log, index) => (
                <li key={index} className="correction-item">
                  <span className="correction-time">{new Date(log.timestamp).toLocaleTimeString()}</span>
                  <span className="correction-action">{log.action}</span>
                  <span className="correction-score">
                    <span>{log.oldScore}</span>
                    <span>{log.newScore}</span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="navigation-buttons">
          <button className="summary-btn" onClick={handleViewSummary}>
            View Summary
          </button>
          <button className="back-btn" onClick={() => navigate("/fixtures")}>
            Back to Fixtures
          </button>
          <button className="reset-btn" onClick={resetMatch}>
            Reset Match
          </button>
        </div>

        {matchWinner && (
          <div className="winner-popup">
            <div className="popup-content">
              <h2>Congratulations!</h2>
              <p>{matchWinner} wins the match!</p>
              <button className="summary-btn" onClick={handleViewSummary}>
                View Match Summary
              </button>
              <button className="back-btn" onClick={() => navigate("/fixtures")}>
                Back to Fixtures
              </button>
              <button className="close-btn" onClick={closeWinnerPopup}>
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ScorekeeperPage;