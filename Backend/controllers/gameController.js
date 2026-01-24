import Team from "../models/Team.js";
import Location from "../models/Location.js";
import dbConnect from "../config/dbConnect.js";

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

    // Path Logic:
    // path = [0, 5, 12, ...]. Length = 7 (Start + 6 Levels).
    // currentLevelIndex = 0 (At Start).
    // Next Target = path[currentLevelIndex + 1].

    const nextIndex = team.currentLevelIndex + 1;

    // Check if Game Completed
    if (nextIndex >= team.path.length) {
      return res.json({
        teamId: team.teamId,
        level: team.currentLevelIndex, // 6
        status: "COMPLETED",
        hint: "Congratulations! You have completed the Treasure Hunt.",
        collectedKeywords: team.collectedKeywords,
      });
    }

    const nextLocationId = team.path[nextIndex];
    const hint = await getHintForLocation(nextLocationId);

    res.json({
      teamId: team.teamId,
      name: team.name,
      level: team.currentLevelIndex, // Display "Level 0" if at start
      status: "HINT_UNLOCKED",
      hint: hint,
      collectedKeywords: team.collectedKeywords,
    });
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

    // Validate QR
    if (qrString !== targetLocation.qrSecret) {
      return res.status(400).json({ msg: "Invalid QR Code. Wrong Location?" });
    }

    // Success: Advance Level
    const completionTime = new Date();
    team.currentLevelIndex = nextIndex;
    team.lastLevelCompletedAt = completionTime;

    team.levelHistory.push({
      level: nextIndex, // The level we just finished?
      // Wait. If I am at Index 0 (Start), nextIndex is 1. I Scan QR for Loc 1.
      // I have now completed "Level 1" (or step 1).
      // User naming: "Level 1" is usually the first objective.
      // Let's store the index.
      level: nextIndex,
      completedAt: completionTime,
    });

    // Award Keyword from Location Data
    const keyword = targetLocation.keyword || `Keyword-${targetLocationId}`;

    if (!team.collectedKeywords.includes(keyword)) {
      team.collectedKeywords.push(keyword);
    }

    await team.save();

    // Prepare Response (Next Hint)
    const newNextIndex = team.currentLevelIndex + 1;
    let nextHint = "Finale";

    if (newNextIndex < team.path.length) {
      const nextLocId = team.path[newNextIndex];
      nextHint = await getHintForLocation(nextLocId);
    } else {
      nextHint = "Congratulations! You have executed the heist successfully.";
    }

    res.json({
      msg: "Level Completed!",
      keyword: keyword,
      nextLevel: team.currentLevelIndex,
      nextHint: nextHint,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server Error" });
  }
};

// submitAnswer - Keeping simplified/placeholder if they need text submission
// User didn't ask for it in new flow, but safe to keep a basic version or remove.
// I'll keep a stub.
export const submitAnswer = async (req, res) => {
  return res
    .status(400)
    .json({ msg: "No text submission required in this version." });
};
