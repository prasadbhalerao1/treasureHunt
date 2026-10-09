import Team from "../models/Team.js";
import Location from "../models/Location.js";
import dbConnect from "../config/dbConnect.js";
import Question from "../models/Question.js";
import Settings from "../models/Settings.js";
import {
  createTeamRecord,
  triggerWebhook,
  generateBalancedPath,
} from "../services/teamService.js";
import {
  getSettings,
  cleanSettingsUpdate,
} from "../services/settingsService.js";
import {
  buildChallenges,
  nextQuestionId,
} from "../services/questionService.js";
import { validateQuestions } from "../utils/questionLogic.js";
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
          $add: [
            { $subtract: ["$lastLevelCompletedAt", "$startTime"] },
            { $multiply: [{ $ifNull: ["$penaltySeconds", 0] }, 1000] },
          ],
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
        { $sort: { sortKey: 1, lastLevelCompletedAt: 1 } },
        { $limit: 50 },
        {
          $project: {
            teamId: 1,
            name: 1,
            currentLevelIndex: 1,
            lastLevelCompletedAt: 1,
            path: 1,
            penaltySeconds: 1,
            attempts: {
              $sum: "$challenges.attempts",
            },
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
          penaltySeconds: t.penaltySeconds || 0,
          attempts: t.attempts || 0,
          finished: t.currentLevelIndex >= t.path.length,
        };
      });
    }

    const teamsPerLevel = await Team.aggregate([
      { $match: { role: ROLES.CANDIDATE } },
      { $group: { _id: "$currentLevelIndex", count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);

    const settings = await getSettings();

    res.json({
      distribution: teamsPerLevel.map((i) => ({
        level: i._id === -1 ? "Not started" : `Level ${i._id}`,
        count: i.count,
      })),
      leaderboard: leaderboardData,
      totalLevels: settings.totalLevels,
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
    const name = String(req.body?.name ?? "").trim();
    const email = String(req.body?.email ?? "")
      .trim()
      .toLowerCase();
    const password = String(req.body?.password ?? "");

    if (!name || name.length > 60) {
      return res.status(400).json({ msg: "Team name is required (max 60)" });
    }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      return res.status(400).json({ msg: "A valid email is required" });
    }
    if (password.length < 6) {
      return res
        .status(400)
        .json({ msg: "Password must be at least 6 characters" });
    }

    const { team } = await createTeamRecord({
      name,
      email,
      password,
    });

    const mail = await triggerWebhook({
      teamId: team.teamId,
      name,
      email,
      password,
    });

    res.status(201).json({
      msg: mail.sent
        ? "Team created. Login email triggered."
        : `Team created, but the email was NOT sent (${mail.reason}). Share the credentials manually.`,
      emailSent: mail.sent,
      team,
    });
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

    if (
      !Array.isArray(path) ||
      path.length < 2 ||
      path[0] !== 0 ||
      !path.every((n) => Number.isInteger(n)) ||
      new Set(path).size !== path.length
    ) {
      return res.status(400).json({
        msg: "Path must start with 0 (Start) and contain unique location IDs",
      });
    }
    const known = await Location.countDocuments({ locationId: { $in: path } });
    if (known !== path.length) {
      return res.status(400).json({ msg: "Path contains unknown locations" });
    }
    if (team.currentLevelIndex >= 0) {
      return res
        .status(400)
        .json({ msg: "Cannot change the path after a team has started" });
    }

    team.path = path;
    if ((team.challenges || []).length !== path.length - 1) {
      team.challenges = await buildChallenges(path.length - 1);
    }
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
    const { hint, qrSecret, name, keyword } = req.body;
    const location = await Location.findOne({ locationId: req.params.id });

    if (!location) return res.status(404).json({ msg: "Location not found" });

    if (typeof hint === "string") location.hint = hint;
    if (typeof qrSecret === "string" && qrSecret.trim()) {
      location.qrSecret = qrSecret.trim();
    }
    if (typeof name === "string" && name.trim()) location.name = name.trim();
    if (typeof keyword === "string" && keyword.trim()) {
      location.keyword = keyword.trim().toUpperCase();
    }

    await location.save();
    res.json({ msg: "Location Updated", location });
  } catch (err) {
    logger.error(err.message, err);
    res.status(500).json({ msg: "Server Error" });
  }
};

const randomSecret = (name) => {
  const code = name
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 8);
  return `${code || "LOC"}_${Math.floor(100000 + Math.random() * 900000)}`;
};

export const createLocation = async (req, res) => {
  try {
    await dbConnect();
    const { name, hint, keyword } = req.body;
    if (!name || !String(name).trim()) {
      return res.status(400).json({ msg: "Name is required" });
    }
    const last = await Location.findOne().sort({ locationId: -1 }).lean();
    const locationId = (last ? last.locationId : -1) + 1;
    const location = await Location.create({
      locationId,
      name: String(name).trim(),
      hint: hint || "",
      keyword: String(keyword || `HOP${locationId}`).toUpperCase(),
      qrSecret: req.body.qrSecret || randomSecret(String(name)),
    });
    res.status(201).json({ msg: "Location Created", location });
  } catch (err) {
    logger.error(err.message, err);
    res.status(500).json({ msg: "Server Error" });
  }
};

export const regenerateLocationSecret = async (req, res) => {
  try {
    await dbConnect();
    const location = await Location.findOne({ locationId: req.params.id });
    if (!location) return res.status(404).json({ msg: "Location not found" });
    location.qrSecret =
      location.locationId === 0
        ? `START-${Math.random().toString(16).slice(2, 10).toUpperCase()}`
        : randomSecret(location.name);
    await location.save();
    res.json({ msg: "QR secret regenerated", location });
  } catch (err) {
    logger.error(err.message, err);
    res.status(500).json({ msg: "Server Error" });
  }
};

export const deleteLocation = async (req, res) => {
  try {
    await dbConnect();
    const id = Number(req.params.id);
    if (id === 0) {
      return res
        .status(400)
        .json({ msg: "The Start location cannot be deleted" });
    }
    const inUse = await Team.countDocuments({
      role: ROLES.CANDIDATE,
      path: id,
    });
    if (inUse) {
      return res
        .status(400)
        .json({ msg: `Location is on the path of ${inUse} team(s)` });
    }
    await Location.deleteOne({ locationId: id });
    res.json({ msg: "Location Deleted" });
  } catch (err) {
    logger.error(err.message, err);
    res.status(500).json({ msg: "Server Error" });
  }
};

// 4. Settings
export const getAdminSettings = async (req, res) => {
  try {
    await dbConnect();
    res.json(await getSettings());
  } catch (err) {
    res.status(500).json({ msg: "Server Error" });
  }
};

export const updateSettings = async (req, res) => {
  try {
    await dbConnect();
    let update;
    try {
      update = cleanSettingsUpdate(req.body || {});
    } catch (e) {
      return res.status(400).json({ msg: e.message });
    }
    await getSettings(); // make sure the doc exists
    await Settings.updateOne({ key: "main" }, { $set: update });
    res.json({ msg: "Settings Updated", settings: await getSettings() });
  } catch (err) {
    logger.error(err.message, err);
    res.status(500).json({ msg: "Server Error" });
  }
};

// 5. Question Bank
export const getQuestions = async (req, res) => {
  try {
    await dbConnect();
    const { section, difficulty, q } = req.query;
    const filter = {};
    if (section) filter.section = String(section);
    if (difficulty) filter.difficulty = String(difficulty);
    if (q) {
      const esc = String(q).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      filter.prompt = { $regex: esc, $options: "i" };
    }
    const questions = await Question.find(filter)
      .sort({ questionId: 1 })
      .lean();
    const [active, settings] = await Promise.all([
      Question.countDocuments({ active: true }),
      getSettings(),
    ]);
    res.json({ questions, active, needed: settings.totalLevels });
  } catch (err) {
    logger.error(err.message, err);
    res.status(500).json({ msg: "Server Error" });
  }
};

const cleanQuestion = (b) => {
  const options = Array.isArray(b.options)
    ? b.options
        .map((o, i) => ({
          key: String(o.key || String.fromCharCode(65 + i))
            .trim()
            .toUpperCase(),
          text: String(o.text || "").trim(),
        }))
        .filter((o) => o.text)
    : [];
  return {
    prompt: String(b.prompt || "").trim(),
    options,
    correctKey: String(b.correctKey || "")
      .trim()
      .toUpperCase(),
    explanation: String(b.explanation || "").trim(),
    section: String(b.section || "General").trim(),
    difficulty: ["EASY", "MEDIUM", "HARD"].includes(b.difficulty)
      ? b.difficulty
      : "MEDIUM",
    active: b.active === undefined ? true : Boolean(b.active),
  };
};

export const createQuestion = async (req, res) => {
  try {
    await dbConnect();
    const data = cleanQuestion(req.body);
    data.questionId = await nextQuestionId();
    validateQuestions([{ ...data }]);
    const question = await Question.create(data);
    res.status(201).json({ msg: "Question Created", question });
  } catch (err) {
    logger.error(err.message, err);
    res.status(400).json({ msg: err.message });
  }
};

export const updateQuestion = async (req, res) => {
  try {
    await dbConnect();
    const question = await Question.findOne({ questionId: req.params.id });
    if (!question) return res.status(404).json({ msg: "Question not found" });
    const data = cleanQuestion({ ...question.toObject(), ...req.body });
    validateQuestions([{ ...data, questionId: question.questionId }]);
    Object.assign(question, data);
    await question.save();
    res.json({ msg: "Question Updated", question });
  } catch (err) {
    logger.error(err.message, err);
    res.status(400).json({ msg: err.message });
  }
};

export const deleteQuestion = async (req, res) => {
  try {
    await dbConnect();
    const id = Number(req.params.id);
    const served = await Team.countDocuments({ "challenges.questionId": id });
    if (served) {
      // Already assigned to teams: deactivate instead of deleting
      await Question.updateOne({ questionId: id }, { $set: { active: false } });
      return res.json({ msg: "Question is in use, so it was deactivated" });
    }
    await Question.deleteOne({ questionId: id });
    res.json({ msg: "Question Deleted" });
  } catch (err) {
    logger.error(err.message, err);
    res.status(500).json({ msg: "Server Error" });
  }
};

// Bulk import (JSON array). Upserts by questionId when given, else appends.
export const importQuestions = async (req, res) => {
  try {
    await dbConnect();
    const list = Array.isArray(req.body) ? req.body : req.body?.questions;
    if (!Array.isArray(list) || !list.length) {
      return res.status(400).json({ msg: "Send a JSON array of questions" });
    }
    let nextId = await nextQuestionId();
    const docs = list.map((raw) => {
      const data = cleanQuestion(raw);
      data.questionId = Number.isInteger(raw.questionId)
        ? raw.questionId
        : nextId++;
      return data;
    });
    try {
      validateQuestions(docs);
    } catch (e) {
      return res.status(400).json({ msg: e.message });
    }
    await Question.bulkWrite(
      docs.map((d) => ({
        updateOne: {
          filter: { questionId: d.questionId },
          update: { $set: d },
          upsert: true,
        },
      })),
    );
    res.json({ msg: `Imported ${docs.length} questions` });
  } catch (err) {
    logger.error(err.message, err);
    res.status(500).json({ msg: "Server Error" });
  }
};

export const exportQuestions = async (req, res) => {
  try {
    await dbConnect();
    const questions = await Question.find({})
      .sort({ questionId: 1 })
      .select("-_id -__v -createdAt -updatedAt")
      .lean();
    res.json(questions);
  } catch (err) {
    res.status(500).json({ msg: "Server Error" });
  }
};

// 6. Team actions
const loadTeam = async (req, res) => {
  const team = await Team.findById(req.params.id);
  if (!team || team.role !== ROLES.CANDIDATE) {
    res.status(404).json({ msg: "Team not found" });
    return null;
  }
  return team;
};

export const getTeamChallenges = async (req, res) => {
  try {
    await dbConnect();
    const team = await loadTeam(req, res);
    if (!team) return;
    const questions = await Question.find({
      questionId: { $in: team.challenges.map((c) => c.questionId) },
    }).lean();
    const byId = new Map(questions.map((q) => [q.questionId, q]));
    res.json(
      team.challenges.map((c) => ({
        level: c.level,
        questionId: c.questionId,
        prompt: byId.get(c.questionId)?.prompt,
        correctKey: byId.get(c.questionId)?.correctKey,
        attempts: c.attempts,
        solved: c.solved,
        firstShownAt: c.firstShownAt,
        solvedAt: c.solvedAt,
        locked: Boolean(c.lockedUntil && c.lockedUntil > new Date()),
      })),
    );
  } catch (err) {
    logger.error(err.message, err);
    res.status(500).json({ msg: "Server Error" });
  }
};

export const reshuffleTeamQuestions = async (req, res) => {
  try {
    await dbConnect();
    const team = await loadTeam(req, res);
    if (!team) return;
    if (team.currentLevelIndex >= 0) {
      return res
        .status(400)
        .json({ msg: "Team already started. Reset the team first." });
    }
    team.challenges = await buildChallenges(team.path.length - 1);
    await team.save();
    res.json({ msg: "Questions reshuffled" });
  } catch (err) {
    logger.error(err.message, err);
    res.status(500).json({ msg: err.message || "Server Error" });
  }
};

export const resetTeam = async (req, res) => {
  try {
    await dbConnect();
    const team = await loadTeam(req, res);
    if (!team) return;
    const settings = await getSettings();
    team.path = await generateBalancedPath(settings.totalLevels);
    team.challenges = await buildChallenges(team.path.length - 1);
    team.currentLevelIndex = -1;
    team.levelHistory = [];
    team.collectedKeywords = [];
    team.lastLevelCompletedAt = undefined;
    team.penaltySeconds = 0;
    team.finaleAttempts = 0;
    team.finaleQuestions = [];
    team.finaleStartedAt = null;
    await team.save();
    logger.warn(`ADMIN reset team ${team.teamId}`);
    res.json({ msg: "Team reset", team });
  } catch (err) {
    logger.error(err.message, err);
    res.status(500).json({ msg: err.message || "Server Error" });
  }
};

// Unlock the team's current level (out of attempts / cooldown)
export const unlockTeamLevel = async (req, res) => {
  try {
    await dbConnect();
    const team = await loadTeam(req, res);
    if (!team) return;
    const level = team.currentLevelIndex + 1;
    await Team.updateOne(
      { _id: team._id, "challenges.level": level },
      {
        $set: {
          "challenges.$.lockedUntil": null,
          "challenges.$.attempts": 0,
        },
      },
    );
    res.json({ msg: `Level ${level} unlocked` });
  } catch (err) {
    logger.error(err.message, err);
    res.status(500).json({ msg: "Server Error" });
  }
};

// Organiser override: mark the team's current level as solved
export const forceCompleteLevel = async (req, res) => {
  try {
    await dbConnect();
    const team = await loadTeam(req, res);
    if (!team) return;
    const level = team.currentLevelIndex + 1;
    if (level < 1 || level > team.path.length - 1) {
      return res.status(400).json({ msg: "No level to complete" });
    }
    const location = await Location.findOne({
      locationId: team.path[level],
    }).lean();
    const now = new Date();
    const updated = await Team.findOneAndUpdate(
      { _id: team._id, currentLevelIndex: level - 1 },
      {
        $set: {
          currentLevelIndex: level,
          lastLevelCompletedAt: now,
          "challenges.$[c].solved": true,
          "challenges.$[c].solvedAt": now,
        },
        $push: { levelHistory: { level, completedAt: now } },
        $addToSet: { collectedKeywords: location?.keyword || `HOP-${level}` },
      },
      { new: true, arrayFilters: [{ "c.level": level }] },
    );
    if (!updated) return res.status(409).json({ msg: "Team state changed" });
    logger.warn(`ADMIN force-completed level ${level} for ${team.teamId}`);
    res.json({ msg: `Level ${level} force-completed` });
  } catch (err) {
    logger.error(err.message, err);
    res.status(500).json({ msg: "Server Error" });
  }
};

// Final standings (CSV)
export const exportResults = async (req, res) => {
  try {
    await dbConnect();
    const teams = await Team.find({ role: ROLES.CANDIDATE }).lean();
    const rows = teams.map((t) => {
      const start = (t.levelHistory || []).find((h) => h.level === 0);
      const finished = t.currentLevelIndex >= t.path.length;
      const base =
        finished && start
          ? new Date(t.lastLevelCompletedAt) - new Date(start.completedAt)
          : null;
      const total =
        base === null ? null : base + (t.penaltySeconds || 0) * 1000;
      return {
        teamId: t.teamId,
        name: t.name,
        finished,
        level: t.currentLevelIndex,
        penaltySeconds: t.penaltySeconds || 0,
        attempts: (t.challenges || []).reduce((n, c) => n + c.attempts, 0),
        totalSeconds: total === null ? "" : Math.round(total / 1000),
      };
    });
    rows.sort((a, b) => {
      if (a.finished !== b.finished) return a.finished ? -1 : 1;
      if (a.finished) {
        return a.totalSeconds - b.totalSeconds || a.attempts - b.attempts;
      }
      return b.level - a.level;
    });
    const esc = (v) => `"${String(v).replace(/"/g, '""')}"`;
    const head =
      "rank,teamId,name,finished,level,penaltySeconds,attempts,totalSeconds";
    const csv = [
      head,
      ...rows.map((r, i) =>
        [
          i + 1,
          r.teamId,
          r.name,
          r.finished,
          r.level,
          r.penaltySeconds,
          r.attempts,
          r.totalSeconds,
        ]
          .map(esc)
          .join(","),
      ),
    ].join("\n");
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=results.csv");
    res.send(csv);
  } catch (err) {
    logger.error(err.message, err);
    res.status(500).json({ msg: "Server Error" });
  }
};
