// src/components/FixturesPage.jsx
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { fetchMatches, deleteMatch, updateMatch, exportMatches } from "../utils/api";

const FixturesPage = ({ matches, updateMatches }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isInitialFetchDone, setIsInitialFetchDone] = useState(false);
  const [tossSelection, setTossSelection] = useState(null);
  const [tossWinner, setTossWinner] = useState("");
  const [copySuccess, setCopySuccess] = useState(false);

  const fetchMatchesData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetchMatches();
      if (response.data && Array.isArray(response.data)) {
        console.log("Fetched matches in FixturesPage:", response.data);
        updateMatches(response.data);
      }
    } catch (err) {
      console.error("Failed to fetch matches:", err.response?.data || err.message);
      setError("Failed to load matches: " + (err.response?.data?.message || "Please try again."));
    } finally {
      setLoading(false);
      setIsInitialFetchDone(true);
    }
  }, [updateMatches]);

  useEffect(() => {
    console.log("FixturesPage received matches prop:", matches);
    if (!matches || matches.length === 0) {
      fetchMatchesData();
    } else {
      setIsInitialFetchDone(true);
    }
  }, [fetchMatchesData, matches]);

  const handleRefresh = () => fetchMatchesData();

  const deleteMatchAction = useCallback(
    async (matchId) => {
      if (!window.confirm(`Are you sure you want to delete match ${matchId}?`)) return;
      try {
        setActionLoading(true);
        setError(null);
        await deleteMatch(matchId);
        const updatedMatches = matches.filter((m) => m.id !== matchId);
        updateMatches(updatedMatches);
      } catch (err) {
        console.error("Failed to delete match:", err.response?.data || err.message);
        if (err.response?.status === 404) {
          const updatedMatches = matches.filter((m) => m.id !== matchId);
          updateMatches(updatedMatches);
        } else {
          setError("Failed to delete match: " + (err.response?.data?.message || err.message));
        }
      } finally {
        setActionLoading(false);
      }
    },
    [matches, updateMatches]
  );

  const handleStartMatch = useCallback((matchId) => navigate(`/scorekeeper/${matchId}`), [navigate]);

  const handleExport = useCallback(async () => {
    try {
      await exportMatches();
    } catch (err) {
      console.error("Failed to export matches:", err.response?.data || err.message);
      setError("Failed to export matches: " + (err.response?.data?.message || err.message));
    }
  }, []);

  const getMatchResult = (match) => {
    if (match.status !== "completed" || !match.completedSets || match.completedSets.length === 0) {
      return { winner: "N/A", setPoints: "N/A" };
    }
    const isSingles = match.matchType.toLowerCase() === "singles";
    const entityA = isSingles ? match.playerA : `${match.teamA.player1}/${match.teamA.player2}`;
    const entityB = isSingles ? match.playerB : `${match.teamB.player1}/${match.teamB.player2}`;
    const winsA = match.completedSets.reduce(
      (count, set) => count + (set.winner === (isSingles ? match.playerA : "Team A") ? 1 : 0),
      0
    );
    const winsB = match.completedSets.reduce(
      (count, set) => count + (set.winner === (isSingles ? match.playerB : "Team B") ? 1 : 0),
      0
    );
    const winner = winsA > winsB ? (isSingles ? `Player - ${entityA}` : `Team A - ${entityA}`) : winsB > winsA ? (isSingles ? `Player - ${entityB}` : `Team B - ${entityB}`) : "Tie";
    const setPoints = match.completedSets.map((set) => `${set.scoreA}-${set.scoreB}`).join(", ");
    return { winner, setPoints };
  };

  const pendingMatches = useMemo(() => matches.filter((match) => match.status === "pending"), [matches]);
  const ongoingMatches = useMemo(() => matches.filter((match) => match.status === "ongoing"), [matches]);
  const completedMatches = useMemo(() => matches.filter((match) => match.status === "completed"), [matches]);

  if (loading && !isInitialFetchDone) {
    return (
      <div className="text-center py-20 text-xl text-gray-600 animate-pulse bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 min-h-screen flex items-center justify-center">
        Loading matches...
      </div>
    );
  }

  const renderPlayers = (match) => {
    const matchType = match.matchType.toLowerCase();
    if (matchType === "singles") {
      return (
        <>
          <span className="font-semibold text-indigo-700">{match.playerA}</span> vs{" "}
          <span className="font-semibold text-indigo-700">{match.playerB}</span>
        </>
      );
    } else if (matchType === "doubles" || matchType === "mixed") {
      return (
        <>
          <span className="font-semibold text-indigo-700">{match.teamA.player1}/{match.teamA.player2}</span> vs{" "}
          <span className="font-semibold text-indigo-700">{match.teamB.player1}/{match.teamB.player2}</span>
        </>
      );
    }
    return null;
  };

  const initiateToss = (matchId) => {
    setTossSelection(matchId);
    setTossWinner("");
  };

  const handleTossSubmit = async (matchId) => {
    if (!tossWinner) {
      setError("Please select a toss winner.");
      return;
    }
    setActionLoading(true);
    setError(null);
    try {
      const matchToUpdate = matches.find((m) => m.id === matchId);
      const updatedMatch = { ...matchToUpdate, tossWinner };
      await updateMatch(matchId, updatedMatch);
      updateMatches(matches.map((m) => (m.id === matchId ? updatedMatch : m)));
      setTossSelection(null);
    } catch (err) {
      console.error("Failed to update toss winner:", err.response?.data || err.message);
      setError("Failed to update toss winner: " + (err.response?.data?.message || err.message));
    } finally {
      setActionLoading(false);
    }
  };

  const handleServeChoice = async (matchId, choice) => {
    setActionLoading(true);
    setError(null);
    try {
      const matchToUpdate = matches.find((m) => m.id === matchId);
      let servingTeam = matchToUpdate.tossWinner === "Team A" ? "Team A" : "Team B";
      if (choice === "Receive") {
        servingTeam = matchToUpdate.tossWinner === "Team A" ? "Team B" : "Team A";
      }
      const updatedMatch = { ...matchToUpdate, servingTeam };
      await updateMatch(matchId, updatedMatch);
      updateMatches(matches.map((m) => (m.id === matchId ? updatedMatch : m)));
      setTossSelection(null);
    } catch (err) {
      console.error("Failed to set serve choice:", err.response?.data || err.message);
      setError("Failed to set serve choice: " + (err.response?.data?.message || err.message));
    } finally {
      setActionLoading(false);
    }
  };

  const handleCopyLink = () => {
    const publicScoreUrl = "https://badbash.netlify.app/public-scores";
    navigator.clipboard.writeText(publicScoreUrl)
      .then(() => {
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      })
      .catch((err) => {
        console.error("Failed to copy link:", err);
        setError("Failed to copy link to clipboard");
      });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-100 to-pink-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="flex flex-col sm:flex-row justify-between items-center mb-10 gap-4 bg-white/80 backdrop-blur-md rounded-xl shadow-lg p-6">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 tracking-tight">
            Fixtures Dashboard
          </h1>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value="https://badbash.netlify.app/public-scores"
                readOnly
                className="px-4 py-2 border border-indigo-200 rounded-lg bg-indigo-50 text-indigo-800 text-sm w-full sm:w-64 shadow-inner"
              />
              <button
                onClick={handleCopyLink}
                disabled={copySuccess}
                className={`px-4 py-2 rounded-lg text-white font-semibold transition-all duration-300 shadow-md ${copySuccess ? "bg-green-500" : "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"}`}
              >
                {copySuccess ? "Copied!" : "Copy Link"}
              </button>
            </div>
            <button
              onClick={handleExport}
              className="px-4 py-2 bg-gradient-to-r from-green-500 to-teal-500 text-white rounded-lg hover:from-green-600 hover:to-teal-600 font-semibold transition-all duration-300 shadow-md"
            >
              Export to Excel
            </button>
            <button
              onClick={handleRefresh}
              disabled={loading}
              className={`px-4 py-2 rounded-lg text-white font-semibold transition-all duration-300 shadow-md ${loading ? "bg-gray-400 cursor-not-allowed" : "bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600"}`}
            >
              {loading ? "Refreshing..." : "Refresh"}
            </button>
          </div>
        </header>

        {/* Error and Action Loading */}
        {error && (
          <div className="bg-red-100/90 backdrop-blur-sm border-l-4 border-red-500 text-red-800 p-4 rounded-lg mb-8 text-sm shadow-md animate-slide-in">
            {error}
          </div>
        )}
        {actionLoading && (
          <div className="text-center text-indigo-600 animate-pulse mb-8 text-lg font-medium">Processing...</div>
        )}

        {/* Matches Sections */}
        <section className="space-y-12">
          {/* Pending Matches */}
          <div className="animate-fade-in">
            <h2 className="text-3xl font-bold text-yellow-600 mb-6 border-b-4 border-yellow-300 pb-2 bg-gradient-to-r from-yellow-50 to-transparent rounded-t-lg pl-4">Pending Matches</h2>
            {pendingMatches.length === 0 && isInitialFetchDone && (
              <p className="text-center text-gray-600 italic py-6 text-lg">No pending matches scheduled.</p>
            )}
            {pendingMatches.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {pendingMatches.map((match) => (
                  <div key={match.id} className="bg-white/90 backdrop-blur-md rounded-xl shadow-xl p-5 border-l-4 border-yellow-500 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
                    <div className="mb-4">
                      <h3 className="text-xl font-semibold text-gray-800 truncate">{renderPlayers(match)}</h3>
                      <p className="text-sm text-gray-900 mt-1">Match Type: <span className="font-medium text-indigo-600">{match.matchType}</span></p>
                      <p className="text-sm text-gray-900">Sets: <span className="font-medium text-indigo-600">{match.totalSets}</span></p>
                      <p className="text-sm text-gray-900">Venue: <span className="font-medium text-indigo-600">{match.venue}</span></p>
                      <p className="text-sm text-gray-900">Date: <span className="font-medium text-indigo-600">{new Date(match.date).toLocaleDateString()}</span></p>
                      <p className="text-sm text-yellow-600 font-semibold mt-2">Status: Pending</p>
                    </div>
                    <div className="flex flex-col gap-3">
                      <button
                        onClick={() => handleStartMatch(match.id)}
                        disabled={actionLoading || !match.servingTeam}
                        className={`px-4 py-2 rounded-lg text-white font-semibold transition-all duration-300 shadow-md ${actionLoading || !match.servingTeam ? "bg-gray-400 cursor-not-allowed" : "bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600"}`}
                      >
                        Start Match
                      </button>
                      <button
                        onClick={() => deleteMatchAction(match.id)}
                        disabled={actionLoading}
                        className={`px-4 py-2 rounded-lg text-white font-semibold transition-all duration-300 shadow-md ${actionLoading ? "bg-gray-400 cursor-not-allowed" : "bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600"}`}
                      >
                        Delete
                      </button>
                      {!match.tossWinner && (
                        <button
                          onClick={() => initiateToss(match.id)}
                          disabled={actionLoading}
                          className={`px-4 py-2 rounded-lg text-white font-semibold transition-all duration-300 shadow-md ${actionLoading ? "bg-gray-400 cursor-not-allowed" : "bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600"}`}
                        >
                          Toss
                        </button>
                      )}
                      {tossSelection === match.id && !match.tossWinner && (
                        <div className="mt-3 space-y-3 bg-gray-50 p-3 rounded-lg shadow-inner">
                          <p className="text-sm text-gray-700 font-medium">Who won the toss?</p>
                          <select
                            value={tossWinner}
                            onChange={(e) => setTossWinner(e.target.value)}
                            disabled={actionLoading}
                            className="w-full px-3 py-2 border border-indigo-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-all duration-200"
                          >
                            <option value="">Select Toss Winner</option>
                            {match.matchType.toLowerCase() === "singles" ? (
                              <>
                                <option value="Team A">{match.playerA}</option>
                                <option value="Team B">{match.playerB}</option>
                              </>
                            ) : (
                              <>
                                <option value="Team A">{`${match.teamA.player1}/${match.teamA.player2}`}</option>
                                <option value="Team B">{`${match.teamB.player1}/${match.teamB.player2}`}</option>
                              </>
                            )}
                          </select>
                          <button
                            onClick={() => handleTossSubmit(match.id)}
                            disabled={actionLoading || !tossWinner}
                            className={`w-full px-4 py-2 rounded-lg text-white font-semibold transition-all duration-300 shadow-md ${actionLoading || !tossWinner ? "bg-gray-400 cursor-not-allowed" : "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"}`}
                          >
                            Submit Toss
                          </button>
                        </div>
                      )}
                      {match.tossWinner && !match.servingTeam && (
                        <div className="mt-3 space-y-3 bg-gray-50 p-3 rounded-lg shadow-inner">
                          <p className="text-sm text-gray-700 font-medium">
                            Toss Winner: {match.tossWinner === "Team A" 
                              ? (match.matchType.toLowerCase() === "singles" ? match.playerA : `${match.teamA.player1}/${match.teamA.player2}`)
                              : (match.matchType.toLowerCase() === "singles" ? match.playerB : `${match.teamB.player1}/${match.teamB.player2}`)}
                          </p>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleServeChoice(match.id, "Serve")}
                              disabled={actionLoading}
                              className={`flex-1 px-3 py-2 rounded-lg text-white font-semibold transition-all duration-300 shadow-md ${actionLoading ? "bg-gray-400 cursor-not-allowed" : "bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600"}`}
                            >
                              Serve
                            </button>
                            <button
                              onClick={() => handleServeChoice(match.id, "Receive")}
                              disabled={actionLoading}
                              className={`flex-1 px-3 py-2 rounded-lg text-white font-semibold transition-all duration-300 shadow-md ${actionLoading ? "bg-gray-400 cursor-not-allowed" : "bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600"}`}
                            >
                              Receive
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Ongoing Matches */}
          <div className="animate-fade-in">
            <h2 className="text-3xl font-bold text-red-600 mb-6 border-b-4 border-red-300 pb-2 bg-gradient-to-r from-red-50 to-transparent rounded-t-lg pl-4">Matches In Progress</h2>
            {ongoingMatches.length === 0 && isInitialFetchDone && (
              <p className="text-center text-gray-600 italic py-6 text-lg">No matches in progress.</p>
            )}
            {ongoingMatches.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {ongoingMatches.map((match) => (
                  <div key={match.id} className="bg-white/90 backdrop-blur-md rounded-xl shadow-xl p-5 border-l-4 border-red-500 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
                    <div className="mb-4">
                      <h3 className="text-xl font-semibold text-gray-800 truncate">{renderPlayers(match)}</h3>
                      <p className="text-sm text-gray-600 mt-1">Match Type: <span className="font-medium text-indigo-600">{match.matchType}</span></p>
                      <p className="text-sm text-gray-600">Sets: <span className="font-medium text-indigo-600">{match.totalSets}</span></p>
                      <p className="text-sm text-gray-600">Venue: <span className="font-medium text-indigo-600">{match.venue}</span></p>
                      <p className="text-sm text-gray-600">Date: <span className="font-medium text-indigo-600">{new Date(match.date).toLocaleDateString()}</span></p>
                      <p className="text-sm text-gray-600">Sets Completed: <span className="font-medium text-indigo-600">{(match.completedSets || []).length} of {match.totalSets}</span></p>
                      <p className="text-sm text-red-600 font-semibold mt-2">Status: Ongoing</p>
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={() => handleStartMatch(match.id)}
                        disabled={actionLoading}
                        className={`px-4 py-2 rounded-lg text-white font-semibold transition-all duration-300 shadow-md ${actionLoading ? "bg-gray-400 cursor-not-allowed" : "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"}`}
                      >
                        Continue Match
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Completed Matches */}
          <div className="animate-fade-in">
            <h2 className="text-3xl font-bold text-green-600 mb-6 border-b-4 border-green-300 pb-2 bg-gradient-to-r from-green-50 to-transparent rounded-t-lg pl-4">Completed Matches</h2>
            {completedMatches.length === 0 && isInitialFetchDone && (
              <p className="text-center text-gray-600 italic py-6 text-lg">No matches completed yet.</p>
            )}
            {completedMatches.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {completedMatches.map((match) => {
                  const { winner, setPoints } = getMatchResult(match);
                  return (
                    <div key={match.id} className="bg-white/90 backdrop-blur-md rounded-xl shadow-xl p-5 border-l-4 border-green-500 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
                      <div className="mb-4">
                        <h3 className="text-xl font-semibold text-gray-800 truncate">{renderPlayers(match)}</h3>
                        <p className="text-sm text-gray-600 mt-1">Match Type: <span className="font-medium text-indigo-600">{match.matchType}</span></p>
                        <p className="text-sm text-gray-600">Sets: <span className="font-medium text-indigo-600">{match.totalSets}</span></p>
                        <p className="text-sm text-gray-600">Venue: <span className="font-medium text-indigo-600">{match.venue}</span></p>
                        <p className="text-sm text-gray-600">Date: <span className="font-medium text-indigo-600">{new Date(match.date).toLocaleDateString()}</span></p>
                        <p className="text-sm text-green-600 font-semibold mt-2">Status: Completed</p>
                        <p className="text-sm text-gray-700 mt-1">Winner: <span className="font-semibold text-green-700">{winner}</span></p>
                        <p className="text-sm text-gray-600">Set Points: <span className="font-medium text-indigo-600">{setPoints}</span></p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* No Matches Message */}
        {!loading && isInitialFetchDone && matches.length === 0 && (
          <div className="text-center py-12 text-gray-600 italic text-lg bg-white/80 backdrop-blur-md rounded-xl shadow-lg mt-10">
            <p>No ongoing, upcoming, or completed matches.</p>
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

export default FixturesPage;