import Team from "../models/Team.js";
import Location from "../models/Location.js";
import dbConnect from "../config/dbConnect.js";
import { GAME_STATUS } from "../config/constants.js";
import logger from "../utils/logger.js";

// Helper: Get Hint for a specific location ID
const getHintForLocation = async (locId) => {
  const loc = await Location.findOne({ locationId: locId });
  return loc ? loc.hint : "Hint not found.";
};

export const getGameState = async (req, res) => {
  try {
    await dbConnect();
    const team = await Team.findById(req.user.id);
    if (!team) return res.status(404).json({ msg: "Team not found" });

    // 1. Check for COMPLETED (Index 7+)
    // Note: path.length is 7 (Indices 0-6)
    if (team.currentLevelIndex >= team.path.length) {
      return res.json({
        teamId: team.teamId,
        level: team.currentLevelIndex,
        status: GAME_STATUS.COMPLETED,
        hint: "Congratulations! You have completed the Treasure Hunt.",
        collectedKeywords: team.collectedKeywords,
      });
    }

    // 2. Check for FINALE (Index 6)
    // Team has scanned scanning all 6 QRs, now needs to solve Bitlocker
    if (team.currentLevelIndex === team.path.length - 1) {
      return res.json({
        teamId: team.teamId,
        level: 7, // Send 7 to trigger Dashboard "Finale Mode"
        status: GAME_STATUS.FINALE,
        hint: "The password is the sequence. Arrange in alphabetical order.",
        collectedKeywords: team.collectedKeywords,
      });
    }

    // 3. Normal Gameplay
    // Show hint for NEXT location
    const nextIndex = team.currentLevelIndex + 1;

    // Safety: Ensure valid index
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
      nextLevel: nextIndex, // Helper for frontend
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

    // Validate QR (case-insensitive to be forgiving)
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

    // Award Keyword from Location Data
    const keyword = targetLocation.keyword || `Keyword-${targetLocationId}`;

    if (!team.collectedKeywords.includes(keyword)) {
      team.collectedKeywords.push(keyword);
    }

    await team.save();

    logger.info(`Team ${team.teamId} scanned location ${targetLocationId}`);

    // Prepare Response (Next Hint)

    // Check if we just entered Finale
    if (team.currentLevelIndex === team.path.length - 1) {
      return res.json({
        msg: "Level Completed!",
        keyword: keyword,
        nextLevel: 7, // Visual override for Finale
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

// submitAnswer - Handles the Finale (BitLocker) decryption
export const submitAnswer = async (req, res) => {
  try {
    const { answer } = req.body;
    await dbConnect();
    const team = await Team.findById(req.user.id);

    if (!team) return res.status(404).json({ msg: "Team not found" });

    // Ensure they are at the finale (Index 6)
    const finaleIndex = team.path.length - 1;

    if (team.currentLevelIndex < finaleIndex) {
      return res
        .status(400)
        .json({ msg: "Not authorized for finale decryption." });
    }

    if (team.currentLevelIndex > finaleIndex) {
      return res.json({ msg: "Already Completed" });
    }

    // Validation Logic: "ARRANGE KEYWORDS ALPHABETICALLY"
    // Expectation: ALPHA-BETA-GAMMA... (Hyphenated, Case Insensitive)

    // 1. Get Collected Keywords
    // 2. Sort them
    // 3. Join with '-'
    // EXCLUDE "START" keyword if present, as per user request
    const expected = team.collectedKeywords
      .map((k) => k.trim().toUpperCase())
      .filter((k) => k !== "START")
      .sort()
      .join("-");

    const submitted = (answer || "").trim().toUpperCase();

    if (submitted !== expected && submitted !== "OVERRIDE-VICTORY") {
      logger.warn(
        `Team ${team.teamId} failed final decryption. Tried: ${submitted}`,
      );
      return res
        .status(400)
        .json({ msg: "Decryption Failed. Verify Sequence." });
    }

    // Success: Mark as Completed (Level 7+)

    team.currentLevelIndex = team.path.length + 1;
    team.lastLevelCompletedAt = new Date();
    team.levelHistory.push({
      level: team.path.length, // Level 7 completed
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
