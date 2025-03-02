const express = require("express");
const cors = require("cors");
const jsonfile = require("jsonfile");
const ExcelJS = require("exceljs");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = 5000;
const DATA_FILE = path.resolve(__dirname, "data.json");

app.use(cors());
app.use(express.json());

const initializeData = async () => {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      console.log("data.json not found, creating new file...");
      await jsonfile.writeFile(DATA_FILE, { matches: [] }, { spaces: 2 });
    } else {
      const data = await jsonfile.readFile(DATA_FILE);
      console.log("data.json loaded successfully with", data.matches.length, "matches");
    }
  } catch (err) {
    console.error("Failed to initialize data.json:", err);
    await jsonfile.writeFile(DATA_FILE, { matches: [] }, { spaces: 2 });
  }
};

initializeData().then(() => {
  app.get("/api/matches", async (req, res) => {
    try {
      const data = await jsonfile.readFile(DATA_FILE);
      console.log("GET /api/matches - Fetched:", data.matches.length, "matches");
      res.json(data.matches);
    } catch (err) {
      console.error("Error in GET /api/matches:", err);
      res.status(500).json({ error: "Failed to read matches", details: err.message });
    }
  });

  app.get("/api/matches/:id", async (req, res) => {
    try {
      const matchId = req.params.id;
      const data = await jsonfile.readFile(DATA_FILE);
      const match = data.matches.find((m) => m.id === matchId);
      if (!match) {
        console.log(`GET /api/matches/${matchId} - Match not found`);
        return res.status(404).json({ error: "Match not found" });
      }
      console.log(`GET /api/matches/${matchId} - Match found`);
      res.json(match);
    } catch (err) {
      console.error("Error in GET /api/matches/:id:", err);
      res.status(500).json({ error: "Failed to fetch match", details: err.message });
    }
  });

  app.post("/api/matches", async (req, res) => {
    try {
      const data = await jsonfile.readFile(DATA_FILE);
      const matchId = `${Date.now()}`;
      const newMatch = {
        ...req.body,
        id: matchId,
        points: [],
        completedSets: [],
      };
      data.matches.push(newMatch);
      await jsonfile.writeFile(DATA_FILE, data, { spaces: 2 });
      console.log("POST /api/matches - Match added with ID:", matchId);
      res.status(201).json(newMatch);
    } catch (err) {
      console.error("Error in POST /api/matches:", err);
      res.status(500).json({ error: "Failed to add match", details: err.message });
    }
  });

  app.put("/api/matches/:id", async (req, res) => {
    try {
      const matchId = req.params.id;
      console.log(`PUT /api/matches/${matchId} - Updating match`);
      const data = await jsonfile.readFile(DATA_FILE);
      const matchIndex = data.matches.findIndex((m) => m.id === matchId);

      if (matchIndex === -1) {
        console.log(`PUT /api/matches/${matchId} - Match not found`);
        return res.status(404).json({ error: "Match not found" });
      }

      const updatedMatch = {
        ...data.matches[matchIndex],
        ...req.body,
        id: matchId,
      };

      data.matches[matchIndex] = updatedMatch;
      await jsonfile.writeFile(DATA_FILE, data, { spaces: 2 });
      console.log(`PUT /api/matches/${matchId} - Match updated successfully`);
      res.json(updatedMatch);
    } catch (err) {
      console.error("Error in PUT /api/matches/:id:", err);
      res.status(500).json({ error: "Failed to update match", details: err.message });
    }
  });

  app.delete("/api/matches/:id", async (req, res) => {
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
        return res.status(404).json({ error: "Match not found" });
      }

      data.matches.splice(matchIndex, 1);
      await jsonfile.writeFile(DATA_FILE, data, { spaces: 2 });
      console.log(`DELETE /api/matches/${matchId} - Match deleted successfully`);
      res.json({ message: "Match deleted successfully" });
    } catch (err) {
      console.error("Error in DELETE /api/matches/:id:", err);
      res.status(500).json({ error: "Failed to delete match", details: err.message });
    }
  });

  app.get("/api/export", async (req, res) => {
    try {
      const data = await jsonfile.readFile(DATA_FILE);
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Matches");

      // Define columns including Winner and Set Points
      worksheet.columns = [
        { header: "Match ID", key: "id", width: 25 },
        { header: "Player A", key: "playerA", width: 20 },
        { header: "Player B", key: "playerB", width: 20 },
        { header: "Total Sets", key: "totalSets", width: 10 },
        { header: "Venue", key: "venue", width: 20 },
        { header: "Date", key: "date", width: 15 },
        { header: "Status", key: "status", width: 15 },
        { header: "Winner", key: "winner", width: 20 },
        { header: "Set Points", key: "setPoints", width: 30 },
      ];

      // Add rows with calculated winner and set points
      data.matches.forEach((match) => {
        let winner = "N/A";
        let setPoints = "N/A";

        if (match.status === "completed" && match.completedSets && match.completedSets.length > 0) {
          const winsA = match.completedSets.reduce(
            (count, set) => count + (set.winner === match.playerA ? 1 : 0),
            0
          );
          const winsB = match.completedSets.reduce(
            (count, set) => count + (set.winner === match.playerB ? 1 : 0),
            0
          );
          winner = winsA > winsB ? match.playerA : winsB > winsA ? match.playerB : "Tie";
          setPoints = match.completedSets.map(set => `${set.scoreA}-${set.scoreB}`).join(", ");
        }

        worksheet.addRow({
          id: match.id,
          playerA: match.playerA,
          playerB: match.playerB,
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
      res.status(500).json({ error: "Failed to export matches", details: err.message });
    }
  });

  app.get("/api/debug/data", async (req, res) => {
    try {
      const data = await jsonfile.readFile(DATA_FILE);
      res.json({
        matchCount: data.matches.length,
        matchIds: data.matches.map((m) => m.id),
        firstMatch: data.matches.length > 0 ? data.matches[0] : null,
      });
    } catch (err) {
      res.status(500).json({ error: "Failed to read data file", details: err.message });
    }
  });

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Using data file: ${DATA_FILE}`);
  });
});