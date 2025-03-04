import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";

const ScoreViewerPage = () => {
  const { matchId } = useParams();
  const [match, setMatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchMatchData = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`http://localhost:5000/api/matches/${matchId}`);
        if (response.data) {
          setMatch(response.data);
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

    // Polling every 5 seconds for real-time updates
    const interval = setInterval(fetchMatchData, 5000);
    return () => clearInterval(interval); // Cleanup on unmount
  }, [matchId]);

  if (loading) return <div className="loading">Loading Scores...</div>;
  if (error) return <div className="error">{error}</div>;
  if (!match) return <div className="not-found">Match not found</div>;

  const { scoreA, scoreB, points, completedSets } = getCurrentSetData(match);
  const isDoublesOrMixed = match.matchType.toLowerCase() === "doubles" || match.matchType.toLowerCase() === "mixed";
  const entityA = isDoublesOrMixed ? `${match.teamA.player1}/${match.teamA.player2}` : match.playerA;
  const entityB = isDoublesOrMixed ? `${match.teamB.player1}/${match.teamB.player2}` : match.playerB;

  return (
    <div className="score-viewer-container">
      <h2>{match.matchType} Match</h2>
      <div className="match-info">
        <p>{entityA} vs {entityB}</p>
        <p>Set {completedSets.length + 1} of {match.totalSets}</p>
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

      <div className="sets-summary">
        <h3>Completed Sets</h3>
        {completedSets.length === 0 ? (
          <p>No sets completed yet.</p>
        ) : (
          completedSets.map((set) => (
            <div key={set.setNumber} className="set-info">
              <p>Set {set.setNumber}: {set.scoreA} - {set.scoreB}</p>
              <p>Winner: {set.winner}</p>
            </div>
          ))
        )}
      </div>

      <div className="points-history">
        <h3>Points History (Current Set)</h3>
        {points.length === 0 ? (
          <p>No points recorded yet.</p>
        ) : (
          <ul className="points-list">
            {points.map((point) => (
              <li key={point.id} className="point-item">
                {point.scorer === "A" ? entityA : entityB} scored at{" "}
                {new Date(point.timestamp).toLocaleTimeString()}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

const getCurrentSetData = (match) => {
  const completedSets = Array.isArray(match.completedSets) ? match.completedSets : [];
  const points = Array.isArray(match.points) ? match.points : [];
  const currentSet = completedSets.length + 1;
  const currentSetPoints = points.filter((p) => p.setNumber === currentSet);
  const scoreA = currentSetPoints.reduce((sum, p) => sum + (p.scorer === "A" ? 1 : 0), 0);
  const scoreB = currentSetPoints.reduce((sum, p) => sum + (p.scorer === "B" ? 1 : 0), 0);
  return { completedSets, points: currentSetPoints, scoreA, scoreB };
};

export default ScoreViewerPage;