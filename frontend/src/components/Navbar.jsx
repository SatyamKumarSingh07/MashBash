// src/components/Navbar.jsx
import React from "react";
import { useNavigate } from "react-router-dom";

const Navbar = ({ matches }) => {
  const navigate = useNavigate();

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <h1 
          className="mashbash-heading" 
          onClick={() => navigate("/")}
          style={{ cursor: "pointer" }} // Adding cursor pointer for visual feedback
        >
          MashBash
        </h1>
      </div>
      <div className="navbar-links">
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
                  {match.playerA} vs {match.playerB}
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
                  {match.playerA} vs {match.playerB}
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