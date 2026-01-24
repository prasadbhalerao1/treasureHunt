import Team from "../models/Team.js";
import Location from "../models/Location.js";
import dbConnect from "../config/dbConnect.js";
import { hashPassword } from "../utils/auth.js";
import { randomBytes } from "node:crypto";

const WEBHOOK_URL = process.env.MAKE_WEBHOOK_URL;

// Helper: Shuffle for random path
function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

// 1. Dashboard Stats
export const getDashboardStats = async (req, res) => {
  try {
    await dbConnect();
    const { level } = req.query;

    let leaderboardData = [];

    if (level && level !== "Global") {
      const targetLevel = parseInt(level);
      // Filter: Teams who have reached at least this level index
      // (If I am at Index 6, I am playing Level 6. If I finished L6, I am at Index 7)
      // "Fastest Teams (Level 6)" usually implies completion.
      // But let's show anyone AT or PAST this level.
      // Actually, if I show people AT Level 6 (Index 6), they haven't finished it.
      // The table has a "Time" column. This implies completion time.
      // So strictly: currentLevelIndex > targetLevel (Completed targetLevel)
      // OR currentLevelIndex == targetLevel AND it's the last one?
      // Let's stick to: Show teams who have COMPLETED this level.
      // So currentLevelIndex > targetLevel.

      const teams = await Team.find({
        role: "CANDIDATE",
        currentLevelIndex: { $gt: targetLevel },
      })
        .select("teamId name currentLevelIndex lastLevelCompletedAt")
        .sort({ lastLevelCompletedAt: 1 })
        .limit(10);

      leaderboardData = teams.map((t) => {
        // Calculate Duration for targetLevel
        // Time = (CompletedAt of targetLevel) - (CompletedAt of targetLevel - 1)
        // If targetLevel is 1, previous is 0 (Start). 0 might not be in history?
        // Let's look for entry in levelHistory where level === targetLevel
        const currentEntry = t.levelHistory.find(
          (h) => h.level === t.currentLevelIndex,
        ); // Wait, we filtered by > targetLevel

        // We want data for "Fastest Teams (Level X)". So we need the time they took to finish Level X.
        // They are at t.currentLevelIndex (which is > targetLevel).
        // Find entry for targetLevel.

        // But wait, if they are at Level 7, and we want Fastest for Level 6.
        // We need entry where level == 6 in history (completion of L6).
        // Actually, my logic in gameController pushes "nextIndex".
        // If I finish L0->L1, nextIndex is 1. So I push {level: 1}.
        // So yes, finding {level: targetLevel} gives the completion timestamp of that level.

        const completionEntry = t.levelHistory?.find(
          (h) => h.level === targetLevel,
        );
        const completionTime = completionEntry
          ? new Date(completionEntry.completedAt)
          : t.lastLevelCompletedAt || new Date();

        // Start Time?
        // If targetLevel == 1, start was createdAt.
        // If targetLevel > 1, start was completion of (targetLevel - 1).

        let startTime = new Date(t.createdAt);
        if (targetLevel > 1) {
          const prevEntry = t.levelHistory?.find(
            (h) => h.level === targetLevel - 1,
          );
          if (prevEntry) startTime = new Date(prevEntry.completedAt);
        }

        const duration = completionTime - startTime;

        return {
          teamId: t.teamId,
          name: t.name,
          currentLevelIndex: t.currentLevelIndex,
          completedAt: completionTime,
          timeTaken: duration > 0 ? duration : 0,
        };
      });
    } else {
      // Global
      const teams = await Team.find({ role: "CANDIDATE" })
        .select("teamId name currentLevelIndex lastLevelCompletedAt")
        .sort({ currentLevelIndex: -1, lastLevelCompletedAt: 1 })
        .limit(10);

      leaderboardData = teams.map((t) => ({
        teamId: t.teamId,
        name: t.name,
        currentLevelIndex: t.currentLevelIndex,
        completedAt: t.lastLevelCompletedAt,
        timeTaken: 0,
      }));
    }

    const teamsPerLevel = await Team.aggregate([
      { $match: { role: "CANDIDATE" } },
      { $group: { _id: "$currentLevelIndex", count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);

    res.json({
      distribution: teamsPerLevel.map((i) => ({
        level: `Level ${i._id}`,
        count: i.count,
      })),
      leaderboard: leaderboardData,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server Error" });
  }
};

// 2. Team Management
export const getTeams = async (req, res) => {
  try {
    await dbConnect();
    const teams = await Team.find({ role: "CANDIDATE" }).select(
      "-passwordHash -salt -activeSessions",
    );
    res.json(teams);
  } catch (err) {
    res.status(500).json({ msg: "Server Error" });
  }
};

export const createTeam = async (req, res) => {
  try {
    await dbConnect();
    const { name, email, members, password } = req.body;

    const existing = await Team.findOne({ $or: [{ name }, { email }] });
    if (existing)
      return res.status(400).json({ msg: "Team Name or Email taken" });

    // Generate TeamID
    const suffix = randomBytes(2).toString("hex").toUpperCase();
    const prefix = name
      .substring(0, 3)
      .toUpperCase()
      .replace(/[^A-Z]/g, "X");
    const teamId = `${prefix}-${suffix}`;

    const hashedPassword = await hashPassword(password);
    const [salt, _] = hashedPassword.split(":");

    // Generate Path: Loc 0 -> 6 Random from 1-16
    const locationIds = Array.from({ length: 16 }, (_, i) => i + 1);
    const shuffledLocs = shuffle([...locationIds]);
    const path = [0, ...shuffledLocs.slice(0, 6)];

    const newTeam = await Team.create({
      teamId,
      name,
      email,
      passwordHash: hashedPassword,
      salt: salt,
      members: members || [],
      role: "CANDIDATE",
      path,
      currentLevelIndex: 0,
      collectedKeywords: [],
      activeSessions: [],
    });

    // Trigger Webhook
    try {
      if (global.fetch) {
        await fetch(WEBHOOK_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            teamId,
            name,
            email,
            members,
            password, // Sent as requested
            pathAsString: path.join("->"),
          }),
        });
      } else {
        console.warn("Global fetch not available, skipping webhook.");
      }
    } catch (webhookErr) {
      console.error("Webhook Failed:", webhookErr);
      // Don't fail the request, just log
    }

    res.status(201).json({ msg: "Team Created", team: newTeam });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server Error" });
  }
};

export const deleteTeam = async (req, res) => {
  try {
    await dbConnect();
    await Team.findByIdAndDelete(req.params.id);
    res.json({ msg: "Team Deleted" });
  } catch (err) {
    res.status(500).json({ msg: "Server Error" });
  }
};

export const updateTeamPath = async (req, res) => {
  try {
    await dbConnect();
    const { path } = req.body; // Expect array of numbers
    const team = await Team.findById(req.params.id);
    if (!team) return res.status(404).json({ msg: "Team not found" });

    team.path = path;
    await team.save();
    res.json({ msg: "Path Updated", team });
  } catch (err) {
    res.status(500).json({ msg: "Server Error" });
  }
};

// 3. Location Management
export const getLocations = async (req, res) => {
  try {
    await dbConnect();
    const locations = await Location.find({}).sort({ locationId: 1 });
    res.json(locations);
  } catch (err) {
    res.status(500).json({ msg: "Server Error" });
  }
};

export const updateLocation = async (req, res) => {
  try {
    await dbConnect();
    const { hint, qrSecret } = req.body;
    const location = await Location.findOne({ locationId: req.params.id });

    if (!location) return res.status(404).json({ msg: "Location not found" });

    if (hint) location.hint = hint;
    if (qrSecret) location.qrSecret = qrSecret;

    await location.save();
    res.json({ msg: "Location Updated", location });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server Error" });
  }
};
