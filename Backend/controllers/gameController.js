import Team from "../models/Team.js";
import Level from "../models/Level.js";
import dbConnect from "../config/dbConnect.js";

export const getGameState = async (req, res) => {
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
      verified: currentStatus ? currentStatus.verified : false,
      // Show hint ONLY if unlocked
      hint: levelInfo.hintText,
      // Location is only for internal debug or if we want to show it after solving
      collectedKeywords: team.collectedKeywords,
    };

    res.json(response);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server Error" });
  }
};

export const volunteerVerify = async (req, res) => {
  try {
    await dbConnect();
    const { teamId, levelToVerify } = req.body;

    // Get the Volunteer's assigned level (IN A REAL APP).
    // For now, we trust the volunteer or assume the client sends the Volunteer's location.
    // However, the PROMPT says: "Volunteer types 'TIT' ... Case B: Team is on Level 1, but they ran to Level 3 Volunteer -> WRONG LOCATION"
    // This implies the System checks "Is Team.currentLevel == Volunteer.assignedLevel?"
    // Since we don't have Volunteer.assignedLevel in the DB, we will assume the request includes verificationLevel.

    const team = await Team.findOne({ teamId });
    if (!team) return res.status(404).json({ msg: "Team not found" });

    // 0. Check if Game Completed (Level > 7)
    if (team.currentLevel > 7) {
      return res.status(200).json({
        code: "GAME_COMPLETED",
        msg: "Team has successfully completed the mission!",
      });
    }

    // 1. Strict Sequential Check
    if (team.currentLevel !== parseInt(levelToVerify)) {
      return res.status(400).json({
        code: "WRONG_LOCATION",
        msg: `Team is on Level ${team.currentLevel}, but you are verifying for Level ${levelToVerify}.`,
        currentLevel: team.currentLevel,
      });
    }

    // 2. Check if they have already verified
    const statusObj = team.levelStatus.get(String(team.currentLevel));
    if (statusObj.verified) {
      return res.status(200).json({
        code: "ALREADY_VERIFIED",
        msg: "Team already verified for this level.",
      });
    }

    // 3. Mark as Verified (Unlock Scanner)
    statusObj.verified = true;
    statusObj.volunteerVerifiedAt = new Date();
    statusObj.status = "AWAITING_QR"; // Ready to scan

    team.levelStatus.set(String(team.currentLevel), statusObj);
    await team.save();

    res.json({ msg: "VERIFIED. Scanner Unlocked on Candidate Device." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server Error" });
  }
};

export const scanQR = async (req, res) => {
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

    // 1. Volunteer Verification Required
    if (!statusObj.verified) {
      return res.status(403).json({
        msg: "Scanner Locked. You must be verified by a Volunteer first.",
      });
    }

    // 2. Validate QR Content
    if (qrString !== level.qrSecret) {
      return res.status(400).json({ msg: "Invalid QR Code for this Level." });
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
        verified: false,
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
    console.error(err);
    res.status(500).json({ msg: "Server Error" });
  }
};

export const submitAnswer = async (req, res) => {
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
    console.error(err);
    res.status(500).json({ msg: "Server Error" });
  }
};
export const lookupTeam = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.json(null);
    await dbConnect();

    const team = await Team.findOne({
      $or: [
        { teamId: { $regex: q, $options: "i" } },
        { name: { $regex: q, $options: "i" } },
      ],
    });

    if (!team) return res.status(404).json({ msg: "Not found" });

    const statusObj = team.levelStatus.get(String(team.currentLevel));
    res.json({
      teamId: team.teamId,
      name: team.name,
      currentLevel: team.currentLevel,
      status: statusObj ? statusObj.status : "UNKNOWN",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server Error" });
  }
};
