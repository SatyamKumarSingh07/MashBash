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
      const setPoints = match.completedSets.map((set) => `${set.scoreA}-${set.scoreB}`).join(", ");

      playerStats[winner].wins += 1;
      playerStats[winner].games += 1;
      playerStats[winner].lastWinDate = match.date;
      playerStats[winner].wonMatches.push({
        opponent: loser,
        setPoints,
        venue: match.venue || "Unknown Venue",
        date: match.date,
      });
      playerStats[loser].losses += 1;
      playerStats[loser].games += 1;
    });

    const leaderboard = Object.entries(playerStats)
      .map(([name, stats]) => ({
        name,
        wins: stats.wins,
        games: stats.games,
        winPercentage: ((stats.wins / stats.games) * 100).toFixed(1),
        lossPercentage: (((stats.games - stats.wins) / stats.games) * 100).toFixed(1),
        lastWinDate: stats.lastWinDate ? new Date(stats.lastWinDate).toLocaleDateString() : "N/A",
        matchType: stats.matchType,
        wonMatches: stats.wonMatches,
      }))
      .sort((a, b) => b.wins - a.wins);

    setLeaderboardData(leaderboard);
    setLoading(false);
  };

  const getTrophyIcon = (index) => {
    const colors = ["text-yellow-500", "text-gray-400", "text-yellow-700"]; // Gold, Silver, Bronze
    if (index < 3) {
      return <FaTrophy className={`inline-block mr-2 ${colors[index]} text-xl`} />;
    }
    return null;
  };

  const togglePlayerDetails = (playerName) => {
    setExpandedPlayer(expandedPlayer === playerName ? null : playerName);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-100 to-pink-100 flex items-center justify-center">
        <div className="text-xl text-indigo-600 animate-pulse font-medium">Calculating leaderboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-100 to-pink-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <header className="mb-10 bg-white/80 backdrop-blur-md rounded-xl shadow-lg p-6 animate-fade-in">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 tracking-tight text-center">
            Badminton Leaderboard
          </h1>
        </header>

        {/* Leaderboard Content */}
        {leaderboardData.length === 0 ? (
          <div className="text-center py-12 text-gray-600 italic text-lg bg-white/80 backdrop-blur-md rounded-xl shadow-lg">
            No completed matches yet
          </div>
        ) : (
          <div className="bg-white/90 backdrop-blur-md rounded-xl shadow-xl p-6 animate-fade-in">
            {/* Table Header */}
            <div className="grid grid-cols-8 gap-4 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-t-lg font-semibold text-indigo-800 text-sm sm:text-base border-b-2 border-indigo-200">
              <div className="col-span-1">Rank</div>
              <div className="col-span-2">Player/Team</div>
              <div className="col-span-1">Wins</div>
              <div className="col-span-1">Games</div>
              <div className="col-span-1">Win %</div>
              <div className="col-span-1">Loss %</div>
              <div className="col-span-1">Last Win</div>
            </div>

            {/* Table Rows */}
            {leaderboardData.map((player, index) => (
              <React.Fragment key={player.name}>
                <div
                  className={`grid grid-cols-8 gap-4 p-4 items-center text-gray-700 hover:bg-indigo-50 transition-all duration-200 cursor-pointer border-b border-gray-200 ${
                    index < 3 ? `bg-gradient-to-r ${index === 0 ? "from-yellow-50" : index === 1 ? "from-gray-50" : "from-yellow-100"} to-transparent` : ""
                  }`}
                  onClick={() => togglePlayerDetails(player.name)}
                >
                  <div className="col-span-1 flex items-center">
                    {getTrophyIcon(index)}
                    <span className="font-medium">{index + 1}</span>
                  </div>
                  <div className="col-span-2 font-semibold text-indigo-700 truncate">{player.name}</div>
                  <div className="col-span-1">{player.wins}</div>
                  <div className="col-span-1">{player.games}</div>
                  <div className="col-span-1 text-green-600">{player.winPercentage}%</div>
                  <div className="col-span-1 text-red-600">{player.lossPercentage}%</div>
                  <div className="col-span-1 text-sm">{player.lastWinDate}</div>
                </div>

                {/* Expanded Match Details */}
                {expandedPlayer === player.name && (
                  <div className="p-4 bg-gray-50 rounded-b-lg shadow-inner animate-slide-in">
                    <h3 className="text-lg font-semibold text-indigo-800 mb-3">Won Matches</h3>
                    {player.wonMatches.length === 0 ? (
                      <p className="text-gray-600 italic">No won matches recorded</p>
                    ) : (
                      <div className="space-y-4">
                        {player.wonMatches.map((match, idx) => (
                          <div
                            key={idx}
                            className="p-4 bg-white/80 backdrop-blur-sm rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
                          >
                            <p className="text-sm">
                              <span className="font-medium text-indigo-700">Opponent:</span> {match.opponent}
                            </p>
                            <p className="text-sm">
                              <span className="font-medium text-indigo-700">Set Points:</span> {match.setPoints}
                            </p>
                            <p className="text-sm">
                              <span className="font-medium text-indigo-700">Venue:</span> {match.venue}
                            </p>
                            <p className="text-sm">
                              <span className="font-medium text-indigo-700">Date:</span>{" "}
                              {new Date(match.date).toLocaleDateString()}
                            </p>
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

      {/* Global Styles for Animations */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideIn {
          from { transform: translateY(-20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .animate-fade-in {
          animation: fadeIn 0.6s ease-out;
        }
        .animate-slide-in {
          animation: slideIn 0.5s ease-out;
        }
      `}</style>
    </div>
  );
};

export default LeaderboardPage;