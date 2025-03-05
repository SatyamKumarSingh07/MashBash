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
    <div className="conduct-match-page" style={{ backgroundImage: `url(${backgroundImage})` }}>
      {error && <div className="error">{error}</div>}
      <form onSubmit={handleSubmit}>
        <label>
          Match Type:
          <select name="matchType" value={formData.matchType} onChange={handleChange}>
            <option value="singles">Singles</option>
            <option value="doubles">Doubles</option>
            <option value="mixed">Mixed</option>
          </select>
        </label>

        {formData.matchType.toLowerCase() === "singles" ? (
          <>
            <label>
              Player A:
              <input
                type="text"
                name="playerA"
                value={formData.playerA}
                onChange={handleChange}
                required
              />
            </label>
            <label>
              Player B:
              <input
                type="text"
                name="playerB"
                value={formData.playerB}
                onChange={handleChange}
                required
              />
            </label>
          </>
        ) : (
          <>
            <label>
              Team A Player 1:
              <input
                type="text"
                name="teamA.player1"
                value={formData.teamA.player1}
                onChange={handleChange}
                required
              />
            </label>
            <label>
              Team A Player 2:
              <input
                type="text"
                name="teamA.player2"
                value={formData.teamA.player2}
                onChange={handleChange}
                required
              />
            </label>
            <label>
              Team B Player 1:
              <input
                type="text"
                name="teamB.player1"
                value={formData.teamB.player1}
                onChange={handleChange}
                required
              />
            </label>
            <label>
              Team B Player 2:
              <input
                type="text"
                name="teamB.player2"
                value={formData.teamB.player2}
                onChange={handleChange}
                required
              />
            </label>
          </>
        )}

        <label>
          Total Sets:
          <input
            type="number"
            name="totalSets"
            value={formData.totalSets}
            onChange={handleChange}
            min="1"
            max="5"
            required
          />
        </label>
        <label>
          Venue:
          <input
            type="text"
            name="venue"
            value={formData.venue}
            onChange={handleChange}
            required
          />
        </label>
        <label>
          Date:
          <input
            type="date"
            name="date"
            value={formData.date}
            onChange={handleChange}
            required
          />
        </label>
        <button type="submit">Create Match</button>
      </form>
    </div>
  );
};

export default ConductMatchPage;