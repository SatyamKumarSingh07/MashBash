import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const ConductMatchPage = ({ addMatch }) => {
  const [matchType, setMatchType] = useState("singles"); // Default to Singles
  const [playerA, setPlayerA] = useState(""); // Singles Player A
  const [playerB, setPlayerB] = useState(""); // Singles Player B
  const [teamA1, setTeamA1] = useState(""); // Mixed Team A Player 1
  const [teamA2, setTeamA2] = useState(""); // Mixed Team A Player 2
  const [teamB1, setTeamB1] = useState(""); // Mixed Team B Player 1
  const [teamB2, setTeamB2] = useState(""); // Mixed Team B Player 2
  const [totalSets, setTotalSets] = useState("3");
  const [venue, setVenue] = useState("");
  const [date, setDate] = useState("");
  const [error, setError] = useState("");

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Validation based on match type
    if (matchType === "singles") {
      if (!playerA || !playerB || !venue || !date) {
        setError("Please fill all fields for Singles match");
        return;
      }
    } else if (matchType === "Mixed") {
      if (!teamA1 || !teamA2 || !teamB1 || !teamB2 || !venue || !date) {
        setError("Please fill all fields for Mixed match");
        return;
      }
    }

    const newMatch = {
      matchType, // Add match type to the object
      ...(matchType === "singles"
        ? { playerA, playerB } // Singles fields
        : {
            teamA: { player1: teamA1, player2: teamA2 }, // Mixed Team A
            teamB: { player1: teamB1, player2: teamB2 }, // Mixed Team B
          }),
      totalSets: parseInt(totalSets),
      venue,
      date,
      status: "pending",
    };

    try {
      const response = await axios.post("http://localhost:5000/api/matches", newMatch);
      console.log("Match created with ID:", response.data.id);
      addMatch(response.data); // Update the matches state with the server-generated match
      alert("Match added to fixture!");
      navigate("/fixtures");
    } catch (err) {
      setError("Failed to add match: " + err.message);
    }
  };

  return (
    <div>
      {error && <p className="error">{error}</p>}
      <form onSubmit={handleSubmit}>
        <div>
          <label>Match Type:</label>
          <select value={matchType} onChange={(e) => setMatchType(e.target.value)}>
            <option value="singles">Singles</option>
            <option value="Mixed">Mixed</option>
          </select>
        </div>

        {matchType === "singles" ? (
          <>
            <div>
              <label>Player A:</label>
              <input
                value={playerA}
                onChange={(e) => setPlayerA(e.target.value)}
                placeholder="Enter Player A name"
              />
            </div>
            <div>
              <label>Player B:</label>
              <input
                value={playerB}
                onChange={(e) => setPlayerB(e.target.value)}
                placeholder="Enter Player B name"
              />
            </div>
          </>
        ) : (
          <>
            <div>
              <label>Team A - Player 1:</label>
              <input
                value={teamA1}
                onChange={(e) => setTeamA1(e.target.value)}
                placeholder="Enter Team A Player 1 name"
              />
            </div>
            <div>
              <label>Team A - Player 2:</label>
              <input
                value={teamA2}
                onChange={(e) => setTeamA2(e.target.value)}
                placeholder="Enter Team A Player 2 name"
              />
            </div>
            <div>
              <label>Team B - Player 1:</label>
              <input
                value={teamB1}
                onChange={(e) => setTeamB1(e.target.value)}
                placeholder="Enter Team B Player 1 name"
              />
            </div>
            <div>
              <label>Team B - Player 2:</label>
              <input
                value={teamB2}
                onChange={(e) => setTeamB2(e.target.value)}
                placeholder="Enter Team B Player 2 name"
              />
            </div>
          </>
        )}

        <div>
          <label>Number of Sets:</label>
          <select value={totalSets} onChange={(e) => setTotalSets(e.target.value)}>
            <option value="1">1</option>
            <option value="3">3</option>
            <option value="5">5</option>
          </select>
        </div>
        <div>
          <label>Venue:</label>
          <input
            value={venue}
            onChange={(e) => setVenue(e.target.value)}
            placeholder="Enter venue"
          />
        </div>
        <div>
          <label>Match Date:</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
        <button type="submit">Add this match to fixture</button>
      </form>
    </div>
  );
};

export default ConductMatchPage;