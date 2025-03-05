const express = require("express");
const cors = require("cors");
const jsonfile = require("jsonfile");
const ExcelJS = require("exceljs");
const path = require("path");
const fs = require("fs");
const jwt = require("jsonwebtoken");

const app = express();
const PORT = process.env.PORT || 5000; // Use Render's PORT or fallback to 5000 locally
const DATA_FILE = path.resolve(__dirname, "data.json");

// Configure CORS to allow requests from specific origins (local and Netlify)
const corsOptions = {
  origin: [
    "http://localhost:5173", // Allow local development (Vite default)
    "https://badbash.netlify.app", // Your Netlify frontend URL
  ],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"], // Allow these HTTP methods
  allowedHeaders: ["Content-Type", "Authorization"], // Allow these headers
  credentials: true, // Allow cookies if needed
  optionsSuccessStatus: 200, // Some browsers (e.g., Safari) require this for OPTIONS
};

app.use(cors(corsOptions));
app.use(express.json());

// Add a root route for basic status
app.get("/", (req, res) => {
  res.json({ message: "Welcome to the MashBash API", status: "running" });
});

// Define hardcoded credentials (replace with environment variables for production)
const VALID_ID = process.env.VALID_ID || "uniqueId123"; // Use environment variable or fallback
const VALID_PASSWORD = process.env.VALID_PASSWORD || "secretPassword123"; // Use environment variable or fallback
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key"; // Use environment variable for JWT secret

// Middleware to authenticate token for protected routes
const authenticateToken = (req, res, next) => {
  const token = req.headers["authorization"]?.split(" ")[1];
  if (!token) return res.status(401).json({ success: false, message: "No token provided" });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ success: false, message: "Invalid token" });
    req.user = user;
    next();
  });
};

// Login endpoint
app.post("/api/login", (req, res) => {
  const { id, password } = req.body;

  // Validate input
  if (!id || !password) {
    return res.status(400).json({ success: false, message: "ID and password are required" });
  }

  // Check if ID and password match
  if (id === VALID_ID && password === VALID_PASSWORD) {
    // Generate a JWT token (expires in 24 hours)
    const token = jwt.sign({ id }, JWT_SECRET, { expiresIn: "24h" });
    console.log(`POST /api/login - Successful login for ID: ${id}`);
    return res.json({ success: true, token });
  } else {
    console.log(`POST /api/login - Failed login attempt for ID: ${id}`);
    return res.status(401).json({ success: false, message: "Invalid ID or Password" });
  }
});

// Handle OPTIONS preflight requests (CORS)
app.options("/api/login", cors(corsOptions));

// Protect /api/matches endpoints with authentication
app.get("/api/matches", authenticateToken, async (req, res) => {
  try {
    const data = await jsonfile.readFile(DATA_FILE);
    console.log("GET /api/matches - Fetched:", data.matches.length, "matches");
    res.json(data.matches);
  } catch (err) {
    console.error("Error in GET /api/matches:", err);
    res.status(500).json({ success: false, error: "Failed to read matches", details: err.message });
  }
});

app.get("/api/matches/:id", authenticateToken, async (req, res) => {
  try {
    const matchId = req.params.id;
    const data = await jsonfile.readFile(DATA_FILE);
    const match = data.matches.find((m) => m.id === matchId);
    if (!match) {
      console.log(`GET /api/matches/${matchId} - Match not found`);
      return res.status(404).json({ success: false, error: "Match not found" });
    }
    console.log(`GET /api/matches/${matchId} - Match found`);
    res.json(match);
  } catch (err) {
    console.error("Error in GET /api/matches/:id:", err);
    res.status(500).json({ success: false, error: "Failed to fetch match", details: err.message });
  }
});

app.post("/api/matches", authenticateToken, async (req, res) => {
  try {
    const data = await jsonfile.readFile(DATA_FILE);
    const matchId = `${Date.now()}`;
    const newMatch = {
      ...req.body,
      id: matchId,
      points: [],
      completedSets: [],
      matchType: req.body.matchType.toLowerCase(), // Normalize matchType to lowercase
    };
    data.matches.push(newMatch);
    await jsonfile.writeFile(DATA_FILE, data, { spaces: 2 });
    console.log("POST /api/matches - Match added with ID:", matchId);
    res.status(201).json(newMatch);
  } catch (err) {
    console.error("Error in POST /api/matches:", err);
    res.status(500).json({ success: false, error: "Failed to add match", details: err.message });
  }
});

app.put("/api/matches/:id", authenticateToken, async (req, res) => {
  try {
    const matchId = req.params.id;
    console.log(`PUT /api/matches/${matchId} - Updating match`);
    const data = await jsonfile.readFile(DATA_FILE);
    const matchIndex = data.matches.findIndex((m) => m.id === matchId);

    if (matchIndex === -1) {
      console.log(`PUT /api/matches/${matchId} - Match not found`);
      return res.status(404).json({ success: false, error: "Match not found" });
    }

    const updatedMatch = {
      ...data.matches[matchIndex],
      ...req.body,
      id: matchId,
      matchType: req.body.matchType?.toLowerCase() || data.matches[matchIndex].matchType, // Normalize matchType to lowercase
    };

    data.matches[matchIndex] = updatedMatch;
    await jsonfile.writeFile(DATA_FILE, data, { spaces: 2 });
    console.log(`PUT /api/matches/${matchId} - Match updated successfully`);
    res.json(updatedMatch);
  } catch (err) {
    console.error("Error in PUT /api/matches/:id:", err);
    res.status(500).json({ success: false, error: "Failed to update match", details: err.message });
  }
});

app.delete("/api/matches/:id", authenticateToken, async (req, res) => {
  try {
    const matchId = req.params.id;
    console.log(`DELETE /api/matches/${matchId} - Attempting to delete match`);
    const data = await jsonfile.readFile(DATA_FILE);

    console.log(
      `Current matches in data.json:`,
      data.matches.map((m) => m.id)
    );
    const matchIndex = data.matches.findIndex((match) => String(match.id) === String(matchId));

    if (matchIndex === -1) {
      console.log(`DELETE /api/matches/${matchId} - Match not found`);
      return res.status(404).json({ success: false, error: "Match not found" });
    }

    data.matches.splice(matchIndex, 1);
    await jsonfile.writeFile(DATA_FILE, data, { spaces: 2 });
    console.log(`DELETE /api/matches/${matchId} - Match deleted successfully`);
    res.json({ success: true, message: "Match deleted successfully" });
  } catch (err) {
    console.error("Error in DELETE /api/matches/:id:", err);
    res.status(500).json({ success: false, error: "Failed to delete match", details: err.message });
  }
});

app.get("/api/export", authenticateToken, async (req, res) => {
  try {
    const data = await jsonfile.readFile(DATA_FILE);
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Matches");

    worksheet.columns = [
      { header: "Match ID", key: "id", width: 25 },
      { header: "Match Type", key: "matchType", width: 15 },
      { header: "Player A / Team A", key: "entityA", width: 25 },
      { header: "Player B / Team B", key: "entityB", width: 25 },
      { header: "Total Sets", key: "totalSets", width: 10 },
      { header: "Venue", key: "venue", width: 20 },
      { header: "Date", key: "date", width: 15 },
      { header: "Status", key: "status", width: 15 },
      { header: "Winner", key: "winner", width: 20 },
      { header: "Set Points", key: "setPoints", width: 30 },
    ];

    data.matches.forEach((match) => {
      let winner = "N/A";
      let setPoints = "N/A";
      let entityA =
        match.matchType.toLowerCase() === "singles"
          ? match.playerA
          : `${match.teamA.player1}/${match.teamA.player2}`;
      let entityB =
        match.matchType.toLowerCase() === "singles"
          ? match.playerB
          : `${match.teamB.player1}/${match.teamB.player2}`;

      if (match.status === "completed" && match.completedSets && match.completedSets.length > 0) {
        const winsA = match.completedSets.reduce(
          (count, set) =>
            count +
            (set.winner === (match.matchType.toLowerCase() === "singles" ? match.playerA : "Team A")
              ? 1
              : 0),
          0
        );
        const winsB = match.completedSets.reduce(
          (count, set) =>
            count +
            (set.winner === (match.matchType.toLowerCase() === "singles" ? match.playerB : "Team B")
              ? 1
              : 0),
          0
        );
        winner =
          winsA > winsB
            ? match.matchType.toLowerCase() === "singles"
              ? match.playerA
              : "Team A"
            : winsB > winsA
            ? match.matchType.toLowerCase() === "singles"
              ? match.playerB
              : "Team B"
            : "Tie";
        setPoints = match.completedSets.map((set) => `${set.scoreA}-${set.scoreB}`).join(", ");
      }

      worksheet.addRow({
        id: match.id,
        matchType: match.matchType,
        entityA: entityA,
        entityB: entityB,
        totalSets: match.totalSets,
        venue: match.venue,
        date: match.date,
        status: match.status,
        winner: winner,
        setPoints: setPoints,
      });
    });

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", "attachment; filename=matches.xlsx");
    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error("Error in GET /api/export:", err);
    res.status(500).json({ success: false, error: "Failed to export matches", details: err.message });
  }
});

app.get("/api/debug/data", authenticateToken, async (req, res) => {
  try {
    const data = await jsonfile.readFile(DATA_FILE);
    res.json({
      success: true,
      matchCount: data.matches.length,
      matchIds: data.matches.map((m) => m.id),
      firstMatch: data.matches.length > 0 ? data.matches[0] : null,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: "Failed to read data file", details: err.message });
  }
});

// New Public Endpoint for Audience Read-Only Access
app.get("/api/public/matches/:id", async (req, res) => {
  try {
    const matchId = req.params.id;
    const data = await jsonfile.readFile(DATA_FILE);
    const match = data.matches.find((m) => m.id === matchId);
    if (!match) {
      console.log(`GET /api/public/matches/${matchId} - Match not found`);
      return res.status(404).json({ success: false, error: "Match not found" });
    }
    console.log(`GET /api/public/matches/${matchId} - Public match data fetched`);
    // Optionally sanitize data here if you want to hide sensitive info
    res.json(match);
  } catch (err) {
    console.error("Error in GET /api/public/matches/:id:", err);
    res.status(500).json({ success: false, error: "Failed to fetch match", details: err.message });
  }
});

// Listen on 0.0.0.0 for Render compatibility
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Using data file: ${DATA_FILE}`);
});

module.exports = app; // Export for testing or modularity