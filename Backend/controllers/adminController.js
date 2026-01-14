import Team from "../models/Team.js";
import dbConnect from "../config/dbConnect.js";

export const getDashboardStats = async (req, res) => {
  try {
    await dbConnect();
    const { level } = req.query;

    // 1. Level-Specific Leaderboard
    if (level) {
      const targetLevel = String(level);
      const prevLevel = String(parseInt(level) - 1);

      const teams = await Team.find({
        [`levelStatus.${targetLevel}.status`]: "COMPLETED",
        role: "CANDIDATE",
      }).select("name teamId levelStatus createdAt");

      const leaderboard = teams.map((t) => {
        const currentLvlData = t.levelStatus.get(targetLevel);
        const prevLvlData =
          prevLevel !== "0" ? t.levelStatus.get(prevLevel) : null;

        const endTime = new Date(currentLvlData.completedAt);
        // If Level 1, start time is Team Creation. Else, it's completion of previous level.
        const startTime = prevLvlData
          ? new Date(prevLvlData.completedAt)
          : new Date(t.createdAt);

        const duration = endTime - startTime; // milliseconds

        return {
          teamId: t.teamId,
          name: t.name,
          completedAt: endTime,
          timeTaken: duration,
        };
      });

      // Sort by Time Taken (Fastest first)
      leaderboard.sort((a, b) => a.timeTaken - b.timeTaken);

      return res.json({ leaderboard });
    }

    // 2. General Overview (No Level Selected)
    const teamsPerLevel = await Team.aggregate([
      { $match: { role: "CANDIDATE" } },
      { $group: { _id: "$currentLevel", count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);

    // Top 10 Global Leaderboard (Highest Level)
    const globalLeaderboard = await Team.find({ role: "CANDIDATE" })
      .select("teamId name currentLevel updatedAt")
      .sort({ currentLevel: -1, updatedAt: 1 })
      .limit(10);

    res.json({
      distribution: teamsPerLevel.map((i) => ({
        level: `Level ${i._id}`,
        count: i.count,
      })),
      leaderboard: globalLeaderboard,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server Error" });
  }
};
