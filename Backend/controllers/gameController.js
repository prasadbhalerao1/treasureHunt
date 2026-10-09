import Team from "../models/Team.js";
import Location from "../models/Location.js";
import Question from "../models/Question.js";
import dbConnect from "../config/dbConnect.js";
import {
  GAME_STATUS,
  EVENT_STATUS,
  OUT_OF_ATTEMPTS,
  ROLES,
  FINALE_DESCRIPTIONS,
  MEGA_MAX_ATTEMPTS_BEFORE_COOLDOWN,
  MEGA_COOLDOWN_SECONDS,
} from "../config/constants.js";
import logger from "../utils/logger.js";
import { isValidOrder } from "../utils/finale.js";
import { sanitizeChallenge } from "../utils/questionLogic.js";
import { getSettings } from "../services/settingsService.js";
import {
  buildChallenges,
  pickReplacement,
} from "../services/questionService.js";

export { getSortKey, isValidOrder } from "../utils/finale.js";

// "Locked until an organiser resets you" is stored as a far-future date
const FAR_FUTURE = new Date("2999-01-01T00:00:00Z");
const isHardLocked = (d) => d && new Date(d).getTime() > Date.now() + 864e5;

const getHintForLocation = async (locId) => {
  const loc = await Location.findOne({ locationId: locId }).lean();
  return loc ? loc.hint : "Hint not found.";
};

const levelsOf = (team) => Math.max(team.path.length - 1, 0);

const startedAtOf = (team) => {
  const log = (team.levelHistory || []).find((h) => h.level === 0);
  return log ? log.completedAt : null;
};

// Ensure the team has one assigned question per level (lazy fallback)
async function ensureChallenges(team) {
  const needed = levelsOf(team);
  if (team.role !== ROLES.CANDIDATE || needed === 0) return team;
  if (team.challenges && team.challenges.length >= needed) return team;
  const fresh = await buildChallenges(needed);
  await Team.updateOne(
    { _id: team._id, "challenges.0": { $exists: false } },
    { $set: { challenges: fresh } },
  );
  return Team.findById(team._id);
}

// Full, answer-free snapshot of a team's game for the client
async function buildState(team) {
  const settings = await getSettings();
  const cur = team.currentLevelIndex;
  const base = {
    teamId: team.teamId,
    name: team.name,
    level: cur,
    totalLevels: levelsOf(team),
    penaltySeconds: team.penaltySeconds || 0,
    startedAt: startedAtOf(team),
    finishedAt: cur >= team.path.length ? team.lastLevelCompletedAt : null,
    collectedKeywords: team.collectedKeywords,
    serverTime: new Date(),
    eventStatus: settings.eventStatus,
    eventName: settings.eventName,
  };

  if (cur >= team.path.length) {
    return {
      ...base,
      status: GAME_STATUS.COMPLETED,
      hint: "Destination reached. Route complete!",
    };
  }

  if (cur === team.path.length - 1 && cur >= 0) {
    const hopCodes = team.collectedKeywords.filter(
      (k) => k.trim().toUpperCase() !== "START",
    );
    return {
      ...base,
      status: GAME_STATUS.FINALE,
      hint:
        FINALE_DESCRIPTIONS[team.finaleChallenge] ||
        "Reassemble the packet: order the hop codes.",
      hopCodes,
      finaleRetryAfterSeconds: team.finaleLockedUntil
        ? Math.max(
            0,
            Math.ceil((new Date(team.finaleLockedUntil) - Date.now()) / 1000),
          )
        : 0,
    };
  }

  if (cur === -1) {
    return {
      ...base,
      status: GAME_STATUS.NOT_STARTED,
      hint: "Go to the START location and scan its QR code to begin the trace.",
    };
  }

  const nextIndex = cur + 1;
  const challenge = (team.challenges || []).find((c) => c.level === nextIndex);

  if (challenge && challenge.firstShownAt && !challenge.solved) {
    const question = await Question.findOne({
      questionId: challenge.questionId,
    }).lean();
    if (question) {
      return {
        ...base,
        status: GAME_STATUS.CHALLENGE_OPEN,
        hint: await getHintForLocation(team.path[nextIndex]),
        challenge: {
          ...sanitizeChallenge(question, challenge),
          maxAttempts: settings.maxAttemptsPerQuestion,
          locked: Boolean(isHardLocked(challenge.lockedUntil)),
        },
      };
    }
  }

  return {
    ...base,
    status: GAME_STATUS.HINT_UNLOCKED,
    hint: await getHintForLocation(team.path[nextIndex]),
    nextLevel: nextIndex,
  };
}

// Players can only act while the event is LIVE (admins may always test)
async function eventGate(req, res) {
  const settings = await getSettings();
  if (req.user.role !== ROLES.ADMIN && settings.eventStatus !== EVENT_STATUS.LIVE) {
    res.status(403).json({
      msg:
        settings.eventStatus === EVENT_STATUS.ENDED
          ? "The event has ended."
          : "The event has not started yet. Please wait for the organisers.",
    });
    return null;
  }
  return settings;
}

export const getGameState = async (req, res) => {
  try {
    await dbConnect();
    let team = await Team.findById(req.user.id);
    if (!team) return res.status(404).json({ msg: "Team not found" });
    team = await ensureChallenges(team);
    res.json(await buildState(team));
  } catch (err) {
    logger.error(err.message, err);
    res.status(500).json({ msg: "Server Error" });
  }
};

// Scan a location QR. Start QR begins the trace; any other QR opens its challenge.
export const scanQR = async (req, res) => {
  try {
    const qrString = String(req.body?.qrString ?? "").trim();
    if (!qrString || qrString.length > 100) {
      return res.status(400).json({ msg: "Invalid QR Code. Wrong Location?" });
    }

    await dbConnect();
    if (!(await eventGate(req, res))) return;

    let team = await Team.findById(req.user.id);
    if (!team) return res.status(404).json({ msg: "Team not found" });

    const nextIndex = team.currentLevelIndex + 1;

    if (nextIndex >= team.path.length) {
      return res.status(200).json({
        msg:
          nextIndex === team.path.length
            ? "All hops traced! Solve the Mega Puzzle."
            : "Route already complete.",
        state: await buildState(team),
      });
    }

    const targetLocation = await Location.findOne({
      locationId: team.path[nextIndex],
    }).lean();
    if (!targetLocation) {
      return res.status(500).json({ msg: "Target Location Data Missing" });
    }

    // Validate QR (case-insensitive)
    if (qrString.toUpperCase() !== targetLocation.qrSecret.toUpperCase()) {
      return res.status(400).json({ msg: "Invalid QR Code. Wrong Location?" });
    }

    const now = new Date();

    // Level 0: Start QR begins the clock, no challenge
    if (nextIndex === 0) {
      const started = await Team.findOneAndUpdate(
        { _id: team._id, currentLevelIndex: -1 },
        {
          $set: { currentLevelIndex: 0, lastLevelCompletedAt: now },
          $push: { levelHistory: { level: 0, completedAt: now } },
          $addToSet: { collectedKeywords: targetLocation.keyword || "START" },
        },
        { new: true },
      );
      team = started || (await Team.findById(team._id));
      logger.info(`Team ${team.teamId} started the trace`);
      return res.json({
        msg: "Trace started! Packet is on its way.",
        state: await buildState(team),
      });
    }

    // Levels 1..N: open the challenge for this location
    team = await ensureChallenges(team);
    const challenge = team.challenges.find((c) => c.level === nextIndex);
    if (!challenge) {
      return res.status(500).json({ msg: "Challenge not assigned" });
    }

    if (!challenge.solved && !challenge.firstShownAt) {
      await Team.updateOne(
        {
          _id: team._id,
          challenges: { $elemMatch: { level: nextIndex, firstShownAt: null } },
        },
        { $set: { "challenges.$.firstShownAt": now } },
      );
      team = await Team.findById(team._id);
    }

    logger.info(`Team ${team.teamId} opened challenge ${nextIndex}`);
    res.json({
      msg: "Location verified. Solve the challenge to continue.",
      state: await buildState(team),
    });
  } catch (err) {
    logger.error(err.message, err);
    res.status(500).json({ msg: "Server Error" });
  }
};

// Answer the MCQ for the currently open level
export const answerChallenge = async (req, res) => {
  try {
    const level = Number(req.body?.level);
    const optionKey = String(req.body?.optionKey ?? "").trim();
    if (!Number.isInteger(level) || !optionKey || optionKey.length > 4) {
      return res.status(400).json({ msg: "Invalid answer payload" });
    }

    await dbConnect();
    const settings = await eventGate(req, res);
    if (!settings) return;

    const team = await Team.findById(req.user.id);
    if (!team) return res.status(404).json({ msg: "Team not found" });

    if (
      level < 1 ||
      level > levelsOf(team) ||
      level !== team.currentLevelIndex + 1
    ) {
      return res.status(400).json({
        msg: "That level is not active.",
        state: await buildState(team),
      });
    }

    const challenge = (team.challenges || []).find((c) => c.level === level);
    if (!challenge || challenge.solved || !challenge.firstShownAt) {
      return res.status(400).json({
        msg: "Scan the location QR first.",
        state: await buildState(team),
      });
    }

    const now = new Date();
    if (challenge.lockedUntil && new Date(challenge.lockedUntil) > now) {
      if (isHardLocked(challenge.lockedUntil)) {
        return res.status(429).json({
          msg: "Out of attempts. Ask an organiser to unlock this level.",
          retryAfterSeconds: 0,
          locked: true,
        });
      }
      return res.status(429).json({
        msg: "Cooling down. Try again shortly.",
        retryAfterSeconds: Math.ceil(
          (new Date(challenge.lockedUntil) - now) / 1000,
        ),
      });
    }

    const question = await Question.findOne({
      questionId: challenge.questionId,
    }).lean();
    if (!question) {
      return res.status(500).json({ msg: "Question data missing" });
    }
    if (!question.options.some((o) => o.key === optionKey)) {
      return res.status(400).json({ msg: "Invalid option" });
    }

    // ---- Correct answer ----
    if (optionKey === question.correctKey) {
      const location = await Location.findOne({
        locationId: team.path[level],
      }).lean();
      const keyword = location?.keyword || `HOP-${level}`;

      const updated = await Team.findOneAndUpdate(
        {
          _id: team._id,
          currentLevelIndex: level - 1,
          challenges: { $elemMatch: { level, solved: false } },
        },
        {
          $set: {
            currentLevelIndex: level,
            lastLevelCompletedAt: now,
            "challenges.$.solved": true,
            "challenges.$.solvedAt": now,
            "challenges.$.lockedUntil": null,
          },
          $push: { levelHistory: { level, completedAt: now } },
          $addToSet: { collectedKeywords: keyword },
        },
        { new: true },
      );

      if (!updated) {
        // Double submit: already advanced
        const current = await Team.findById(team._id);
        return res.status(409).json({
          msg: "Already answered.",
          state: await buildState(current),
        });
      }

      logger.info(`Team ${team.teamId} solved level ${level}`);
      return res.json({
        correct: true,
        msg: "Correct! Packet delivered.",
        explanation: question.explanation,
        keyword,
        state: await buildState(updated),
      });
    }

    // ---- Wrong answer ----
    const penalty = settings.wrongAnswerTimePenaltySeconds;
    const cooldownEnd = new Date(
      now.getTime() + settings.wrongAnswerCooldownSeconds * 1000,
    );
    const after = await Team.findOneAndUpdate(
      {
        _id: team._id,
        currentLevelIndex: level - 1,
        challenges: {
          $elemMatch: {
            level,
            solved: false,
            $or: [{ lockedUntil: null }, { lockedUntil: { $lte: now } }],
          },
        },
      },
      {
        $inc: { "challenges.$.attempts": 1, penaltySeconds: penalty },
        $set: { "challenges.$.lockedUntil": cooldownEnd },
      },
      { new: true },
    );

    if (!after) {
      return res.status(429).json({
        msg: "Too many requests. Try again shortly.",
        retryAfterSeconds: 1,
      });
    }

    let current = after;
    let penaltyAdded = penalty;
    let swapped = false;
    let locked = false;
    const attempts = after.challenges.find((c) => c.level === level).attempts;

    if (attempts >= settings.maxAttemptsPerQuestion) {
      if (settings.outOfAttemptsAction === OUT_OF_ATTEMPTS.LOCK_UNTIL_ADMIN) {
        await Team.updateOne(
          { _id: team._id, "challenges.level": level },
          { $set: { "challenges.$.lockedUntil": FAR_FUTURE } },
        );
        locked = true;
      } else {
        const replacement = await pickReplacement(after, level);
        if (replacement) {
          replacement.firstShownAt = now;
          replacement.lockedUntil = cooldownEnd;
          await Team.updateOne(
            { _id: team._id, "challenges.level": level },
            {
              $set: { "challenges.$": replacement },
              $inc: { penaltySeconds: penalty },
            },
          );
          penaltyAdded += penalty;
          swapped = true;
        }
      }
      current = await Team.findById(team._id);
    }

    logger.info(
      `Team ${team.teamId} wrong on level ${level} (attempt ${attempts})`,
    );
    res.status(400).json({
      correct: false,
      msg: swapped
        ? "Out of attempts! You got a new question and an extra penalty."
        : locked
          ? "Out of attempts! Ask an organiser to unlock this level."
          : "Wrong answer. Packet dropped.",
      attemptsLeft: Math.max(settings.maxAttemptsPerQuestion - attempts, 0),
      penaltyAdded,
      swapped,
      locked,
      retryAfterSeconds: settings.wrongAnswerCooldownSeconds,
      state: await buildState(current),
    });
  } catch (err) {
    logger.error(err.message, err);
    res.status(500).json({ msg: "Server Error" });
  }
};

// Mega Puzzle: order the collected hop codes by the team's rule
export const submitAnswer = async (req, res) => {
  try {
    const answer = String(req.body?.answer ?? "");
    await dbConnect();
    const settings = await eventGate(req, res);
    if (!settings) return;

    const team = await Team.findById(req.user.id);
    if (!team) return res.status(404).json({ msg: "Team not found" });

    const finaleIndex = team.path.length - 1;

    if (team.currentLevelIndex < finaleIndex || team.currentLevelIndex < 0) {
      return res
        .status(400)
        .json({ msg: "Mega Puzzle is still locked. Finish every hop first." });
    }
    if (team.currentLevelIndex > finaleIndex) {
      return res.json({
        msg: "Already completed.",
        state: await buildState(team),
      });
    }

    const now = new Date();
    if (team.finaleLockedUntil && team.finaleLockedUntil > now) {
      return res.status(429).json({
        msg: "Cooling down. Try again shortly.",
        retryAfterSeconds: Math.ceil((team.finaleLockedUntil - now) / 1000),
      });
    }

    const submitted = answer
      .trim()
      .toUpperCase()
      .split("-")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    const keywords = team.collectedKeywords
      .map((k) => k.trim().toUpperCase())
      .filter((k) => k !== "START");

    if (!isValidOrder(submitted, keywords, team.finaleChallenge)) {
      const attempts = (team.finaleAttempts || 0) + 1;
      const lock = attempts % MEGA_MAX_ATTEMPTS_BEFORE_COOLDOWN === 0;
      const retryAfterSeconds = lock ? MEGA_COOLDOWN_SECONDS : 0;
      const updated = await Team.findOneAndUpdate(
        { _id: team._id, currentLevelIndex: finaleIndex },
        {
          $inc: {
            finaleAttempts: 1,
            penaltySeconds: settings.wrongAnswerTimePenaltySeconds,
          },
          $set: {
            finaleLockedUntil: lock
              ? new Date(now.getTime() + retryAfterSeconds * 1000)
              : null,
          },
        },
        { new: true },
      );
      logger.warn(
        `Team ${team.teamId} failed Mega Puzzle (${team.finaleChallenge}). Tried: ${submitted.join("-")}`,
      );
      return res.status(400).json({
        correct: false,
        msg: "Reassembly failed. Check your ordering rule!",
        penaltyAdded: settings.wrongAnswerTimePenaltySeconds,
        retryAfterSeconds,
        state: await buildState(updated || team),
      });
    }

    const done = await Team.findOneAndUpdate(
      { _id: team._id, currentLevelIndex: finaleIndex },
      {
        $set: {
          currentLevelIndex: team.path.length + 1,
          lastLevelCompletedAt: now,
        },
        $push: { levelHistory: { level: team.path.length, completedAt: now } },
      },
      { new: true },
    );
    logger.info(`******* TEAM ${team.teamId} COMPLETED THE TRACE *******`);

    res.json({
      correct: true,
      msg: "Packet reassembled. Destination reached!",
      state: await buildState(done || team),
    });
  } catch (err) {
    logger.error(err.message, err);
    res.status(500).json({ msg: "Server Error" });
  }
};
