import Team from "../models/Team.js";
import { verifyPassword } from "../utils/auth.js";
import jwt from "jsonwebtoken";
import { randomBytes } from "node:crypto";
import dbConnect from "../config/dbConnect.js";
import logger from "../utils/logger.js";

export const login = async (req, res, next) => {
  try {
    await dbConnect();
    const { teamId, password } = req.body;

    const team = await Team.findOne({ teamId });
    if (!team) return res.status(401).json({ msg: "Invalid Credentials" });

    const isValid = await verifyPassword(password, team.passwordHash);
    if (!isValid) return res.status(401).json({ msg: "Invalid Credentials" });

    // Concurrent Session Check (FIFO, max 4)
    if (team.activeSessions.length >= 4) {
      team.activeSessions.shift();
    }

    const jti = randomBytes(16).toString("hex");
    const token = jwt.sign(
      { teamId: team.teamId, role: team.role, id: team._id, jti },
      process.env.JWT_SECRET,
      { expiresIn: "12h" },
    );

    team.activeSessions.push(jti);
    await team.save();

    logger.info(`Team logged in: ${team.teamId} [${team.role}]`);

    res.json({
      token,
      team: {
        teamId: team.teamId,
        name: team.name,
        role: team.role,
        level: team.currentLevelIndex,
      },
    });
  } catch (err) {
    logger.error(`[AUTH_ERROR] Login Failed: ${err.message}`, err);
    next(err);
  }
};
