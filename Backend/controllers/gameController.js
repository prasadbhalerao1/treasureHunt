import Team from "../models/Team.js";
import Location from "../models/Location.js";
import dbConnect from "../config/dbConnect.js";
import {
  GAME_STATUS,
  FINALE_CHALLENGES,
  FINALE_DESCRIPTIONS,
} from "../config/constants.js";
import logger from "../utils/logger.js";

// Helper: Get Hint for a specific location ID
const getHintForLocation = async (locId) => {
  const loc = await Location.findOne({ locationId: locId });
  return loc ? loc.hint : "Hint not found.";
};

// Helper: Get the sort key for a keyword based on challenge type
export const getSortKey = (keyword, challenge) => {
  switch (challenge) {
    case FINALE_CHALLENGES.ALPHA_ASC:
    case FINALE_CHALLENGES.ALPHA_DESC:
      return keyword;
    case FINALE_CHALLENGES.LENGTH_ASC:
    case FINALE_CHALLENGES.LENGTH_DESC:
      return keyword.length;
    case FINALE_CHALLENGES.SECOND_LETTER:
      return keyword.charAt(1) || "";
    case FINALE_CHALLENGES.LAST_LETTER:
      return keyword.charAt(keyword.length - 1) || "";
    default:
      return keyword;
  }
};

// Helper: Validate if submitted order is valid for the challenge
// Accepts ANY valid ordering when sort keys are equal
export const isValidOrder = (submitted, keywords, challenge) => {
  // 1. Check same keywords (Set comparison)
  const submittedSet = new Set(submitted);
  const expectedSet = new Set(keywords);
  if (submittedSet.size !== expectedSet.size) return false;
  for (const k of submitted) {
    if (!expectedSet.has(k)) return false;
  }

  // 2. For each adjacent pair, check ordering is valid
  const isAscending = [
    FINALE_CHALLENGES.ALPHA_ASC,
    FINALE_CHALLENGES.LENGTH_ASC,
    FINALE_CHALLENGES.SECOND_LETTER,
    FINALE_CHALLENGES.LAST_LETTER,
  ].includes(challenge);

  for (let i = 0; i < submitted.length - 1; i++) {
    const keyA = getSortKey(submitted[i], challenge);
    const keyB = getSortKey(submitted[i + 1], challenge);

    if (isAscending) {
      // keyA should be <= keyB
      if (typeof keyA === "number") {
        if (keyA > keyB) return false;
      } else {
        if (keyA.localeCompare(keyB) > 0) return false;
      }
    } else {
      // Descending: keyA should be >= keyB
      if (typeof keyA === "number") {
        if (keyA < keyB) return false;
      } else {
        if (keyA.localeCompare(keyB) < 0) return false;
      }
    }
  }

  return true;
};

export const getGameState = async (req, res) => {
  try {
    await dbConnect();
    const team = await Team.findById(req.user.id);
    if (!team) return res.status(404).json({ msg: "Team not found" });

    // 1. Check for COMPLETED
    if (team.currentLevelIndex >= team.path.length) {
      return res.json({
        teamId: team.teamId,
        level: team.currentLevelIndex,
        status: GAME_STATUS.COMPLETED,
        hint: "Congratulations! You have completed the Treasure Hunt.",
        collectedKeywords: team.collectedKeywords,
      });
    }

    // 2. Check for FINALE (last index)
    if (team.currentLevelIndex === team.path.length - 1) {
      return res.json({
        teamId: team.teamId,
        level: 7,
        status: GAME_STATUS.FINALE,
        hint:
          FINALE_DESCRIPTIONS[team.finaleChallenge] || "Decrypt the Password.",
        collectedKeywords: team.collectedKeywords,
      });
    }

    // 3. Normal Gameplay - Show hint for NEXT location
    const nextIndex = team.currentLevelIndex + 1;
    let hint = "Proceed to Start Location";
    if (nextIndex < team.path.length) {
      const nextLocationId = team.path[nextIndex];
      hint = await getHintForLocation(nextLocationId);
    }

    res.json({
      teamId: team.teamId,
      name: team.name,
      level: team.currentLevelIndex,
      status: GAME_STATUS.HINT_UNLOCKED,
      hint: hint,
      collectedKeywords: team.collectedKeywords,
      nextLevel: nextIndex,
    });
  } catch (err) {
    logger.error(err.message, err);
    res.status(500).json({ msg: "Server Error" });
  }
};

export const scanQR = async (req, res) => {
  try {
    const { qrString } = req.body;
    await dbConnect();
    const team = await Team.findById(req.user.id);

    if (!team) return res.status(404).json({ msg: "Team not found" });

    const nextIndex = team.currentLevelIndex + 1;

    // Check if already finished
    if (nextIndex >= team.path.length) {
      return res.status(200).json({
        msg: "Game Already Completed",
        nextLevel: team.currentLevelIndex,
        nextHint: "You have finished!",
      });
    }

    const targetLocationId = team.path[nextIndex];
    const targetLocation = await Location.findOne({
      locationId: targetLocationId,
    });

    if (!targetLocation) {
      return res.status(500).json({ msg: "Target Location Data Missing" });
    }

    // Validate QR (case-insensitive)
    if (qrString.toUpperCase() !== targetLocation.qrSecret.toUpperCase()) {
      return res.status(400).json({ msg: "Invalid QR Code. Wrong Location?" });
    }

    // Success: Advance Level
    const completionTime = new Date();
    team.currentLevelIndex = nextIndex;
    team.lastLevelCompletedAt = completionTime;

    team.levelHistory.push({
      level: nextIndex,
      completedAt: completionTime,
    });

    // Award Keyword
    const keyword = targetLocation.keyword || `Keyword-${targetLocationId}`;
    if (!team.collectedKeywords.includes(keyword)) {
      team.collectedKeywords.push(keyword);
    }

    await team.save();
    logger.info(`Team ${team.teamId} scanned location ${targetLocationId}`);

    // Check if we just entered Finale
    if (team.currentLevelIndex === team.path.length - 1) {
      return res.json({
        msg: "Level Completed!",
        keyword: keyword,
        nextLevel: 7,
        nextHint: "Finale Decryption Required",
      });
    }

    const newNextIndex = team.currentLevelIndex + 1;
    let nextHint = "Finale";

    if (newNextIndex < team.path.length) {
      const nextLocId = team.path[newNextIndex];
      nextHint = await getHintForLocation(nextLocId);
    }

    res.json({
      msg: "Level Completed!",
      keyword: keyword,
      nextLevel: team.currentLevelIndex,
      nextHint: nextHint,
    });
  } catch (err) {
    logger.error(err.message, err);
    res.status(500).json({ msg: "Server Error" });
  }
};

// submitAnswer - Handle Finale with EDGE CASE TOLERANT validation
export const submitAnswer = async (req, res) => {
  try {
    const { answer } = req.body;
    await dbConnect();
    const team = await Team.findById(req.user.id);

    if (!team) return res.status(404).json({ msg: "Team not found" });

    // Ensure at finale
    const finaleIndex = team.path.length - 1;

    if (team.currentLevelIndex < finaleIndex) {
      return res
        .status(400)
        .json({ msg: "Not authorized for finale decryption." });
    }

    if (team.currentLevelIndex > finaleIndex) {
      return res.json({ msg: "Already Completed" });
    }

    // Parse submitted answer
    const submitted = (answer || "")
      .trim()
      .toUpperCase()
      .split("-")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    // Admin Override
    if (submitted.join("-") === "OVERRIDE-VICTORY") {
      team.currentLevelIndex = team.path.length + 1;
      team.lastLevelCompletedAt = new Date();
      await team.save();
      logger.info(`Team ${team.teamId} used OVERRIDE-VICTORY`);
      return res.json({ msg: "OVERRIDE ACCEPTED. STATUS: LEGENDARY." });
    }

    // Get expected keywords (exclude START)
    const keywords = team.collectedKeywords
      .map((k) => k.trim().toUpperCase())
      .filter((k) => k !== "START");

    // Validate using edge-case tolerant function
    const valid = isValidOrder(submitted, keywords, team.finaleChallenge);

    if (!valid) {
      logger.warn(
        `Team ${team.teamId} failed finale (${team.finaleChallenge}). Tried: ${submitted.join("-")}`,
      );
      return res
        .status(400)
        .json({ msg: "Decryption Failed. Check your Sorting Logic!" });
    }

    // Success: Mark as Completed
    team.currentLevelIndex = team.path.length + 1;
    team.lastLevelCompletedAt = new Date();
    team.levelHistory.push({
      level: team.path.length,
      completedAt: new Date(),
    });

    await team.save();
    logger.info(`******* TEAM ${team.teamId} COMPLETED THE HUNT *******`);

    res.json({ msg: "DECRYPTION SUCCESSFUL. STATUS: LEGENDARY." });
  } catch (err) {
    logger.error(err.message, err);
    res.status(500).json({ msg: "Server Error" });
  }
};
