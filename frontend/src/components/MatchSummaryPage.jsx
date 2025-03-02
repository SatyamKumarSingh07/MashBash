import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import * as XLSX from "xlsx"; // Import SheetJS

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
  const winsA = completedSets.reduce(
    (count, s) => count + (s.winner === (match.matchType.toLowerCase() === "singles" ? match.playerA : "Team A") ? 1 : 0),
    0
  );
  const winsB = completedSets.reduce(
    (count, s) => count + (s.winner === (match.matchType.toLowerCase() === "singles" ? match.playerB : "Team B") ? 1 : 0),
    0
  );
  const matchWinner = winsA > winsB 
    ? (match.matchType.toLowerCase() === "singles" ? match.playerA : `${match.teamA.player1}/${match.teamA.player2}`) 
    : winsB > winsA 
    ? (match.matchType.toLowerCase() === "singles" ? match.playerB : `${match.teamB.player1}/${match.teamB.player2}`) 
    : "Tie";

  const sortedPoints = [...(match.points || [])].sort((a, b) => 
    new Date(a.timestamp) - new Date(b.timestamp)
  );

  const pointsBySet = sortedPoints.reduce((acc, point) => {
    const setNumber = point.setNumber || 1;
    if (!acc[setNumber]) {
      acc[setNumber] = [];
    }
    acc[setNumber].push(point);
    return acc;
  }, {});

  const pointsWithScoresBySet = Object.keys(pointsBySet).reduce((acc, setNumber) => {
    acc[setNumber] = pointsBySet[setNumber].map((point, index) => {
      const priorPoints = pointsBySet[setNumber].slice(0, index + 1);
      const scoreA = priorPoints.reduce((sum, p) => sum + (p.scorer === "A" ? 1 : 0), 0);
      const scoreB = priorPoints.reduce((sum, p) => sum + (p.scorer === "B" ? 1 : 0), 0);
      return { ...point, scoreA, scoreB };
    });
    return acc;
  }, {});

  const renderPlayers = () => {
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

  const entityA = match.matchType.toLowerCase() === "singles" ? match.playerA : `${match.teamA.player1}/${match.teamA.player2}`;
  const entityB = match.matchType.toLowerCase() === "singles" ? match.playerB : `${match.teamB.player1}/${match.teamB.player2}`;

  const renderWinnerAnnouncement = () => {
    if (match.status !== "completed") {
      return "Match in Progress";
    } else if (matchWinner === "Tie") {
      return "Match Ended in a Tie!";
    } else {
      return `${matchWinner} Wins!`;
    }
  };

  // Function to export match summary to Excel
  const exportToExcel = () => {
    const data = [
      ["Match Summary"],
      [],
      ["Match Details"],
      ["Field", "Value"],
      ["Players/Teams", renderPlayers()],
      ["Match Type", match.matchType],
      ["Total Sets", match.totalSets],
      ["Venue", match.venue],
      ["Date", new Date(match.date).toLocaleDateString()],
      ["Status", match.status],
      ["Match Winner", matchWinner],
      [],
      ["Set Results"],
      ["Set Number", "Score (A-B)", "Winner"],
      ...completedSets.map(set => [set.setNumber, `${set.scoreA}-${set.scoreB}`, set.winner]),
      [],
      ["Point History"],
      ["Set Number", "Point Number", "Scorer", "Timestamp", "Score (A-B)"],
      ...Object.keys(pointsWithScoresBySet).flatMap(setNumber => 
        pointsWithScoresBySet[setNumber].map((point, index) => [
          setNumber,
          index + 1,
          point.scorer === "A" ? entityA : entityB,
          new Date(point.timestamp).toLocaleTimeString(),
          `${point.scoreA}-${point.scoreB}`
        ])
      )
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "MatchSummary");
    
    // Generate and download the Excel file
    XLSX.writeFile(workbook, `Match_Summary_${matchId}.xlsx`);
  };

  return (
    <div className="summary-container">
      <div className="summary-header">
        <h2>{renderPlayers()}</h2>
        <div className="score-display">
          <span className="score">{winsA}</span> - <span className="score">{winsB}</span>
          <p>(Sets Won)</p>
        </div>
        <div className="winner-announcement">
          {renderWinnerAnnouncement()}
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
          <span className="detail-label">Match Type:</span>
          <span className="detail-value">{match.matchType}</span>
        </div>
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
                        {point.scorer === "A" ? entityA : entityB}
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
        <button className="export-btn" onClick={exportToExcel}>
          Export to Excel
        </button>
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