// src/components/PublicScoreViewPage.jsx
import React, { useState, useEffect } from "react";
import { fetchPublicMatches } from "../utils/api"; // Import the utility function


const PublicScoreViewPage = () => {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("all"); // Dropdown filter state

  useEffect(() => {
    const fetchMatchesData = async () => {
      try {
        setLoading(true);
        const response = await fetchPublicMatches(); // Use the utility function
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
    const interval = setInterval(fetchMatchesData, 5000); // Poll every 5 seconds for updates
    return () => clearInterval(interval);
  }, []);

  if (loading) return <div className="loading">Loading matches...</div>;
  if (error) return <div className="error">{error}</div>;

  // Filter matches based on dropdown selection
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

  return (
    <div className="public-score-view-container">
      <div className="public-score-header">
        <h2>Public Score View</h2>
        <div className="filter-container">
          <label htmlFor="status-filter">Filter by Status: </label>
          <select
            id="status-filter"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="all">All Matches</option>
            <option value="live">Live Matches</option>
            <option value="upcoming">Upcoming Matches</option>
            <option value="completed">Completed Matches</option>
          </select>
        </div>
      </div>

      {filter === "all" ? (
        <>
          <div className="matches-section">
            <h3>Live Matches</h3>
            {ongoingMatches.length === 0 ? (
              <p className="no-matches">No live matches currently.</p>
            ) : (
              ongoingMatches.map((match) => {
                const { entityA, entityB, scoreA, scoreB, points, completedSets, currentSet, winner } = getMatchDetails(match);
                return (
                  <div key={match.id} className="match-card ongoing">
                    <h4>{entityA} vs {entityB}</h4>
                    <p>Match Type: {match.matchType}</p>
                    <p>Venue: {match.venue}</p>
                    <p>Date: {new Date(match.date).toLocaleDateString()}</p>
                    <p>Current Set: {currentSet} of {match.totalSets}</p>
                    <div className="score-display">
                      <div className="team-score">
                        <h5>{entityA}</h5>
                        <p className="score">{scoreA}</p>
                      </div>
                      <div className="vs">VS</div>
                      <div className="team-score">
                        <h5>{entityB}</h5>
                        <p className="score">{scoreB}</p>
                      </div>
                    </div>
                    <div className="sets-summary">
                      <h5>Completed Sets</h5>
                      {completedSets.length === 0 ? (
                        <p>No sets completed yet.</p>
                      ) : (
                        completedSets.map((set, index) => (
                          <div key={`${match.id}-set-${set.setNumber}-${index}`} className="set-info">
                            <p>Set {set.setNumber}: {set.scoreA} - {set.scoreB}</p>
                            <p>Winner: {set.winner}</p>
                          </div>
                        ))
                      )}
                    </div>
                    <div className="points-history">
                      <h5>Points History (Current Set)</h5>
                      {points.length === 0 ? (
                        <p>No points recorded yet.</p>
                      ) : (
                        <ul className="points-list">
                          {points.map((point, index) => (
                            <li key={`${match.id}-point-${point.id}-${index}`} className="point-item">
                              {point.scorer === "A" ? entityA : entityB} scored at{" "}
                              {new Date(point.timestamp).toLocaleTimeString()}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="matches-section">
            <h3>Upcoming Matches</h3>
            {pendingMatches.length === 0 ? (
              <p className="no-matches">No upcoming matches scheduled.</p>
            ) : (
              pendingMatches.map((match) => {
                const { entityA, entityB } = getMatchDetails(match);
                return (
                  <div key={match.id} className="match-card pending">
                    <h4>{entityA} vs {entityB}</h4>
                    <p>Match Type: {match.matchType}</p>
                    <p>Venue: {match.venue}</p>
                    <p>Date: {new Date(match.date).toLocaleDateString()}</p>
                    <p>Total Sets: {match.totalSets}</p>
                    <p className={`status ${match.status.toLowerCase()}`}>Status: {match.status}</p>
                  </div>
                );
              })
            )}
          </div>

          <div className="matches-section">
            <h3>Completed Matches</h3>
            {completedMatches.length === 0 ? (
              <p className="no-matches">No matches completed yet.</p>
            ) : (
              completedMatches.map((match) => {
                const { entityA, entityB, scoreA, scoreB, completedSets, winner } = getMatchDetails(match);
                return (
                  <div key={match.id} className="match-card completed">
                    <h4>{entityA} vs {entityB}</h4>
                    <p>Match Type: {match.matchType}</p>
                    <p>Venue: {match.venue}</p>
                    <p>Date: {new Date(match.date).toLocaleDateString()}</p>
                    <p>Final Set Score: {scoreA} - {scoreB}</p>
                    <p className="match-winner">Winner: {winner}</p>
                    <div className="sets-summary">
                      <h5>Completed Sets</h5>
                      {completedSets.map((set, index) => (
                        <div key={`${match.id}-set-${set.setNumber}-${index}`} className="set-info">
                          <p>Set {set.setNumber}: {set.scoreA} - {set.scoreB}</p>
                          <p>Winner: {set.winner}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </>
      ) : (
        <div className="matches-section">
          <h3>{filter === "live" ? "Live Matches" : filter === "upcoming" ? "Upcoming Matches" : "Completed Matches"}</h3>
          {filteredMatches.length === 0 ? (
            <p className="no-matches">{`No ${filter} matches available.`}</p>
          ) : (
            filteredMatches.map((match) => {
              const { entityA, entityB, scoreA, scoreB, points, completedSets, currentSet, winner } = getMatchDetails(match);
              return (
                <div key={match.id} className={`match-card ${match.status}`}>
                  <h4>{entityA} vs {entityB}</h4>
                  <p>Match Type: {match.matchType}</p>
                  <p>Venue: {match.venue}</p>
                  <p>Date: {new Date(match.date).toLocaleDateString()}</p>
                  {match.status === "pending" ? (
                    <>
                      <p>Total Sets: {match.totalSets}</p>
                      <p className={`status ${match.status.toLowerCase()}`}>Status: {match.status}</p>
                    </>
                  ) : (
                    <>
                      {match.status === "completed" ? (
                        <>
                          <p>Final Set Score: {scoreA} - {scoreB}</p>
                          <p className="match-winner">Winner: {winner}</p>
                        </>
                      ) : (
                        <>
                          <p>Current Set: {currentSet} of {match.totalSets}</p>
                          <div className="score-display">
                            <div className="team-score">
                              <h5>{entityA}</h5>
                              <p className="score">{scoreA}</p>
                            </div>
                            <div className="vs">VS</div>
                            <div className="team-score">
                              <h5>{entityB}</h5>
                              <p className="score">{scoreB}</p>
                            </div>
                          </div>
                        </>
                      )}
                      <div className="sets-summary">
                        <h5>Completed Sets</h5>
                        {completedSets.length === 0 ? (
                          <p>No sets completed yet.</p>
                        ) : (
                          completedSets.map((set, index) => (
                            <div key={`${match.id}-set-${set.setNumber}-${index}`} className="set-info">
                              <p>Set {set.setNumber}: {set.scoreA} - {set.scoreB}</p>
                              <p>Winner: {set.winner}</p>
                            </div>
                          ))
                        )}
                      </div>
                      {match.status !== "completed" && (
                        <div className="points-history">
                          <h5>Points History (Current Set)</h5>
                          {points.length === 0 ? (
                            <p>No points recorded yet.</p>
                          ) : (
                            <ul className="points-list">
                              {points.map((point, index) => (
                                <li key={`${match.id}-point-${point.id}-${index}`} className="point-item">
                                  {point.scorer === "A" ? entityA : entityB} scored at{" "}
                                  {new Date(point.timestamp).toLocaleTimeString()}
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

export default PublicScoreViewPage;