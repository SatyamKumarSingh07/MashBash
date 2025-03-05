import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { fetchPublicMatch } from "../utils/api";
import "../App.css";

const ScoreViewerPage = () => {
  const { matchId } = useParams();
  const [match, setMatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showWinner, setShowWinner] = useState(false); // State for winner notification

  useEffect(() => {
    const fetchMatchData = async () => {
      try {
        setLoading(true);
        const response = await fetchPublicMatch(matchId);
        if (response.data) {
          setMatch(response.data);
          // Check if the match is completed and set winner notification
          if (response.data.status === "completed" && response.data.completedSets?.length > 0) {
            setShowWinner(true);
            // Optionally hide the winner notification after a few seconds (e.g., 5 seconds)
            setTimeout(() => setShowWinner(false), 5000);
          } else {
            setShowWinner(false);
          }
        } else {
          setError("Match not found");
        }
      } catch (err) {
        console.error("Failed to fetch match data:", err);
        setError("Failed to load match data");
      } finally {
        setLoading(false);
      }
    };

    fetchMatchData();
    const interval = setInterval(fetchMatchData, 5000); // Poll every 5 seconds for updates
    return () => clearInterval(interval); // Cleanup on unmount
  }, [matchId]);

  if (loading) return <div className="loading">Loading Scores...</div>;
  if (error) return <div className="error">{error}</div>;
  if (!match) return <div className="not-found">Match not found</div>;

  const { scoreA, scoreB, points, completedSets, currentSet } = getCurrentSetData(match);
  const isDoublesOrMixed = match.matchType.toLowerCase() === "doubles" || match.matchType.toLowerCase() === "mixed";
  const entityA = isDoublesOrMixed ? `${match.teamA.player1}/${match.teamA.player2}` : match.playerA;
  const entityB = isDoublesOrMixed ? `${match.teamB.player1}/${match.teamB.player2}` : match.playerB;

  // Determine the winner for completed matches
  let winner = null;
  if (match.status === "completed" && completedSets.length > 0) {
    const winsA = completedSets.reduce(
      (count, set) => count + (set.winner === (isDoublesOrMixed ? "Team A" : entityA) ? 1 : 0),
      0
    );
    const winsB = completedSets.reduce(
      (count, set) => count + (set.winner === (isDoublesOrMixed ? "Team B" : entityB) ? 1 : 0),
      0
    );
    winner = winsA > winsB ? entityA : entityB;
  }

  return (
    <div className="score-viewer-container">
      <h2>{match.matchType} Match</h2>
      <div className="match-info">
        <p>{entityA} vs {entityB}</p>
        {match.status === "completed" ? (
          <p>Final Set of {match.totalSets}</p>
        ) : (
          <p>Set {currentSet} of {match.totalSets}</p>
        )}
        <p>Venue: {match.venue}</p>
        <p>Date: {new Date(match.date).toLocaleDateString()}</p>
      </div>

      <div className="score-display">
        <div className="team-score">
          <h3>{entityA}</h3>
          <p className="score">{scoreA}</p>
        </div>
        <div className="vs">VS</div>
        <div className="team-score">
          <h3>{entityB}</h3>
          <p className="score">{scoreB}</p>
        </div>
      </div>

      {showWinner && winner && (
        <div className="winner-notification">
          <p>Congratulations! Winner is {winner}</p>
        </div>
      )}

      <div className="sets-summary">
        <h3>Completed Sets</h3>
        {completedSets.length === 0 ? (
          <p>No sets completed yet.</p>
        ) : (
          completedSets.map((set, index) => (
            <div key={`${match.id}-set-${set.setNumber}-${index}`} className="set-info">
              <p>Set {set.setNumber}: {set.scoreA} - {set.scoreB}</p>
              <p>Winner: {set.winner}</p>
            </div>
          ))
        )}
      </div>

      {match.status !== "completed" && (
        <div className="points-history">
          <h3>Points History (Current Set)</h3>
          {points.length === 0 ? (
            <p>No points recorded yet.</p>
          ) : (
            <ul className="points-list">
              {points.map((point, index) => (
                <li key={`${match.id}-point-${point.id}-${index}`} className="point-item">
                  {point.scorer === "A" ? entityA : entityB} scored at{" "}
                  {new Date(point.timestamp).toLocaleTimeString()}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

const getCurrentSetData = (match) => {
  const completedSets = Array.isArray(match.completedSets) ? match.completedSets : [];
  const points = Array.isArray(match.points) ? match.points : [];
  let currentSet, scoreA, scoreB, currentSetPoints;

  if (match.status === "completed" && completedSets.length > 0) {
    // For completed matches, use the last completed set
    const lastSet = completedSets[completedSets.length - 1];
    currentSet = lastSet.setNumber;
    scoreA = lastSet.scoreA;
    scoreB = lastSet.scoreB;
    currentSetPoints = points.filter((p) => p.setNumber === currentSet);
  } else {
    // For ongoing or pending matches, calculate the current set
    currentSet = completedSets.length + 1;
    currentSetPoints = points.filter((p) => p.setNumber === currentSet);
    scoreA = currentSetPoints.reduce((sum, p) => sum + (p.scorer === "A" ? 1 : 0), 0);
    scoreB = currentSetPoints.reduce((sum, p) => sum + (p.scorer === "B" ? 1 : 0), 0);
  }

  return { completedSets, points: currentSetPoints, scoreA, scoreB, currentSet };
};

export default ScoreViewerPage;