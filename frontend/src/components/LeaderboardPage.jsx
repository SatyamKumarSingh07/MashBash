import React, { useState, useEffect } from "react";
import { FaTrophy } from "react-icons/fa";

const LeaderboardPage = ({ matches }) => {
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedPlayer, setExpandedPlayer] = useState(null);

  useEffect(() => {
    calculateLeaderboard();
  }, [matches]);

  const calculateLeaderboard = () => {
    const playerStats = {};

    matches.forEach((match) => {
      if (match.status !== "completed" || !match.completedSets) return;

      const isSingles = match.matchType.toLowerCase() === "singles";
      const entityA = isSingles ? match.playerA : `${match.teamA.player1}/${match.teamA.player2}`;
      const entityB = isSingles ? match.playerB : `${match.teamB.player1}/${match.teamB.player2}`;

      if (!playerStats[entityA]) {
        playerStats[entityA] = { wins: 0, losses: 0, games: 0, lastWinDate: null, matchType: match.matchType, wonMatches: [] };
      }
      if (!playerStats[entityB]) {
        playerStats[entityB] = { wins: 0, losses: 0, games: 0, lastWinDate: null, matchType: match.matchType, wonMatches: [] };
      }

      const winsA = match.completedSets.reduce(
        (count, set) => count + (set.winner === (isSingles ? match.playerA : "Team A") ? 1 : 0),
        0
      );
      const winsB = match.completedSets.reduce(
        (count, set) => count + (set.winner === (isSingles ? match.playerB : "Team B") ? 1 : 0),
        0
      );

      const winner = winsA > winsB ? entityA : entityB;
      const loser = winsA > winsB ? entityB : entityA;
      const setPoints = match.completedSets.map(set => `${set.scoreA}-${set.scoreB}`).join(", ");

      playerStats[winner].wins += 1;
      playerStats[winner].games += 1;
      playerStats[winner].lastWinDate = match.date;
      playerStats[winner].wonMatches.push({ opponent: loser, setPoints, date: match.date });
      playerStats[loser].losses += 1;
      playerStats[loser].games += 1;
    });

    const leaderboard = Object.entries(playerStats).map(([name, stats]) => ({
      name,
      wins: stats.wins,
      games: stats.games,
      winPercentage: ((stats.wins / stats.games) * 100).toFixed(1),
      lossPercentage: (((stats.games - stats.wins) / stats.games) * 100).toFixed(1),
      lastWinDate: stats.lastWinDate ? new Date(stats.lastWinDate).toLocaleDateString() : "N/A",
      matchType: stats.matchType,
      wonMatches: stats.wonMatches
    }));

    leaderboard.sort((a, b) => b.wins - a.wins);
    setLeaderboardData(leaderboard);
    setLoading(false);
  };

  const getTrophyIcon = (index) => {
    if (index < 3) {
      return <FaTrophy className={`trophy-icon top-${index + 1}`} />;
    }
    return "";
  };

  const togglePlayerDetails = (playerName) => {
    setExpandedPlayer(expandedPlayer === playerName ? null : playerName);
  };

  if (loading) return <div className="loading">Calculating leaderboard...</div>;

  return (
    <div className="leaderboard-container">
      <h2 className="leaderboard-title">Badminton Leaderboard</h2>
      {leaderboardData.length === 0 ? (
        <p className="no-data">No completed matches yet</p>
      ) : (
        <div className="leaderboard-table">
          <div className="table-header">
            <div className="header-item">Rank</div>
            <div className="header-item">Player/Team</div>
            <div className="header-item">Wins</div>
            <div className="header-item">Games</div>
            <div className="header-item">Win %</div>
            <div className="header-item">Loss %</div>
            <div className="header-item">Last Win</div>
            <div className="header-item">Match Type</div>
          </div>
          {leaderboardData.map((player, index) => (
            <React.Fragment key={player.name}>
              <div className={`table-row ${index < 3 ? `top-${index + 1}` : ''}`} onClick={() => togglePlayerDetails(player.name)}>
                <div className="row-item">
                  {getTrophyIcon(index)} {index + 1}
                </div>
                <div className="row-item clickable">{player.name}</div>
                <div className="row-item">{player.wins}</div>
                <div className="row-item">{player.games}</div>
                <div className="row-item">{player.winPercentage}%</div>
                <div className="row-item">{player.lossPercentage}%</div>
                <div className="row-item">{player.lastWinDate}</div>
                <div className="row-item">{player.matchType}</div>
              </div>
              {expandedPlayer === player.name && (
                <div className="match-details">
                  <h3>Won Matches</h3>
                  {player.wonMatches.length === 0 ? (
                    <p>No won matches recorded</p>
                  ) : (
                    <div className="match-list">
                      {player.wonMatches.map((match, idx) => (
                        <div key={idx} className="match-item">
                          <p><strong>Opponent:</strong> {match.opponent}</p>
                          <p><strong>Set Points:</strong> {match.setPoints}</p>
                          <p><strong>Date:</strong> {new Date(match.date).toLocaleDateString()}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
      )}
    </div>
  );
};

export default LeaderboardPage;