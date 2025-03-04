import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

const ScorekeeperPage = ({ matches, updateMatches }) => {
  const { matchId } = useParams();
  const navigate = useNavigate();
  const [match, setMatch] = useState(null);
  const [currentSet, setCurrentSet] = useState(1);
  const [notificationA, setNotificationA] = useState(null);
  const [notificationB, setNotificationB] = useState(null);
  const [matchWinner, setMatchWinner] = useState(null);
  const [servingTeam, setServingTeam] = useState(null);
  const [servingPlayer, setServingPlayer] = useState(null);
  const [teamACourt, setTeamACourt] = useState({ right: "", left: "" });
  const [teamBCourt, setTeamBCourt] = useState({ right: "", left: "" });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchMatch = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`http://localhost:5000/api/matches/${matchId}`);
        if (response.data) {
          setMatch(response.data);
          initializeMatchState(response.data);
          setServingTeam(response.data.servingTeam || null);
          initializeCourtAndServing(response.data);
        } else {
          setError("Match not found");
          setTimeout(() => navigate("/fixtures"), 3000);
        }
      } catch (err) {
        console.error("Failed to fetch match:", err);
        setError("Failed to load match data");
        setTimeout(() => navigate("/fixtures"), 3000);
      } finally {
        setLoading(false);
      }
    };

    const foundMatch = matches.find((m) => m.id === matchId);
    if (foundMatch) {
      setMatch(foundMatch);
      initializeMatchState(foundMatch);
      setServingTeam(foundMatch.servingTeam || null);
      initializeCourtAndServing(foundMatch);
      setLoading(false);
    } else {
      fetchMatch();
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
      setMatchWinner(winsA > winsB 
        ? (matchData.matchType.toLowerCase() === "singles" ? matchData.playerA : `${matchData.teamA.player1}/${matchData.teamA.player2}`)
        : (matchData.matchType.toLowerCase() === "singles" ? matchData.playerB : `${matchData.teamB.player1}/${matchData.teamB.player2}`));
    }
  };

  const initializeCourtAndServing = (matchData) => {
    const isDoublesOrMixed = matchData.matchType.toLowerCase() === "doubles" || matchData.matchType.toLowerCase() === "mixed";
    if (isDoublesOrMixed && matchData.teamACourt && matchData.teamBCourt) {
      setTeamACourt({ right: matchData.teamACourt.right, left: matchData.teamACourt.left });
      setTeamBCourt({ right: matchData.teamBCourt.right, left: matchData.teamBCourt.left });
      const totalPoints = getCurrentSetData(matchData).points.length;
      const isEven = totalPoints % 2 === 0;
      
      if (matchData.servingTeam === "Team A") {
        setServingPlayer(isEven ? matchData.teamACourt.right : matchData.teamACourt.left);
      } else {
        setServingPlayer(isEven ? matchData.teamBCourt.right : matchData.teamBCourt.left);
      }
    } else if (matchData.servingTeam) {
      setServingPlayer(matchData.servingTeam === "Team A" ? matchData.playerA : matchData.playerB);
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

  const checkSetStatus = (newScoreA, newScoreB) => {
    if (newScoreA >= 21 && newScoreA - newScoreB >= 2) {
      endSet(match.matchType.toLowerCase() === "singles" ? match.playerA : "Team A", newScoreA, newScoreB);
      return true;
    } else if (newScoreB >= 21 && newScoreB - newScoreA >= 2) {
      endSet(match.matchType.toLowerCase() === "singles" ? match.playerB : "Team B", newScoreA, newScoreB);
      return true;
    }

    if (newScoreA >= 30) {
      endSet(match.matchType.toLowerCase() === "singles" ? match.playerA : "Team A", newScoreA, newScoreB);
      return true;
    } else if (newScoreB >= 30) {
      endSet(match.matchType.toLowerCase() === "singles" ? match.playerB : "Team B", newScoreA, newScoreB);
      return true;
    }

    const entityA = match.matchType.toLowerCase() === "singles" ? match.playerA : `${match.teamA.player1}/${match.teamA.player2}`;
    const entityB = match.matchType.toLowerCase() === "singles" ? match.playerB : `${match.teamB.player1}/${match.teamB.player2}`;

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
      setMatchWinner(winsA > winsB 
        ? (match.matchType.toLowerCase() === "singles" ? match.playerA : `${match.teamA.player1}/${match.teamA.player2}`)
        : (match.matchType.toLowerCase() === "singles" ? match.playerB : `${match.teamB.player1}/${match.teamB.player2}`));
      updateMatchStatus("completed", updatedCompletedSets);
    } else if (currentSet < maxSets) {
      setCurrentSet(currentSet + 1);
      const nextServingTeam = setWinner === (match.matchType.toLowerCase() === "singles" ? match.playerA : "Team A") ? "Team A" : "Team B";
      setServingTeam(nextServingTeam);
      const isDoublesOrMixed = match.matchType.toLowerCase() === "doubles" || match.matchType.toLowerCase() === "mixed";
      if (isDoublesOrMixed && match.teamACourt && match.teamBCourt) {
        setTeamACourt({ right: match.teamACourt.right, left: match.teamACourt.left });
        setTeamBCourt({ right: match.teamBCourt.right, left: match.teamBCourt.left });
        setServingPlayer(nextServingTeam === "Team A" ? match.teamACourt.right : match.teamBCourt.right);
      } else {
        setServingPlayer(nextServingTeam === "Team A" ? match.playerA : match.playerB);
      }
      showNotification(`Set ${currentSet} won by ${setWinner}. Starting Set ${currentSet + 1}.`);
      updateMatchStatus("ongoing", updatedCompletedSets);
    } else {
      setMatchWinner(winsA > winsB 
        ? (match.matchType.toLowerCase() === "singles" ? match.playerA : `${match.teamA.player1}/${match.teamA.player2}`)
        : (match.matchType.toLowerCase() === "singles" ? match.playerB : `${match.teamB.player1}/${match.teamB.player2}`));
      updateMatchStatus("completed", updatedCompletedSets);
    }
  };

  const updateMatchStatus = async (status, updatedCompletedSets) => {
    try {
      const updatedMatch = { ...match, status, completedSets: updatedCompletedSets, servingTeam };
      await axios.put(`http://localhost:5000/api/matches/${matchId}`, updatedMatch);
      setMatch(updatedMatch);
      updateMatches(matches.map((m) => (m.id === matchId ? updatedMatch : m)));
      showNotification(`Match status updated to ${status}`);
    } catch (err) {
      console.error("Failed to update match status:", err);
      showNotification("Failed to update match status!");
    }
  };

  const addPoint = async (player) => {
    if (matchWinner || (match.completedSets || []).length >= match.totalSets) {
      showNotification("Match is already complete");
      return;
    }

    try {
      const pointId = `${Date.now()}-${player}`;
      const newPoint = { 
        id: pointId, 
        scorer: player, 
        timestamp: new Date().toISOString(), 
        setNumber: currentSet 
      };
      const updatedPoints = [...(match.points || []), newPoint];
      const isDoublesOrMixed = match.matchType.toLowerCase() === "doubles" || match.matchType.toLowerCase() === "mixed";
      let newServingTeam = servingTeam;
      let newServingPlayer = servingPlayer;

      const { scoreA: newScoreA, scoreB: newScoreB } = getCurrentSetData({ ...match, points: updatedPoints });
      const totalPoints = newScoreA + newScoreB;
      const isEven = totalPoints % 2 === 0;

      if (isDoublesOrMixed && match.teamACourt && match.teamBCourt) {
        if (player === "A" && servingTeam === "Team B" || player === "B" && servingTeam === "Team A") {
          // Serve switches when scoring team wasn't serving
          newServingTeam = player === "A" ? "Team A" : "Team B";
          if (newServingTeam === "Team A") {
            newServingPlayer = isEven ? teamACourt.right : teamACourt.left;
          } else {
            newServingPlayer = isEven ? teamBCourt.right : teamBCourt.left;
          }
        } else {
          // Scoring team was serving, they keep serve but switch sides
          if (servingTeam === "Team A") {
            const temp = teamACourt.right;
            setTeamACourt({ right: teamACourt.left, left: temp });
            newServingPlayer = servingPlayer;
          } else {
            const temp = teamBCourt.right;
            setTeamBCourt({ right: teamBCourt.left, left: temp });
            newServingPlayer = servingPlayer;
          }
        }
      } else {
        newServingTeam = player === "A" ? "Team A" : "Team B";
        newServingPlayer = newServingTeam === "Team A" ? match.playerA : match.playerB;
      }

      const updatedMatch = { 
        ...match, 
        points: updatedPoints,
        status: match.status === "pending" ? "ongoing" : match.status,
        servingTeam: newServingTeam
      };
      
      await axios.put(`http://localhost:5000/api/matches/${matchId}`, updatedMatch);
      setMatch(updatedMatch);
      setServingTeam(newServingTeam);
      setServingPlayer(newServingPlayer);
      updateMatches(matches.map((m) => (m.id === matchId ? updatedMatch : m)));
      
      const entityA = match.matchType.toLowerCase() === "singles" ? match.playerA : `${match.teamA.player1}/${match.teamA.player2}`;
      const entityB = match.matchType.toLowerCase() === "singles" ? match.playerB : `${match.teamB.player1}/${match.teamB.player2}`;
      if (player === "A") {
        showNotification(`${entityA} scores! ${newScoreA} - ${newScoreB} (${newServingPlayer} serving)`, "A");
      } else {
        showNotification(`${entityB} scores! ${newScoreA} - ${newScoreB} (${newServingPlayer} serving)`, "B");
      }
      checkSetStatus(newScoreA, newScoreB);
    } catch (err) {
      console.error("Failed to add point:", err);
      showNotification("Failed to update score!");
    }
  };

  const deletePoint = async (pointId) => {
    if (matchWinner) {
      showNotification("Cannot modify a completed match");
      return;
    }

    try {
      const updatedPoints = (match.points || []).filter((p) => p.id !== pointId);
      const lastPoint = updatedPoints[updatedPoints.length - 1];
      const isDoublesOrMixed = match.matchType.toLowerCase() === "doubles" || match.matchType.toLowerCase() === "mixed";
      let newServingTeam = lastPoint ? (lastPoint.scorer === "A" ? "Team A" : "Team B") : match.servingTeam;
      let newServingPlayer;

      const { scoreA, scoreB } = getCurrentSetData({ ...match, points: updatedPoints });
      const totalPoints = scoreA + scoreB;
      const isEven = totalPoints % 2 === 0;

      if (isDoublesOrMixed && match.teamACourt && match.teamBCourt) {
        if (lastPoint) {
          if (lastPoint.scorer === "A" && servingTeam === "Team A" || lastPoint.scorer === "B" && servingTeam === "Team B") {
            newServingPlayer = servingPlayer;
          } else {
            if (newServingTeam === "Team A") {
              newServingPlayer = isEven ? teamACourt.right : teamACourt.left;
            } else {
              newServingPlayer = isEven ? teamBCourt.right : teamBCourt.left;
            }
          }
        } else {
          newServingTeam = match.servingTeam;
          newServingPlayer = newServingTeam === "Team A" ? match.teamACourt.right : match.teamBCourt.right;
          setTeamACourt({ right: match.teamACourt.right, left: match.teamACourt.left });
          setTeamBCourt({ right: match.teamBCourt.right, left: match.teamBCourt.left });
        }
      } else {
        newServingPlayer = newServingTeam === "Team A" ? match.playerA : match.playerB;
      }

      const updatedMatch = { ...match, points: updatedPoints, servingTeam: newServingTeam };
      await axios.put(`http://localhost:5000/api/matches/${matchId}`, updatedMatch);
      setMatch(updatedMatch);
      setServingTeam(newServingTeam);
      setServingPlayer(newServingPlayer);
      updateMatches(matches.map((m) => (m.id === matchId ? updatedMatch : m)));
      showNotification(`Point deleted. Score: ${scoreA} - ${scoreB} (${newServingPlayer} serving)`);
    } catch (err) {
      console.error("Failed to delete point:", err);
      showNotification("Failed to delete point!");
    }
  };

  const resetMatch = async () => {
    try {
      const resetMatch = { 
        ...match, 
        points: [], 
        completedSets: [], 
        status: "pending",
        servingTeam: match.servingTeam
      };
      await axios.put(`http://localhost:5000/api/matches/${matchId}`, resetMatch);
      setMatch(resetMatch);
      setCurrentSet(1);
      setMatchWinner(null);
      setServingTeam(resetMatch.servingTeam);
      setTeamACourt({ right: match.teamACourt?.right || "", left: match.teamACourt?.left || "" });
      setTeamBCourt({ right: match.teamBCourt?.right || "", left: match.teamBCourt?.left || "" });
      setServingPlayer(resetMatch.servingTeam === "Team A" ? resetMatch.teamACourt?.right : resetMatch.teamBCourt?.right);
      updateMatches(matches.map((m) => (m.id === matchId ? resetMatch : m)));
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
    <div className="scorekeeper-container">
      <div className="match-header">
        <h2 className="match-title">Set {currentSet} of {match.totalSets}</h2>
        <div className="match-players">{renderPlayers()}</div>
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
          {isDoublesOrMixed && match.teamACourt && match.teamBCourt ? (
            <>
              <div className="doubles-player">
                <p className="court-position">Right: {teamACourt.right || "N/A"}</p>
                {servingPlayer === teamACourt.right && <p className="serve-status">👉 Serving</p>}
              </div>
              <div className="doubles-player">
                <p className="court-position">Left: {teamACourt.left || "N/A"}</p>
                {servingPlayer === teamACourt.left && <p className="serve-status">👉 Serving</p>}
              </div>
            </>
          ) : (
            <>
              {servingTeam && (
                <p className="serve-status">
                  {servingTeam === "Team A" ? "👉 Serving" : "Receiving"}
                </p>
              )}
              <h3 className="player-name">{entityA}</h3>
            </>
          )}
          {notificationA && <div className="green-notification">{notificationA}</div>}
          <div className="score-box">{scoreA}</div>
          {scoreA >= 20 && scoreA > scoreB && scoreA - scoreB === 1 && (
            <p className="advantage-text">Advantage {entityA}</p>
          )}
          {scoreA >= 20 && scoreA === scoreB && (
            <p className="deuce-text">Deuce</p>
          )}
          <button 
            className="score-btn player-a" 
            onClick={() => addPoint("A")}
            disabled={matchWinner !== null}
          >
            +1 for {entityA}
          </button>
        </div>
        <div className="vs-section">
          <span className="vs-text">VS</span>
        </div>
        <div className="player-section">
          {isDoublesOrMixed && match.teamACourt && match.teamBCourt ? (
            <>
              <div className="doubles-player">
                <p className="court-position">Right: {teamBCourt.right || "N/A"}</p>
                {servingPlayer === teamBCourt.right && <p className="serve-status">👉 Serving</p>}
              </div>
              <div className="doubles-player">
                <p className="court-position">Left: {teamBCourt.left || "N/A"}</p>
                {servingPlayer === teamBCourt.left && <p className="serve-status">👉 Serving</p>}
              </div>
            </>
          ) : (
            <>
              {servingTeam && (
                <p className="serve-status">
                  {servingTeam === "Team B" ? "👉 Serving" : "Receiving"}
                </p>
              )}
              <h3 className="player-name">{entityB}</h3>
            </>
          )}
          {notificationB && <div className="green-notification">{notificationB}</div>}
          <div className="score-box">{scoreB}</div>
          {scoreB >= 20 && scoreB > scoreA && scoreB - scoreA === 1 && (
            <p className="advantage-text">Advantage {entityB}</p>
          )}
          {scoreB >= 20 && scoreB === scoreA && (
            <p className="deuce-text">Deuce</p>
          )}
          <button 
            className="score-btn player-b" 
            onClick={() => addPoint("B")}
            disabled={matchWinner !== null}
          >
            +1 for {entityB}
          </button>
        </div>
      </div>

      <div className="points-history">
        <h3>Points History (Set {currentSet})</h3>
        {points.length === 0 ? (
          <p className="no-points">No points recorded yet.</p>
        ) : (
          <ul className="points-list">
            {pointsWithScores.map((point) => (
              <li key={point.id} className="point-item">
                <span className={`point-scorer ${point.scorer === "A" ? "player-a" : "player-b"}`}>
                  {point.scorer === "A" ? entityA : entityB} scored at{" "}
                  {new Date(point.timestamp).toLocaleTimeString()}, {point.scoreA} - {point.scoreB}
                </span>
                <button 
                  className="delete-btn" 
                  onClick={() => deletePoint(point.id)}
                  disabled={matchWinner !== null}
                >
                  Delete
                </button>
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
  );
};

export default ScorekeeperPage;