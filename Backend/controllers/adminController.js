import Team from "../models/Team.js";
import Location from "../models/Location.js";
import dbConnect from "../config/dbConnect.js";
import { createTeamRecord, triggerWebhook } from "../services/teamService.js";
import { ROLES, GAME_STATUS } from "../config/constants.js";
import logger from "../utils/logger.js";

// Dashboard Stats - Duration-based Ranking
export const getDashboardStats = async (req, res) => {
  try {
    await dbConnect();
    const { level } = req.query;

    let leaderboardData = [];

    // Aggregation: Extract start time from levelHistory (Level 0) or fallback to createdAt
    const durationProjection = {
      $addFields: {
        startTime: {
          $let: {
            vars: {
              startLog: {
                $arrayElemAt: [
                  {
                    $filter: {
                      input: "$levelHistory",
                      as: "h",
                      cond: { $eq: ["$$h.level", 0] },
                    },
                  },
                  0,
                ],
              },
            },
            in: { $ifNull: ["$$startLog.completedAt", "$createdAt"] },
          },
        },
      },
    };

    const durationCalculation = {
      $addFields: {
        computedDuration: {
          $subtract: ["$lastLevelCompletedAt", "$startTime"],
        },
      },
    };

    if (level && level !== "Global") {
      const targetLevel = parseInt(level);

      leaderboardData = await Team.aggregate([
        {
          $match: {
            role: ROLES.CANDIDATE,
            currentLevelIndex: { $gt: targetLevel },
          },
        },
        {
          $addFields: {
            levelLog: {
              $arrayElemAt: [
                {
                  $filter: {
                    input: "$levelHistory",
                    as: "h",
                    cond: { $eq: ["$$h.level", targetLevel] },
                  },
                },
                0,
              ],
            },
          },
        },
        durationProjection,
        {
          $addFields: {
            levelCompletionTime: "$levelLog.completedAt",
            prevLevelTime: {
              $let: {
                vars: {
                  pLog: {
                    $arrayElemAt: [
                      {
                        $filter: {
                          input: "$levelHistory",
                          as: "h",
                          cond: {
                            $eq: ["$$h.level", { $subtract: [targetLevel, 1] }],
                          },
                        },
                      },
                      0,
                    ],
                  },
                },
                in: {
                  $cond: {
                    if: { $gt: [targetLevel, 0] },
                    then: "$$pLog.completedAt",
                    else: "$createdAt",
                  },
                },
              },
            },
          },
        },
        {
          $addFields: {
            specificLevelDuration: {
              $subtract: ["$levelCompletionTime", "$prevLevelTime"],
            },
          },
        },
        { $sort: { specificLevelDuration: 1 } },
        { $limit: 20 },
        {
          $project: {
            teamId: 1,
            name: 1,
            currentLevelIndex: 1,
            locationName: "Completed",
            completedAt: "$levelCompletionTime",
            timeTaken: "$specificLevelDuration",
          },
        },
      ]);
    } else {
      // Global Leaderboard: Sorted by total game duration
      const pipeline = [
        { $match: { role: ROLES.CANDIDATE } },
        durationProjection,
        durationCalculation,
        {
          $addFields: {
            isCompleted: {
              $cond: [
                { $gte: ["$currentLevelIndex", { $size: "$path" }] },
                1,
                0,
              ],
            },
            sortKey: {
              $cond: {
                if: { $gte: ["$currentLevelIndex", { $size: "$path" }] },
                then: "$computedDuration",
                else: {
                  $subtract: [
                    10000000000000,
                    { $multiply: ["$currentLevelIndex", 1000000000] },
                  ],
                },
              },
            },
          },
        },
        { $sort: { sortKey: 1 } },
        { $limit: 20 },
        {
          $project: {
            teamId: 1,
            name: 1,
            currentLevelIndex: 1,
            lastLevelCompletedAt: 1,
            path: 1,
            duration: "$computedDuration",
          },
        },
      ];

      const teams = await Team.aggregate(pipeline);

      const allLocations = await Location.find({});
      const locMap = {};
      allLocations.forEach((l) => (locMap[l.locationId] = l.name));

      leaderboardData = teams.map((t) => {
        let locName = "Unknown";
        if (t.currentLevelIndex === -1) {
          locName = "NOT STARTED";
        } else if (t.currentLevelIndex < t.path.length) {
          locName =
            locMap[t.path[t.currentLevelIndex]] ||
            `Loc ${t.path[t.currentLevelIndex]}`;
        } else {
          locName = GAME_STATUS.COMPLETED;
        }

        return {
          teamId: t.teamId,
          name: t.name,
          currentLevelIndex: t.currentLevelIndex,
          locationName: locName,
          completedAt: t.lastLevelCompletedAt,
          timeTaken: t.duration || 0,
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
