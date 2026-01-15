import Team from "../models/Team.js";
import Level from "../models/Level.js";
import dbConnect from "../config/dbConnect.js";

// getGameState Modified: Removed verification check
export const getGameState = async (req, res, next) => {
  try {
    await dbConnect();
    const team = await Team.findById(req.user.id);
    if (!team) return res.status(404).json({ msg: "Team not found" });

    // Fetch Level Info
    const levelInfo = await Level.findOne({ levelNumber: team.currentLevel });

    // If level not found (e.g. finished game), handle gracefully
    if (!levelInfo && team.currentLevel > 7) {
      return res.json({
        level: team.currentLevel,
        status: "COMPLETED",
        hint: "Mission Accomplished. You have successfully completed all challenges.",
        collectedKeywords: team.collectedKeywords,
      });
    }

    if (!levelInfo) {
      return res.status(404).json({ msg: "Level data not found" });
    }

    const currentStatus = team.levelStatus.get(String(team.currentLevel));

    // Construct response
    const response = {
      teamId: team.teamId,
      name: team.name,
      level: team.currentLevel,
      status: currentStatus ? currentStatus.status : "LOCKED",
      // verified removed
      // Show hint ONLY if unlocked
      hint: levelInfo.hintText,
      collectedKeywords: team.collectedKeywords,
    };

    res.json(response);
  } catch (err) {
    next(err);
  }
};

export const scanQR = async (req, res, next) => {
  try {
    const { qrString } = req.body;
    await dbConnect();
    const team = await Team.findById(req.user.id);
    const level = await Level.findOne({ levelNumber: team.currentLevel });

    if (!level) return res.status(400).json({ msg: "Invalid Level Error" });

    // Triangulation Check
    const statusObj = team.levelStatus.get(String(team.currentLevel));

    // 0. Idempotency Check: Already Completed?
    if (statusObj.status === "COMPLETED") {
      return res.status(200).json({
        msg: "Level Already Completed",
        keyword: level.keyword, // Return keyword again so client stays in sync
        nextLevel: team.currentLevel + 1,
        nextHint: "Wait for update...", // Fallback
      });
    }

    // 1. Volunteer Verification Required - REMOVED

    // 2. Validate QR Content
    // Strict Sequential Check: The 'level' var is fetched based on team.currentLevel
    // So if I scan "LEVEL_6_SECRET" but I am on Level 1, level.qrSecret will be "LEVEL_1_SECRET"
    // Comparison fails -> Invalid QR
    if (qrString !== level.qrSecret) {
      return res
        .status(400)
        .json({ msg: "Invalid QR Code. Are you at the correct location?" });
    }

    // Success!
    statusObj.status = "COMPLETED";
    statusObj.completedAt = new Date();
    team.levelStatus.set(String(team.currentLevel), statusObj);

    // Award Keyword
    const rewardKeyword = level.keyword;
    if (rewardKeyword && !team.collectedKeywords.includes(rewardKeyword)) {
      team.collectedKeywords.push(rewardKeyword);
    }

    // Advance Level
    const nextLevel = team.currentLevel + 1;
    team.currentLevel = nextLevel;

    // Initialize Next Level Logic
    if (nextLevel <= 7) {
      // Level 7 is Finale (Bitlocker)
      // Levels 1-6 are standard
      team.levelStatus.set(String(nextLevel), {
        status: "HINT_UNLOCKED", // Immediately show hint for next level
        // verified: false, // REMOVED
      });
    }

    await team.save();

    // Fetch next level hint to return immediately
    const nextLevelInfo = await Level.findOne({ levelNumber: nextLevel });

    res.json({
      msg: "Level Completed!",
      keyword: rewardKeyword,
      nextLevel: nextLevel,
      nextHint: nextLevelInfo ? nextLevelInfo.hintText : "Finale",
    });
  } catch (err) {
    next(err);
  }
};

export const submitAnswer = async (req, res, next) => {
  // Mostly used for the Finale (Bitlocker) now, as Levels 1-6 are purely QR scan driven?
  // User Prompt: "The Login... Dashboard... Find Volunteer... Scan QR... Next Clue"
  // It doesn't mention solving a text riddle to get the location. It says "Riddle pointing to Location 1".
  // Implication: User reads riddle -> Goes to location. No text input needed for L1-6.
  // ONLY Level 7 (Finale) needs text input.

  try {
    await dbConnect();
    const { answer } = req.body;
    const team = await Team.findById(req.user.id);

    // Only allow for Level 7 (Finale)
    if (team.currentLevel !== 7) {
      return res.status(400).json({
        msg: "No text submission required for this level. Find the Volunteer!",
      });
    }

    const level = await Level.findOne({ levelNumber: 7 });

    // Normalize Input: "BERLIN-HEIST..."
    const sanitizedInput = answer.trim().toUpperCase();
    const correct = level.acceptedAnswers.includes(sanitizedInput);

    if (correct) {
      // Game Over / Win
      const statusObj = team.levelStatus.get("7");
      statusObj.status = "COMPLETED";
      statusObj.completedAt = new Date();
      team.levelStatus.set("7", statusObj);

      // Mark as finished?
      team.currentLevel = 8; // "8" = Finished state in specific logic
      await team.save();

      return res.json({
        msg: "ACCESS GRANTED. DECRYPTION SUCCESSFUL.",
        status: "WIN",
      });
    } else {
      return res
        .status(400)
        .json({ msg: "DECRYPTION FAILED. INVALID SEQUENCE." });
    }
  } catch (err) {
    next(err);
  }
};
