import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

// Fixing the logo import for Vite
const logo = new URL("../assets/BadBash2.jpg", import.meta.url).href;

const Navbar = ({ matches = [] }) => {
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleNavigation = (path) => {
    navigate(path);
    setIsMobileMenuOpen(false);
  };

  const renderMatchParticipants = (match) => {
    const matchType = match.matchType?.toLowerCase() || "";
    if (matchType === "singles") {
      return `${match.playerA || "TBD"} vs ${match.playerB || "TBD"}`;
    } else if (matchType === "doubles" || matchType === "mixed") {
      return `${match.teamA?.player1 || "TBD"}/${match.teamA?.player2 || "TBD"} 
              vs ${match.teamB?.player1 || "TBD"}/${match.teamB?.player2 || "TBD"}`;
    }
    return "Match Details Unavailable";
  };

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <div 
          className="brand-container"
          onClick={() => handleNavigation("/")}
          style={{ cursor: "pointer", display: "flex", alignItems: "center" }}
        >
          <img 
            src={logo} 
            alt="BadBash Logo" 
            style={{ width: "40px", height: "40px", marginRight: "10px" }} 
          />
          <h1 className="mashbash-heading">BADBASH</h1>
        </div>
      </div>

      <button 
        className="hamburger-btn" 
        onClick={toggleMobileMenu}
      >
        ☰
      </button>

      <div className={`navbar-links ${isMobileMenuOpen ? "active" : ""}`}>
        <button className="nav-btn" onClick={() => handleNavigation("/")}>
          Conduct Match
        </button>
        <button className="nav-btn" onClick={() => handleNavigation("/fixtures")}>
          Fixtures
        </button>
        <button className="nav-btn" onClick={() => handleNavigation("/standings")}>
          Leaderboard
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
                  onClick={() => handleNavigation(`/scorekeeper/${match.id}`)}
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
                  onClick={() => handleNavigation(`/summary/${match.id}`)}
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