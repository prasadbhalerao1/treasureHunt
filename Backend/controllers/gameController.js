import Team from "../models/Team.js";
import Location from "../models/Location.js";
import Question from "../models/Question.js";
import dbConnect from "../config/dbConnect.js";
import {
  GAME_STATUS,
  EVENT_STATUS,
  OUT_OF_ATTEMPTS,
  ROLES,
} from "../config/constants.js";
import logger from "../utils/logger.js";
import { sanitizeChallenge } from "../utils/questionLogic.js";
import { getSettings } from "../services/settingsService.js";
import {
  buildChallenges,
  pickReplacement,
} from "../services/questionService.js";

/*
 * FLOW (path = [Start, L1 .. L6], totalLevels = 6)
 *
 *   scan Start QR      -> MCQ 1 opens
 *   solve MCQ 1        -> riddle for L1
 *   scan L1 QR         -> MCQ 2 opens
 *   solve MCQ 2        -> riddle for L2
 *   ...
 *   scan L5 QR         -> MCQ 6 opens
 *   solve MCQ 6        -> riddle for L6
 *   scan L6 QR         -> FINAL challenge (one button for now)
 *
 * currentLevelIndex:
 *   -1  registered, Start QR not scanned
 *    k  MCQ k solved (1..6); the team is walking to location k
 *    path.length (= 7)      all 6 MCQs solved AND the last QR scanned: FINAL
 *    path.length + 1 (= 8)  finished
 */

// "Locked until an organiser resets you" is stored as a far-future date
const FAR_FUTURE = new Date("2999-01-01T00:00:00Z");
const isHardLocked = (d) => d && new Date(d).getTime() > Date.now() + 864e5;

const getHintForLocation = async (locId) => {
  const loc = await Location.findOne({ locationId: locId }).lean();
  return loc ? loc.hint : "Hint not found.";
};

// Number of MCQ levels = number of locations after Start
const levelsOf = (team) => Math.max(team.path.length - 1, 0);

const startedAtOf = (team) => {
  const log = (team.levelHistory || []).find((h) => h.level === 0);
  return log ? log.completedAt : null;
};

// The QR a team must scan next: Start (index 0) before any MCQ is solved,
// then the location of the MCQ they just solved.
const expectedScanIndex = (team) => Math.max(team.currentLevelIndex, 0);

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
  const total = levelsOf(team);
  const base = {
    teamId: team.teamId,
    name: team.name,
    level: cur,
    totalLevels: total,
    penaltySeconds: team.penaltySeconds || 0,
    startedAt: startedAtOf(team),
    finishedAt: cur > team.path.length ? team.lastLevelCompletedAt : null,
    collectedKeywords: team.collectedKeywords,
    serverTime: new Date(),
    eventStatus: settings.eventStatus,
    eventName: settings.eventName,
  };

  // Finished
  if (cur > team.path.length) {
    return {
      ...base,
      status: GAME_STATUS.COMPLETED,
      hint: "Destination reached. Route complete!",
    };
  }

  // All MCQs solved and the last QR scanned: the final challenge
  if (cur === team.path.length) {
    return {
      ...base,
      status: GAME_STATUS.FINALE,
      hint: "Final challenge unlocked. Press the button to finish.",
    };
  }

  // Not started: scan the Start QR
  if (cur === -1) {
    return {
      ...base,
      status: GAME_STATUS.NOT_STARTED,
      hint: "Go to the START location and scan its QR code to begin.",
    };
  }

  // A challenge is open when the QR for this step has been scanned
  const level = cur + 1; // the MCQ that follows the scan of path[cur]
  const challenge = (team.challenges || []).find((c) => c.level === level);

  if (challenge && challenge.firstShownAt && !challenge.solved) {
    const question = await Question.findOne({
      questionId: challenge.questionId,
    }).lean();
    if (question) {
      return {
        ...base,
        status: GAME_STATUS.CHALLENGE_OPEN,
        challenge: {
          ...sanitizeChallenge(question, challenge),
          maxAttempts: settings.maxAttemptsPerQuestion,
          locked: Boolean(isHardLocked(challenge.lockedUntil)),
        },
      };
    }
  }

  // Otherwise: the riddle for the location whose QR they must scan next
  return {
    ...base,
    status: GAME_STATUS.HINT_UNLOCKED,
    hint: await getHintForLocation(team.path[expectedScanIndex(team)]),
    nextLevel: level,
  };
}

// Players can only act while the event is LIVE (admins may always test)
async function eventGate(req, res) {
  const settings = await getSettings();
  if (
    req.user.role !== ROLES.ADMIN &&
    settings.eventStatus !== EVENT_STATUS.LIVE
  ) {
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

// Scan the QR at the current location. Every scan opens that step's MCQ,
// except the final one, which unlocks the final challenge.
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
    team = await ensureChallenges(team);

    if (team.currentLevelIndex >= team.path.length) {
      return res.status(200).json({
        msg:
          team.currentLevelIndex === team.path.length
            ? "Final challenge already unlocked."
            : "Route already complete.",
        state: await buildState(team),
      });
    }

    const scanIndex = expectedScanIndex(team);
    const targetLocation = await Location.findOne({
      locationId: team.path[scanIndex],
    }).lean();
    if (!targetLocation) {
      return res.status(500).json({ msg: "Target Location Data Missing" });
    }

    // Validate QR (case-insensitive)
    if (qrString.toUpperCase() !== targetLocation.qrSecret.toUpperCase()) {
      return res.status(400).json({ msg: "Invalid QR Code. Wrong Location?" });
    }

    const now = new Date();

    // The very first scan starts the clock
    if (team.currentLevelIndex === -1) {
      const started = await Team.findOneAndUpdate(
        { _id: team._id, currentLevelIndex: -1 },
        {
          $set: { currentLevelIndex: 0, lastLevelCompletedAt: now },
          $push: { levelHistory: { level: 0, completedAt: now } },
        },
        { new: true },
      );
      team = started || (await Team.findById(team._id));
      logger.info(`Team ${team.teamId} started`);
    }

    // Scanning the LAST location unlocks the final challenge
    if (scanIndex === team.path.length - 1 && team.currentLevelIndex > 0) {
      const done = await Team.findOneAndUpdate(
        { _id: team._id, currentLevelIndex: team.path.length - 1 },
        {
          $set: {
            currentLevelIndex: team.path.length,
            lastLevelCompletedAt: now,
          },
          $addToSet: {
            collectedKeywords: targetLocation.keyword || `HOP-${scanIndex}`,
          },
        },
        { new: true },
      );
      const after = done || (await Team.findById(team._id));
      logger.info(`Team ${team.teamId} unlocked the final challenge`);
      return res.json({
        msg: "Final location verified!",
        state: await buildState(after),
      });
    }

    // Otherwise: open the MCQ for this step
    const level = team.currentLevelIndex + 1;
    const challenge = team.challenges.find((c) => c.level === level);
    if (!challenge) {
      return res.status(500).json({ msg: "Challenge not assigned" });
    }

    if (!challenge.solved && !challenge.firstShownAt) {
      await Team.updateOne(
        {
          _id: team._id,
          challenges: { $elemMatch: { level, firstShownAt: null } },
        },
        { $set: { "challenges.$.firstShownAt": now } },
      );
    }
    team = await Team.findById(team._id);

    logger.info(`Team ${team.teamId} opened challenge ${level}`);
    res.json({
      msg: "Location verified. Solve the question to continue.",
      state: await buildState(team),
    });
  } catch (err) {
    logger.error(err.message, err);
    res.status(500).json({ msg: "Server Error" });
  }
};

// Answer the MCQ that is currently open. A correct answer reveals the riddle
// for the next location.
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
        msg: "That question is not active.",
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
          msg: "Out of attempts. Ask an organiser to unlock this question.",
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

    // ---- Correct answer: advance and reveal the next riddle ----
    if (optionKey === question.correctKey) {
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
        },
        { new: true },
      );

      if (!updated) {
        const current = await Team.findById(team._id);
        return res.status(409).json({
          msg: "Already answered.",
          state: await buildState(current),
        });
      }

      logger.info(`Team ${team.teamId} solved question ${level}`);
      return res.json({
        correct: true,
        msg: "Correct!",
        explanation: question.explanation,
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
      `Team ${team.teamId} wrong on question ${level} (attempt ${attempts})`,
    );
    res.status(400).json({
      correct: false,
      msg: swapped
        ? "Out of attempts! You got a new question and an extra penalty."
        : locked
          ? "Out of attempts! Ask an organiser to unlock this question."
          : "Wrong answer.",
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

// Final challenge: a single button for now. The real puzzle lands here later.
export const submitAnswer = async (req, res) => {
  try {
    await dbConnect();
    const settings = await eventGate(req, res);
    if (!settings) return;

    const team = await Team.findById(req.user.id);
    if (!team) return res.status(404).json({ msg: "Team not found" });

    if (team.currentLevelIndex < team.path.length) {
      return res.status(400).json({
        msg: "Final challenge is still locked. Finish every question first.",
        state: await buildState(team),
      });
    }
    if (team.currentLevelIndex > team.path.length) {
      return res.json({
        msg: "Already completed.",
        state: await buildState(team),
      });
    }

    const now = new Date();
    const done = await Team.findOneAndUpdate(
      { _id: team._id, currentLevelIndex: team.path.length },
      {
        $set: {
          currentLevelIndex: team.path.length + 1,
          lastLevelCompletedAt: now,
        },
        $push: { levelHistory: { level: team.path.length, completedAt: now } },
      },
      { new: true },
    );
    logger.info(`******* TEAM ${team.teamId} FINISHED *******`);

    res.json({
      correct: true,
      msg: "Destination reached!",
      state: await buildState(done || team),
    });
  } catch (err) {
    logger.error(err.message, err);
    res.status(500).json({ msg: "Server Error" });
  }
};
