import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const ConductMatchPage = ({ addMatch }) => {
  const [playerA, setPlayerA] = useState("");
  const [playerB, setPlayerB] = useState("");
  const [totalSets, setTotalSets] = useState("3");
  const [venue, setVenue] = useState("");
  const [date, setDate] = useState("");
  const [error, setError] = useState("");

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!playerA || !playerB || !venue || !date) {
      setError("Please fill all fields");
      return;
    }

    const newMatch = {
      playerA,
      playerB,
      totalSets: parseInt(totalSets),
      venue,
      date,
      status: "pending",
      // Remove ID generation here, let the server handle it
    };

    try {
      const response = await axios.post("http://localhost:5000/api/matches", newMatch);
      console.log("Match created with ID:", response.data.id);
      addMatch(response.data); // Update the matches state with the server-generated ID
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