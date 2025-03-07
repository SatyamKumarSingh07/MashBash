require('dotenv').config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const ExcelJS = require("exceljs");
const jwt = require("jsonwebtoken");

const app = express();
const PORT = process.env.PORT || 5000;

// CORS configuration
const corsOptions = {
  origin: ["http://localhost:5173", "https://badbash.netlify.app"],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));
app.use(express.json());

// Connect to MongoDB
const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://zenprime0990:Satyam0101@cluster0.q1inr.mongodb.net/badbash?retryWrites=true&w=majority";
mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Define Match Schema
const matchSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  matchType: { type: String, required: true },
  playerA: String,
  playerB: String,
  teamA: { player1: String, player2: String },
  teamB: { player1: String, player2: String },
  totalSets: Number,
  matchPoints: Number,
  venue: String,
  date: String,
  status: { type: String, default: "pending" },
  points: [{ id: String, scorer: String, timestamp: String, setNumber: Number }],
  completedSets: [{ setNumber: Number, scoreA: Number, scoreB: Number, winner: String }],
  servingTeam: String,
});

const Match = mongoose.model("Match", matchSchema);

app.get("/", (req, res) => {
  res.json({ message: "Welcome to the MashBash API", status: "running" });
});

const VALID_ID = process.env.VALID_ID || "uniqueId123";
const VALID_PASSWORD = process.env.VALID_PASSWORD || "secretPassword123";
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

// Middleware to authenticate token
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

  if (!id || !password) {
    return res.status(400).json({ success: false, message: "ID and password are required" });
  }

  if (id === VALID_ID && password === VALID_PASSWORD) {
    const token = jwt.sign({ id }, JWT_SECRET, { expiresIn: "24h" });
    console.log(`POST /api/login - Successful login for ID: ${id}`);
    return res.json({ success: true, token });
  } else {
    console.log(`POST /api/login - Failed login attempt for ID: ${id}`);
    return res.status(401).json({ success: false, message: "Invalid ID or Password" });
  }
});

// Handle OPTIONS preflight requests
app.options("/api/login", cors(corsOptions));

// Protected match endpoints
app.get("/api/matches", authenticateToken, async (req, res) => {
  try {
    const matches = await Match.find();
    console.log("GET /api/matches - Fetched:", matches.length, "matches");
    res.json(matches);
  } catch (err) {
    console.error("Error in GET /api/matches:", err);
    res.status(500).json({ success: false, error: "Failed to read matches", details: err.message });
  }
});

app.get("/api/matches/:id", authenticateToken, async (req, res) => {
  try {
    const matchId = req.params.id;
    const match = await Match.findOne({ id: matchId });
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
    const matchId = `${Date.now()}`;
    const newMatch = new Match({
      ...req.body,
      id: matchId,
      points: [],
      completedSets: [],
      matchType: req.body.matchType.toLowerCase(),
    });
    await newMatch.save();
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
    const match = await Match.findOne({ id: matchId });

    if (!match) {
      console.log(`PUT /api/matches/${matchId} - Match not found`);
      return res.status(404).json({ success: false, error: "Match not found" });
    }

    const updatedMatch = {
      ...req.body,
      id: matchId, // Fixed from updateMatchId to matchId
      matchType: req.body.matchType?.toLowerCase() || match.matchType,
    };

    await Match.updateOne({ id: matchId }, updatedMatch);
    const updated = await Match.findOne({ id: matchId });
    console.log(`PUT /api/matches/${matchId} - Match updated successfully`);
    res.json(updated);
  } catch (err) {
    console.error("Error in PUT /api/matches/:id:", err);
    res.status(500).json({ success: false, error: "Failed to update match", details: err.message });
  }
});

app.delete("/api/matches/:id", authenticateToken, async (req, res) => {
  try {
    const matchId = req.params.id;
    console.log(`DELETE /api/matches/${matchId} - Attempting to delete match`);
    const result = await Match.deleteOne({ id: matchId });

    if (result.deletedCount === 0) {
      console.log(`DELETE /api/matches/${matchId} - Match not found`);
      return res.status(404).json({ success: false, error: "Match not found" });
    }

    console.log(`DELETE /api/matches/${matchId} - Match deleted successfully`);
    res.json({ success: true, message: "Match deleted successfully" });
  } catch (err) {
    console.error("Error in DELETE /api/matches/:id:", err);
    res.status(500).json({ success: false, error: "Failed to delete match", details: err.message });
  }
});

app.get("/api/export", authenticateToken, async (req, res) => {
  try {
    const matches = await Match.find();
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Matches");

    worksheet.columns = [
      { header: "Match ID", key: "id", width: 25 },
      { header: "Match Type", key: "matchType", width: 15 },
      { header: "Player A / Team A", key: "entityA", width: 25 },
      { header: "Player B / Team B", key: "entityB", width: 25 },
      { header: "Match Points", key: "matchPoints", width: 12 },
      { header: "Total Sets", key: "totalSets", width: 10 },
      { header: "Venue", key: "venue", width: 20 },
      { header: "Date", key: "date", width: 15 },
      { header: "Status", key: "status", width: 15 },
      { header: "Winner", key: "winner", width: 20 },
      { header: "Set Points", key: "setPoints", width: 30 },
    ];

    matches.forEach((match) => {
      let winner = "N/A";
      let setPoints = "N/A";
      let entityA =
        match.matchType.toLowerCase() === "singles"
          ? match.playerA
          : `${match.teamA?.player1}/${match.teamA?.player2}`;
      let entityB =
        match.matchType.toLowerCase() === "singles"
          ? match.playerB
          : `${match.teamB?.player1}/${match.teamB?.player2}`;

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
        matchPoints: match.matchPoints || "N/A",
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
    const matches = await Match.find();
    res.json({
      success: true,
      matchCount: matches.length,
      matchIds: matches.map((m) => m.id),
      firstMatch: matches.length > 0 ? matches[0] : null,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: "Failed to read data", details: err.message });
  }
});

// Public endpoint to fetch all matches
app.get("/api/public/matches", async (req, res) => {
  try {
    const matches = await Match.find();
    console.log("GET /api/public/matches - Fetched:", matches.length, "matches");
    res.json(matches);
  } catch (err) {
    console.error("Error in GET /api/public/matches:", err);
    res.status(500).json({ success: false, error: "Failed to fetch matches", details: err.message });
  }
});

// Start server
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;