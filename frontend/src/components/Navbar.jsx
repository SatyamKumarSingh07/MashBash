import React, { useState } from "react";
import { useNavigate } from "react-router-dom";


const Navbar = ({ matches }) => {
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false); // State to manage mobile menu visibility

  // Helper function to render match participants based on match type
  const renderMatchParticipants = (match) => {
    const matchType = match.matchType ? match.matchType.toLowerCase() : "";

    if (matchType === "singles") {
      const playerA = match.playerA || "TBD";
      const playerB = match.playerB || "TBD";
      return `${playerA} vs ${playerB}`;
    } else if (matchType === "mixed") {
      const teamA1 = match.teamA?.player1 || "TBD";
      const teamA2 = match.teamA?.player2 || "TBD";
      const teamB1 = match.teamB?.player1 || "TBD";
      const teamB2 = match.teamB?.player2 || "TBD";
      return `${teamA1}/${teamA2} vs ${teamB1}/${teamB2}`;
    }

    return "Match Details Unavailable";
  };

  // Toggle mobile menu visibility
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <h1
          className="mashbash-heading"
          onClick={() => navigate("/")}
          style={{ cursor: "pointer" }}
        >
          MashBash
        </h1>
      </div>

      {/* Hamburger menu button for mobile */}
      <button className="hamburger-btn" onClick={toggleMobileMenu}>
        ☰
      </button>

      {/* Navbar links */}
      <div className={`navbar-links ${isMobileMenuOpen ? "active" : ""}`}>
        <button className="nav-btn" onClick={() => navigate("/")}>
          Conduct Match
        </button>
        <button className="nav-btn" onClick={() => navigate("/fixtures")}>
          Fixtures
        </button>
        <div className="dropdown">
          <button className="nav-btn">Scorekeeper</button>
          <div className="dropdown-content">
            {matches.length === 0 ? (
              <button disabled>No matches available</button>
            ) : (
              matches.map((match) => (
                <button
                  key={match.id}
                  onClick={() => navigate(`/scorekeeper/${match.id}`)}
                >
                  {renderMatchParticipants(match)}
                </button>
              ))
            )}
          </div>
        </div>
        <div className="dropdown">
          <button className="nav-btn">Summary</button>
          <div className="dropdown-content">
            {matches.length === 0 ? (
              <button disabled>No matches available</button>
            ) : (
              matches.map((match) => (
                <button
                  key={match.id}
                  onClick={() => navigate(`/summary/${match.id}`)}
                >
                  {renderMatchParticipants(match)}
                </button>
              ))
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;