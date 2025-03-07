// src/components/MatchSummaryPage.jsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";
import { fetchMatch } from "../utils/api";

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
      const fetchMatchData = async () => {
        try {
          const response = await fetchMatch(matchId);
          setMatch(response.data);
        } catch (err) {
          console.error("Failed to fetch match:", err);
          navigate("/fixtures");
        } finally {
          setLoading(false);
        }
      };
      fetchMatchData();
    }
  }, [matchId, matches, navigate]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-500">
      <div className="text-2xl font-semibold text-gray-600 animate-pulse">Loading Match Summary...</div>
    </div>
  );
  if (!match) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-500">
      <div className="text-xl text-red-600 bg-red-100 p-4 rounded-lg">Match not found</div>
    </div>
  );

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
        <div className="flex flex-col sm:flex-row items-center gap-2 bg-gradient-to-r from-red-200 to-pink-200">
          <span className="font-bold uppercase text-green-700 ">{match.playerA}</span>
          <span className="text-gray-900">vs</span>
          <span className="font-bold uppercase text-red-800">{match.playerB}</span>
        </div>
      );
    } else if (match.matchType.toLowerCase() === "mixed" || match.matchType.toLowerCase() === "doubles") {
      return (
        <div className="flex flex-col sm:flex-row items-center gap-2">
          <span className="font-semibold text-indigo-600">{match.teamA.player1} / {match.teamA.player2}</span>
          <span className="text-gray-500">vs</span>
          <span className="font-semibold text-indigo-600">{match.teamB.player1} / {match.teamB.player2}</span>
        </div>
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

  const exportToExcel = () => {
    const data = [
      ["Match Summary"],
      [],
      ["Match Details"],
      ["Field", "Value"],
      ["Players/Teams", `${entityA} vs ${entityB}`],
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
    XLSX.writeFile(workbook, `Match_Summary_${matchId}.xlsx`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-r from-cyan-400 via-pink-500 bg-cyan-500 py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Summary Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">{renderPlayers()}</h2>
            <div className="flex items-center justify-center gap-4 mb-4">
              <span className="text-4xl font-bold text-indigo-600">{winsA}</span>
              <span className="text-2xl text-gray-500">-</span>
              <span className="text-4xl font-bold text-indigo-600">{winsB}</span>
            </div>
            <p className="text-sm text-gray-500 mb-2">(Sets Won)</p>
            <div className={`text-lg font-semibold ${
              match.status !== "completed" ? "text-yellow-600" : 
              matchWinner === "Tie" ? "text-gray-600" : "text-green-600"
            }`}>
              {renderWinnerAnnouncement()}
            </div>
          </div>
        </div>

        {/* Match Details */}
        <div className="bg-gradient-to-br from-orange-300 via-cyan-100 to-pink-300 rounded-lg shadow-md p-6 mb-6">
          <h3 className="text-xl font-semibold uppercase text-gray-800 mb-4">Match Details</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col">
              <span className="text-sm font-bold text-red-700">Match Type</span>
              <span className="text-gray-900 font-bold uppercase">{match.matchType}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold text-red-700">Total Sets</span>
              <span className="text-gray-900 font-bold uppercase">{match.totalSets}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold text-red-700">Venue</span>
              <span className="text-gray-900 font-bold uppercase">{match.venue}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold text-red-700">Date</span>
              <span className="text-gray-900 font-bold uppercase">{new Date(match.date).toLocaleDateString()}</span>
            </div>
            <div className="flex flex-col uppercase">
              <span className="text-sm font-bold text-red-700 uppercase">Status</span>
              <span className={`font-medium ${
                match.status === "completed" ? "text-green-600" : 
                match.status === "ongoing" ? "text-yellow-900" : "text-gray-900"
              }`}>
                {match.status}
              </span>
            </div>
          </div>
        </div>

        {/* Set Results */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Set Results</h3>
          {completedSets.length === 0 ? (
            <p className="text-gray-500">No sets completed yet.</p>
          ) : (
            <div className="space-y-4">
              {completedSets.map((set) => (
                <div key={set.setNumber} className="bg-gray-500 p-3 rounded-md">
                  <p className="text-gray-700">Set {set.setNumber}: {set.scoreA} - {set.scoreB}</p>
                  <p className="text-sm text-green-600">Winner: {set.winner}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Points History */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Point History</h3>
          {sortedPoints.length === 0 ? (
            <p className="text-gray-900">No points recorded for this match.</p>
          ) : (
            <div className="space-y-6">
              {Object.keys(pointsWithScoresBySet).sort((a, b) => Number(a) - Number(b)).map(setNumber => (
                <div key={`set-${setNumber}`}>
                  <h4 className="text-lg font-medium text-gray-900 mb-2">Set {setNumber}</h4>
                  <div className="max-h-64 overflow-y-auto">
                    {pointsWithScoresBySet[setNumber].map((point, index) => (
                      <div
                        key={point.id || index}
                        className={`flex justify-between items-center p-2 border-b ${
                          point.scorer === "A" ? "bg-indigo-200" : "bg-purple-200"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-600">{index + 1}.</span>
                          <span className={`font-medium ${
                            point.scorer === "A" ? "text-indigo-600" : "text-purple-600"
                          }`}>
                            {point.scorer === "A" ? entityA : entityB}
                          </span>
                          <span className="text-sm text-gray-500">
                            at {new Date(point.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                        <span className="font-medium">{point.scoreA} - {point.scoreB}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={exportToExcel}
            className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 transition-colors"
          >
            Export to Excel
          </button>
          <button
            onClick={() => navigate("/fixtures")}
            className="bg-gray-600 text-white px-6 py-2 rounded-md hover:bg-gray-700 transition-colors"
          >
            Back to Fixtures
          </button>
          {match.status === "completed" && (
            <button
              onClick={() => navigate(`/scorekeeper/${matchId}`)}
              className="bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700 transition-colors"
            >
              View Scorekeeper
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default MatchSummaryPage;