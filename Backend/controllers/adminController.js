import Team from "../models/Team.js";
import Location from "../models/Location.js";
import dbConnect from "../config/dbConnect.js";
import { createTeamRecord, triggerWebhook } from "../services/teamService.js";
import { ROLES, GAME_STATUS } from "../config/constants.js";
import logger from "../utils/logger.js";

// Dashboard Stats
export const getDashboardStats = async (req, res) => {
  try {
    await dbConnect();
    const { level } = req.query;

    let leaderboardData = [];

    if (level && level !== "Global") {
      const targetLevel = parseInt(level);
      // Show teams who have COMPLETED this level (currentLevelIndex > targetLevel)
      const teams = await Team.find({
        role: ROLES.CANDIDATE,
        currentLevelIndex: { $gt: targetLevel },
      })
        .select(
          "teamId name currentLevelIndex lastLevelCompletedAt path levelHistory",
        )
        .sort({ lastLevelCompletedAt: 1 })
        .limit(20);

      // Pre-fetch all locations to map ID -> Name
      const allLocations = await Location.find({});
      const locMap = {};
      allLocations.forEach((l) => (locMap[l.locationId] = l.name));

      leaderboardData = teams.map((t) => {
        // 1. Determine Location Name
        let locName = "Unknown";
        if (t.currentLevelIndex === -1) {
          locName = "NOT STARTED";
        } else if (t.currentLevelIndex < t.path.length) {
          const targetLocId = t.path[t.currentLevelIndex];
          locName = locMap[targetLocId] || `Loc ${targetLocId}`;
        } else {
          locName = GAME_STATUS.COMPLETED;
        }

        // 2. Calculate time taken for the specific target level
        const completionEntry = t.levelHistory?.find(
          (h) => h.level === targetLevel,
        );
        const completionTime = completionEntry
          ? new Date(completionEntry.completedAt)
          : null;

        let startTime = new Date(t.createdAt);
        if (targetLevel > 0) {
          const prevEntry = t.levelHistory?.find(
            (h) => h.level === targetLevel - 1,
          );
          if (prevEntry) startTime = new Date(prevEntry.completedAt);
        }

        let duration = 0;
        if (completionTime) {
          const diff = completionTime - startTime;
          duration = diff > 0 ? diff : 0;
        }

        return {
          teamId: t.teamId,
          name: t.name,
          currentLevelIndex: t.currentLevelIndex,
          locationName: locName,
          completedAt: completionTime || new Date(),
          timeTaken: duration,
        };
      });
    } else {
      // Global
      const teams = await Team.find({ role: ROLES.CANDIDATE })
        .select("teamId name currentLevelIndex lastLevelCompletedAt path")
        .sort({ currentLevelIndex: -1, lastLevelCompletedAt: 1 })
        .limit(20);

      // Pre-fetch all locations to map ID -> Name
      const allLocations = await Location.find({});
      const locMap = {};
      allLocations.forEach((l) => (locMap[l.locationId] = l.name));

      leaderboardData = teams.map((t) => {
        let locName = "Unknown";
        if (t.currentLevelIndex === -1) {
          locName = "NOT STARTED";
        } else if (t.currentLevelIndex < t.path.length) {
          const targetLocId = t.path[t.currentLevelIndex];
          locName = locMap[targetLocId] || `Loc ${targetLocId}`;
        } else {
          locName = GAME_STATUS.COMPLETED;
        }

        return {
          teamId: t.teamId,
          name: t.name,
          currentLevelIndex: t.currentLevelIndex,
          locationName: locName,
          completedAt: t.lastLevelCompletedAt,
          timeTaken: 0,
        };
      });
    }

    const teamsPerLevel = await Team.aggregate([
      { $match: { role: ROLES.CANDIDATE } },
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
    logger.error(err.message, err);
    res.status(500).json({ msg: "Server Error" });
  }
};

// 2. Team Management
export const getTeams = async (req, res) => {
  try {
    await dbConnect();
    const teams = await Team.find({ role: ROLES.CANDIDATE }).select(
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

    const { team, path } = await createTeamRecord({
      name,
      email,
      password,
      members,
    });

    // Fire-and-forget: Don't await webhook
    triggerWebhook({
      teamId: team.teamId,
      name,
      email,
      members,
      password,
      path,
    });

    res.status(201).json({ msg: "Team Created", team });
  } catch (err) {
    logger.error(err.message, err);
    if (err.message === "Team Name or Email already taken") {
      return res.status(400).json({ msg: err.message });
    }
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
    logger.error(err.message, err);
    res.status(500).json({ msg: "Server Error" });
  }
};
