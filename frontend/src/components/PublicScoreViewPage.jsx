// src/components/PublicScoreViewPage.jsx
import React, { useState, useEffect } from "react";
import { fetchPublicMatches } from "../utils/api";

const PublicScoreViewPage = () => {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    const fetchMatchesData = async () => {
      try {
        setLoading(true);
        const response = await fetchPublicMatches();
        if (response.data && Array.isArray(response.data)) {
          setMatches(response.data);
        } else {
          setError("No matches found");
        }
      } catch (err) {
        console.error("Failed to fetch matches:", err.response?.data || err.message);
        setError("Failed to load matches");
      } finally {
        setLoading(false);
      }
    };

    fetchMatchesData();
    const interval = setInterval(fetchMatchesData, 5000);
    return () => clearInterval(interval);
  }, []);

  const filteredMatches = matches.filter((match) => {
    if (filter === "all") return true;
    if (filter === "live") return match.status === "ongoing";
    if (filter === "upcoming") return match.status === "pending";
    if (filter === "completed") return match.status === "completed";
    return true;
  });

  const ongoingMatches = matches.filter((match) => match.status === "ongoing");
  const pendingMatches = matches.filter((match) => match.status === "pending");
  const completedMatches = matches.filter((match) => match.status === "completed");

  const getMatchDetails = (match) => {
    const isDoublesOrMixed = match.matchType.toLowerCase() === "doubles" || match.matchType.toLowerCase() === "mixed";
    const entityA = isDoublesOrMixed ? `${match.teamA.player1}/${match.teamA.player2}` : match.playerA;
    const entityB = isDoublesOrMixed ? `${match.teamB.player1}/${match.teamB.player2}` : match.playerB;

    const { scoreA, scoreB, points, completedSets, currentSet } = getCurrentSetData(match);
    let winner = "N/A";
    if (match.status === "completed" && completedSets.length > 0) {
      const winsA = completedSets.reduce(
        (count, set) => count + (set.winner === (isDoublesOrMixed ? "Team A" : entityA) ? 1 : 0),
        0
      );
      const winsB = completedSets.reduce(
        (count, set) => count + (set.winner === (isDoublesOrMixed ? "Team B" : entityB) ? 1 : 0),
        0
      );
      winner = winsA > winsB ? entityA : winsB > winsA ? entityB : "Tie";
    }

    return { entityA, entityB, scoreA, scoreB, points, completedSets, currentSet, winner };
  };

  const getCurrentSetData = (match) => {
    const completedSets = Array.isArray(match.completedSets) ? match.completedSets : [];
    const points = Array.isArray(match.points) ? match.points : [];
    let currentSet, scoreA, scoreB, currentSetPoints;

    if (match.status === "completed" && completedSets.length > 0) {
      const lastSet = completedSets[completedSets.length - 1];
      currentSet = lastSet.setNumber;
      scoreA = lastSet.scoreA;
      scoreB = lastSet.scoreB;
      currentSetPoints = points.filter((p) => p.setNumber === currentSet);
    } else {
      currentSet = completedSets.length + 1;
      currentSetPoints = points.filter((p) => p.setNumber === currentSet);
      scoreA = currentSetPoints.reduce((sum, p) => sum + (p.scorer === "A" ? 1 : 0), 0);
      scoreB = currentSetPoints.reduce((sum, p) => sum + (p.scorer === "B" ? 1 : 0), 0);
    }

    return { completedSets, points: currentSetPoints, scoreA, scoreB, currentSet };
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-100 via-purple-100 to-pink-100">
      <div className="text-2xl font-semibold text-indigo-700 animate-pulse">Loading matches...</div>
    </div>
  );
  if (error) return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-100 via-purple-100 to-pink-100">
      <div className="text-xl text-red-600 bg-red-100 p-4 rounded-lg shadow-md">{error}</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-100 to-pink-100 px-4 sm:px-6 lg:px-8 py-8">
      <header className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-center mb-10 gap-4">
        <h1 className="text-4xl sm:text-5xl font-extrabold text-indigo-800 tracking-tight bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent animate-fade-in">
          Live Badminton Hub
        </h1>
        <div className="flex items-center gap-3">
          <label htmlFor="status-filter" className="text-sm font-medium text-gray-700">Filter:</label>
          <select
            id="status-filter"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-4 py-2 border border-indigo-300 rounded-lg bg-white text-gray-800 shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-300"
          >
            <option value="all">All Matches</option>
            <option value="live">Live Matches</option>
            <option value="upcoming">Upcoming Matches</option>
            <option value="completed">Completed Matches</option>
          </select>
        </div>
      </header>

      <main className="max-w-6xl mx-auto space-y-12">
        {filter === "all" ? (
          <>
            {/* Live Matches */}
            <section>
              <h2 className="text-3xl font-bold text-red-600 mb-6 border-b-2 border-red-400 pb-2 flex items-center gap-2">
                <span className="inline-block w-3 h-3 bg-red-600 rounded-full animate-ping"></span> Live Matches
              </h2>
              {ongoingMatches.length === 0 ? (
                <p className="text-center text-gray-600 italic py-6">No live matches currently.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {ongoingMatches.map((match) => {
                    const { entityA, entityB, scoreA, scoreB, points, completedSets, currentSet } = getMatchDetails(match);
                    return (
                      <div 
                        key={match.id} 
                        className="bg-white rounded-xl shadow-lg p-5 border-l-4 border-red-500 hover:shadow-2xl hover:scale-105 transition-all duration-300 relative overflow-hidden"
                      >
                        <div className="absolute top-0 right-0 w-24 h-24 bg-red-100 rounded-full -mr-12 -mt-12 opacity-50 animate-pulse"></div>
                        <div className="flex justify-between items-center mb-4">
                          <h3 className="text-xl font-semibold text-gray-800 truncate hover:text-red-600 transition-colors">{entityA} vs {entityB}</h3>
                          <span className="bg-red-100 text-red-600 text-xs font-medium px-3 py-1 rounded-full shadow-sm">{match.matchType}</span>
                        </div>
                        <div className="text-sm text-gray-700 mb-4 space-y-2">
                          <p><span className="font-medium text-red-600">Venue:</span> {match.venue}</p>
                          <p><span className="font-medium text-red-600">Date:</span> {new Date(match.date).toLocaleDateString()}</p>
                          <p><span className="font-medium text-red-600">Set:</span> {currentSet} of {match.totalSets}</p>
                        </div>
                        <div className="flex items-center justify-between bg-red-50 p-4 rounded-lg mb-4 shadow-inner">
                          <div className="text-center flex-1">
                            <p className="text-sm font-medium text-gray-800 truncate">{entityA}</p>
                            <p className="text-3xl font-extrabold text-red-600 animate-pulse">{scoreA}</p>
                          </div>
                          <span className="text-xl font-bold text-gray-600 mx-3">VS</span>
                          <div className="text-center flex-1">
                            <p className="text-sm font-medium text-gray-800 truncate">{entityB}</p>
                            <p className="text-3xl font-extrabold text-red-600 animate-pulse">{scoreB}</p>
                          </div>
                        </div>
                        <div className="text-sm">
                          <h4 className="text-red-600 font-semibold mb-2">Completed Sets</h4>
                          {completedSets.length === 0 ? (
                            <p className="text-gray-600">No sets completed yet.</p>
                          ) : (
                            <ul className="list-disc pl-5 text-gray-700 space-y-1">
                              {completedSets.map((set, index) => (
                                <li key={`${match.id}-set-${set.setNumber}-${index}`}>
                                  Set {set.setNumber}: {set.scoreA}-{set.scoreB} <span className="text-red-500">({set.winner})</span>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                        <div className="text-sm mt-3">
                          <h4 className="text-red-600 font-semibold mb-2">Recent Points</h4>
                          {points.length === 0 ? (
                            <p className="text-gray-600">No points yet.</p>
                          ) : (
                            <ul className="list-disc pl-5 text-gray-700 max-h-24 overflow-y-auto space-y-1">
                              {points.slice(-5).map((point, index) => (
                                <li key={`${match.id}-point-${point.id}-${index}`} className="hover:text-red-600 transition-colors">
                                  {point.scorer === "A" ? entityA : entityB} scored
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            {/* Upcoming Matches */}
            <section>
              <h2 className="text-3xl font-bold text-yellow-600 mb-6 border-b-2 border-yellow-400 pb-2 flex items-center gap-2">
                <span className="inline-block w-3 h-3 bg-yellow-600 rounded-full"></span> Upcoming Matches
              </h2>
              {pendingMatches.length === 0 ? (
                <p className="text-center text-gray-600 italic py-6">No upcoming matches scheduled.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {pendingMatches.map((match) => {
                    const { entityA, entityB } = getMatchDetails(match);
                    return (
                      <div 
                        key={match.id} 
                        className="bg-white rounded-xl shadow-lg p-5 border-l-4 border-yellow-500 hover:shadow-2xl hover:scale-105 transition-all duration-300 relative overflow-hidden"
                      >
                        <div className="absolute top-0 right-0 w-24 h-24 bg-yellow-100 rounded-full -mr-12 -mt-12 opacity-50"></div>
                        <div className="flex justify-between items-center mb-4">
                          <h3 className="text-xl font-semibold text-gray-800 truncate hover:text-yellow-600 transition-colors">{entityA} vs {entityB}</h3>
                          <span className="bg-yellow-100 text-yellow-600 text-xs font-medium px-3 py-1 rounded-full shadow-sm">{match.matchType}</span>
                        </div>
                        <div className="text-sm text-gray-700 space-y-2">
                          <p><span className="font-medium text-yellow-600">Venue:</span> {match.venue}</p>
                          <p><span className="font-medium text-yellow-600">Date:</span> {new Date(match.date).toLocaleDateString()}</p>
                          <p><span className="font-medium text-yellow-600">Sets:</span> {match.totalSets}</p>
                          <p className="text-yellow-600 font-semibold bg-yellow-50 px-2 py-1 rounded-md inline-block">Upcoming</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            {/* Completed Matches */}
            <section>
              <h2 className="text-3xl font-bold text-green-600 mb-6 border-b-2 border-green-400 pb-2 flex items-center gap-2">
                <span className="inline-block w-3 h-3 bg-green-600 rounded-full"></span> Completed Matches
              </h2>
              {completedMatches.length === 0 ? (
                <p className="text-center text-gray-600 italic py-6">No matches completed yet.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {completedMatches.map((match) => {
                    const { entityA, entityB, scoreA, scoreB, completedSets, winner } = getMatchDetails(match);
                    return (
                      <div 
                        key={match.id} 
                        className="bg-white rounded-xl shadow-lg p-5 border-l-4 border-green-500 hover:shadow-2xl hover:scale-105 transition-all duration-300 relative overflow-hidden"
                      >
                        <div className="absolute top-0 right-0 w-24 h-24 bg-green-100 rounded-full -mr-12 -mt-12 opacity-50"></div>
                        <div className="flex justify-between items-center mb-4">
                          <h3 className="text-xl font-semibold text-gray-800 truncate hover:text-green-600 transition-colors">{entityA} vs {entityB}</h3>
                          <span className="bg-green-100 text-green-600 text-xs font-medium px-3 py-1 rounded-full shadow-sm">{match.matchType}</span>
                        </div>
                        <div className="text-sm text-gray-700 mb-4 space-y-2">
                          <p><span className="font-medium text-green-600">Venue:</span> {match.venue}</p>
                          <p><span className="font-medium text-green-600">Date:</span> {new Date(match.date).toLocaleDateString()}</p>
                          <p><span className="font-medium text-green-600">Final Score:</span> {scoreA}-{scoreB}</p>
                          <p className="text-green-600 font-semibold bg-green-50 px-2 py-1 rounded-md inline-block">Winner: {winner}</p>
                        </div>
                        <div className="text-sm">
                          <h4 className="text-green-600 font-semibold mb-2">Completed Sets</h4>
                          <ul className="list-disc pl-5 text-gray-700 space-y-1">
                            {completedSets.map((set, index) => (
                              <li key={`${match.id}-set-${set.setNumber}-${index}`} className="hover:text-green-600 transition-colors">
                                Set {set.setNumber}: {set.scoreA}-{set.scoreB} <span className="text-green-500">({set.winner})</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </>
        ) : (
          <section>
            <h2 className={`text-3xl font-bold mb-6 border-b-2 pb-2 flex items-center gap-2 ${filter === "live" ? "text-red-600 border-red-400" : filter === "upcoming" ? "text-yellow-600 border-yellow-400" : "text-green-600 border-green-400"}`}>
              <span className={`inline-block w-3 h-3 rounded-full ${filter === "live" ? "bg-red-600 animate-ping" : filter === "upcoming" ? "bg-yellow-600" : "bg-green-600"}`}></span>
              {filter === "live" ? "Live Matches" : filter === "upcoming" ? "Upcoming Matches" : "Completed Matches"}
            </h2>
            {filteredMatches.length === 0 ? (
              <p className="text-center text-gray-600 italic py-6">{`No ${filter} matches available.`}</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredMatches.map((match) => {
                  const { entityA, entityB, scoreA, scoreB, points, completedSets, currentSet, winner } = getMatchDetails(match);
                  return (
                    <div 
                      key={match.id} 
                      className={`bg-white rounded-xl shadow-lg p-5 border-l-4 ${match.status === "ongoing" ? "border-red-500" : match.status === "pending" ? "border-yellow-500" : "border-green-500"} hover:shadow-2xl hover:scale-105 transition-all duration-300 relative overflow-hidden`}
                    >
                      <div className={`absolute top-0 right-0 w-24 h-24 rounded-full -mr-12 -mt-12 opacity-50 ${match.status === "ongoing" ? "bg-red-100 animate-pulse" : match.status === "pending" ? "bg-yellow-100" : "bg-green-100"}`}></div>
                      <div className="flex justify-between items-center mb-4">
                        <h3 className={`text-xl font-semibold text-gray-800 truncate hover:text-${match.status === "ongoing" ? "red" : match.status === "pending" ? "yellow" : "green"}-600 transition-colors`}>{entityA} vs {entityB}</h3>
                        <span className={`text-xs font-medium px-3 py-1 rounded-full shadow-sm ${match.status === "ongoing" ? "bg-red-100 text-red-600" : match.status === "pending" ? "bg-yellow-100 text-yellow-600" : "bg-green-100 text-green-600"}`}>
                          {match.matchType}
                        </span>
                      </div>
                      <div className="text-sm text-gray-700 mb-4 space-y-2">
                        <p><span className={`font-medium text-${match.status === "ongoing" ? "red" : match.status === "pending" ? "yellow" : "green"}-600`}>Venue:</span> {match.venue}</p>
                        <p><span className={`font-medium text-${match.status === "ongoing" ? "red" : match.status === "pending" ? "yellow" : "green"}-600`}>Date:</span> {new Date(match.date).toLocaleDateString()}</p>
                        {match.status === "pending" ? (
                          <>
                            <p><span className="font-medium text-yellow-600">Sets:</span> {match.totalSets}</p>
                            <p className="text-yellow-600 font-semibold bg-yellow-50 px-2 py-1 rounded-md inline-block">Upcoming</p>
                          </>
                        ) : match.status === "completed" ? (
                          <>
                            <p><span className="font-medium text-green-600">Final Score:</span> {scoreA}-{scoreB}</p>
                            <p className="text-green-600 font-semibold bg-green-50 px-2 py-1 rounded-md inline-block">Winner: {winner}</p>
                          </>
                        ) : (
                          <>
                            <p><span className="font-medium text-red-600">Set:</span> {currentSet} of {match.totalSets}</p>
                            <div className="flex items-center justify-between bg-red-50 p-4 rounded-lg shadow-inner">
                              <div className="text-center flex-1">
                                <p className="text-sm font-medium text-gray-800 truncate">{entityA}</p>
                                <p className="text-3xl font-extrabold text-red-600 animate-pulse">{scoreA}</p>
                              </div>
                              <span className="text-xl font-bold text-gray-600 mx-3">VS</span>
                              <div className="text-center flex-1">
                                <p className="text-sm font-medium text-gray-800 truncate">{entityB}</p>
                                <p className="text-3xl font-extrabold text-red-600 animate-pulse">{scoreB}</p>
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                      {(match.status === "ongoing" || match.status === "completed") && (
                        <div className="text-sm">
                          <h4 className={`text-${match.status === "ongoing" ? "red" : "green"}-600 font-semibold mb-2`}>Completed Sets</h4>
                          {completedSets.length === 0 ? (
                            <p className="text-gray-600">No sets completed yet.</p>
                          ) : (
                            <ul className="list-disc pl-5 text-gray-700 space-y-1">
                              {completedSets.map((set, index) => (
                                <li key={`${match.id}-set-${set.setNumber}-${index}`} className={`hover:text-${match.status === "ongoing" ? "red" : "green"}-600 transition-colors`}>
                                  Set {set.setNumber}: {set.scoreA}-{set.scoreB} <span className={`text-${match.status === "ongoing" ? "red" : "green"}-500`}>{`(${set.winner})`}</span>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      )}
                      {match.status === "ongoing" && (
                        <div className="text-sm mt-3">
                          <h4 className="text-red-600 font-semibold mb-2">Recent Points</h4>
                          {points.length === 0 ? (
                            <p className="text-gray-600">No points yet.</p>
                          ) : (
                            <ul className="list-disc pl-5 text-gray-700 max-h-24 overflow-y-auto space-y-1">
                              {points.slice(-5).map((point, index) => (
                                <li key={`${match.id}-point-${point.id}-${index}`} className="hover:text-red-600 transition-colors">
                                  {point.scorer === "A" ? entityA : entityB} scored
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
};

export default PublicScoreViewPage;