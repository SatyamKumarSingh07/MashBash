import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

const MatchSummaryPage = ({ matches }) => {
  const { matchId } = useParams();
  const navigate = useNavigate();
  const [match, setMatch] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const foundMatch = matches.find((m) => m.id === matchId);
    
    if (foundMatch) {
      setMatch(foundMatch);
      setLoading(false);
    } else {
      const fetchMatch = async () => {
        try {
          const response = await axios.get(`http://localhost:5000/api/matches/${matchId}`);
          setMatch(response.data);
        } catch (err) {
          console.error("Failed to fetch match:", err);
          navigate("/fixtures");
        } finally {
          setLoading(false);
        }
      };
      fetchMatch();
    }
  }, [matchId, matches, navigate]);

  if (loading) return <div className="loading">Loading Match Summary...</div>;
  if (!match) return <div className="error">Match not found</div>;

  const completedSets = Array.isArray(match.completedSets) ? match.completedSets : [];
  const winsA = completedSets.reduce((count, s) => count + (s.winner === match.playerA ? 1 : 0), 0);
  const winsB = completedSets.reduce((count, s) => count + (s.winner === match.playerB ? 1 : 0), 0);
  const matchWinner = winsA > winsB ? match.playerA : winsB > winsA ? match.playerB : "Tie";

  // Sort points chronologically by timestamp
  const sortedPoints = [...(match.points || [])].sort((a, b) => 
    new Date(a.timestamp) - new Date(b.timestamp)
  );

  // Group points by set and calculate scores for each point
  const pointsBySet = sortedPoints.reduce((acc, point) => {
    const setNumber = point.setNumber || 1;
    if (!acc[setNumber]) {
      acc[setNumber] = [];
    }
    acc[setNumber].push(point);
    return acc;
  }, {});

  // Calculate scores for each point within its set
  const pointsWithScoresBySet = Object.keys(pointsBySet).reduce((acc, setNumber) => {
    acc[setNumber] = pointsBySet[setNumber].map((point, index) => {
      const priorPoints = pointsBySet[setNumber].slice(0, index + 1);
      const scoreA = priorPoints.reduce((sum, p) => sum + (p.scorer === "A" ? 1 : 0), 0);
      const scoreB = priorPoints.reduce((sum, p) => sum + (p.scorer === "B" ? 1 : 0), 0);
      return { ...point, scoreA, scoreB };
    });
    return acc;
  }, {});

  return (
    <div className="summary-container">
      <div className="summary-header">
        <h2>
          <span className="player-name">{match.playerA}</span> vs{" "}
          <span className="player-name">{match.playerB}</span>
        </h2>
        <div className="score-display">
          <span className="score">{winsA}</span> - <span className="score">{winsB}</span>
          <p>(Sets Won)</p>
        </div>
        <div className="winner-announcement">
          {match.status !== "completed" ? 
            "Match in Progress" : 
            matchWinner === "Tie" ? "Match Ended in a Tie!" : `${matchWinner} Wins!`}
        </div>
      </div>

      <div className="sets-summary">
        <h3>Set Results</h3>
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

      <div className="summary-details">
        <div className="detail-card">
          <span className="detail-label">Total Sets:</span>
          <span className="detail-value">{match.totalSets}</span>
        </div>
        <div className="detail-card">
          <span className="detail-label">Venue:</span>
          <span className="detail-value">{match.venue}</span>
        </div>
        <div className="detail-card">
          <span className="detail-label">Date:</span>
          <span className="detail-value">{new Date(match.date).toLocaleDateString()}</span>
        </div>
        <div className="detail-card">
          <span className="detail-label">Status:</span>
          <span className={`detail-value status ${match.status.toLowerCase()}`}>
            {match.status}
          </span>
        </div>
      </div>

      <div className="points-history">
        <h3>Point History</h3>
        {sortedPoints.length === 0 ? (
          <p className="no-points">No points recorded for this match.</p>
        ) : (
          <div>
            {Object.keys(pointsWithScoresBySet).sort((a, b) => Number(a) - Number(b)).map(setNumber => (
              <div key={`set-${setNumber}`} className="set-points">
                <h4>Set {setNumber}</h4>
                <ul className="points-list">
                  {pointsWithScoresBySet[setNumber].map((point, index) => (
                    <li key={point.id || index} className="point-item">
                      <span className="point-number">{index + 1}.</span>
                      <span className={`point-scorer ${point.scorer === "A" ? "player-a" : "player-b"}`}>
                        {point.scorer === "A" ? match.playerA : match.playerB}
                      </span>
                      <span> scored at </span>
                      <span className="point-time">{new Date(point.timestamp).toLocaleTimeString()}</span>
                      <span> {point.scoreA} - {point.scoreB}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="navigation-buttons">
        <button className="back-btn" onClick={() => navigate("/fixtures")}>
          Back to Fixtures
        </button>
        {match.status === "completed" && (
          <button className="scorekeeper-btn" onClick={() => navigate(`/scorekeeper/${matchId}`)}>
            View Scorekeeper
          </button>
        )}
      </div>
    </div>
  );
};

export default MatchSummaryPage;