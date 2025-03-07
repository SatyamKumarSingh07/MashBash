// src/components/ConductMatchPage.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import backgroundImage from "../assets/BadBash2.jpg";
import { createMatch } from "../utils/api";

const ConductMatchPage = ({ addMatch }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    matchType: "singles",
    playerA: "",
    playerB: "",
    teamA: { player1: "", player2: "" },
    teamB: { player1: "", player2: "" },
    totalSets: 1,
    venue: "",
    date: "",
    matchPoints: "21", // Default to 21
  });
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith("teamA") || name.startsWith("teamB")) {
      const [team, player] = name.split(".");
      setFormData((prev) => ({
        ...prev,
        [team]: { ...prev[team], [player]: value },
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const matchData = {
      matchType: formData.matchType,
      totalSets: parseInt(formData.totalSets),
      venue: formData.venue,
      date: formData.date,
      status: "pending",
      matchPoints: parseInt(formData.matchPoints),
    };

    if (formData.matchType.toLowerCase() === "singles") {
      matchData.playerA = formData.playerA;
      matchData.playerB = formData.playerB;
    } else {
      matchData.teamA = formData.teamA;
      matchData.teamB = formData.teamB;
    }

    try {
      const response = await createMatch(matchData);
      const newMatch = response.data;
      addMatch(newMatch);
      const publicLink = `https://badbash.netlify.app/view-score/${newMatch.id}`;
      alert(`Match created successfully! Share this with the audience: ${publicLink}`);
      navigate("/fixtures");
    } catch (err) {
      console.error("Failed to create match:", err.response?.data || err.message);
      setError("Failed to create match: " + (err.response?.data?.message || "Please try again."));
    }
  };

  return (
    <div
      className="min-h-screen bg-cover bg-center flex items-center justify-center py-6 px-4 sm:px-6 lg:px-8 relative"
      style={{
        backgroundImage: `url(${backgroundImage})`,
        backgroundSize: "cover",
        filter: "blur(0.2px)", // Slight blur effect on the background image
       // Slightly transparent for mirror-like effect
      }}
    >
      {/* Overlay for better contrast */}
      <div className="absolute inset-0 bg-white/5 backdrop-blur-xs"></div>

      {/* Form Container */}
      <div className="relative max-w-lg w-full bg-white/95 rounded-2xl shadow-2xl p-6 sm:p-8 space-y-6 z-10 border border-gray-100">
        <h1 className="text-2xl sm:text-3xl font-bold text-center text-indigo-800 tracking-tight">Create a New Match</h1>

        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-lg text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Match Type */}
          <div>
            <label htmlFor="matchType" className="block text-sm font-medium text-gray-700 mb-1">
              Match Type
            </label>
            <select
              id="matchType"
              name="matchType"
              value={formData.matchType}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-red-800 rounded-lg bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-200"
            >
              <option value="singles">Singles</option>
              <option value="doubles">Doubles</option>
              <option value="mixed">Mixed</option>
            </select>
          </div>

          {/* Player Inputs */}
          {formData.matchType.toLowerCase() === "singles" ? (
            <div className="space-y-4">
              <div>
                <label htmlFor="playerA" className="block text-sm font-medium text-gray-700 mb-1">
                  Player A
                </label>
                <input
                  id="playerA"
                  type="text"
                  name="playerA"
                  value={formData.playerA}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-200 bg-white/80"
                  placeholder="Enter Player A Name"
                />
              </div>
              <div>
                <label htmlFor="playerB" className="block text-sm font-medium text-gray-700 mb-1">
                  Player B
                </label>
                <input
                  id="playerB"
                  type="text"
                  name="playerB"
                  value={formData.playerB}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-200 bg-white/80"
                  placeholder="Enter Player B Name"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="teamA.player1" className="block text-sm font-medium text-gray-700 mb-1">
                    Team A - Player 1
                  </label>
                  <input
                    id="teamA.player1"
                    type="text"
                    name="teamA.player1"
                    value={formData.teamA.player1}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-200 bg-white/80"
                    placeholder="Player 1 Name"
                  />
                </div>
                <div>
                  <label htmlFor="teamA.player2" className="block text-sm font-medium text-gray-700 mb-1">
                    Team A - Player 2
                  </label>
                  <input
                    id="teamA.player2"
                    type="text"
                    name="teamA.player2"
                    value={formData.teamA.player2}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-200 bg-white/80"
                    placeholder="Player 2 Name"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="teamB.player1" className="block text-sm font-medium text-gray-700 mb-1">
                    Team B - Player 1
                  </label>
                  <input
                    id="teamB.player1"
                    type="text"
                    name="teamB.player1"
                    value={formData.teamB.player1}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-200 bg-white/80"
                    placeholder="Player 1 Name"
                  />
                </div>
                <div>
                  <label htmlFor="teamB.player2" className="block text-sm font-medium text-gray-700 mb-1">
                    Team B - Player 2
                  </label>
                  <input
                    id="teamB.player2"
                    type="text"
                    name="teamB.player2"
                    value={formData.teamB.player2}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-200 bg-white/80"
                    placeholder="Player 2 Name"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Total Sets */}
          <div>
            <label htmlFor="totalSets" className="block text-sm font-medium text-gray-700 mb-1">
              Total Sets
            </label>
            <input
              id="totalSets"
              type="number"
              name="totalSets"
              value={formData.totalSets}
              onChange={handleChange}
              min="1"
              max="5"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-200 bg-white/80"
              placeholder="1-5"
            />
          </div>

          {/* Match Points */}
          <div>
            <label htmlFor="matchPoints" className="block text-sm font-medium text-gray-700 mb-1">
              Match Points
            </label>
            <select
              id="matchPoints"
              name="matchPoints"
              value={formData.matchPoints}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-200"
            >
              <option value="11">11</option>
              <option value="15">15</option>
              <option value="21">21</option>
            </select>
          </div>

          {/* Venue */}
          <div>
            <label htmlFor="venue" className="block text-sm font-medium text-gray-700 mb-1">
              Venue
            </label>
            <input
              id="venue"
              type="text"
              name="venue"
              value={formData.venue}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-200 bg-white/80"
              placeholder="Enter venue name"
            />
          </div>

          {/* Date */}
          <div>
            <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
              Date
            </label>
            <input
              id="date"
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-200 bg-white/80"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all duration-200 font-medium shadow-md hover:shadow-lg"
          >
            Create Match
          </button>
        </form>
      </div>
    </div>
  );
};

export default ConductMatchPage;