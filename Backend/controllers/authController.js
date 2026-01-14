import Team from "../models/Team.js";
import { hashPassword, verifyPassword } from "../utils/auth.js";
import jwt from "jsonwebtoken";
import { randomBytes } from "node:crypto";
import dbConnect from "../config/dbConnect.js";

export const register = async (req, res) => {
  try {
    await dbConnect();
    const { teamName, email, password, members } = req.body;

    const existing = await Team.findOne({
      $or: [{ name: teamName }, { email }],
    });
    if (existing)
      return res.status(400).json({ msg: "Team Name or Email already taken" });

    // Generate TeamID (Titan-X99 style)
    const suffix = randomBytes(2).toString("hex").toUpperCase();
    const prefix = teamName.substring(0, 3).toUpperCase();
    const teamId = `${prefix}-${suffix}`;
    console.log("Generated TeamID:", teamId);

    const hashedPassword = await hashPassword(password);
    console.log("Hashed Password:", hashedPassword);

    const [saltParam, hashParam] = hashedPassword.split(":");

    console.log("Creating Team in DB...");
    const newTeam = await Team.create({
      teamId,
      name: teamName,
      email,
      passwordHash: hashedPassword,
      salt: saltParam,
      members: members || [],
      activeSessions: [],
    });
    console.log("Team Created:", newTeam._id);

    res.status(201).json({ msg: "Team Registered", teamId: newTeam.teamId });
  } catch (err) {
    console.error("REGISTER ERROR:", err);
    res.status(500).json({ msg: "Server Error", error: err.message });
  }
};

export const login = async (req, res) => {
  try {
    await dbConnect();
    const { teamId, password } = req.body;

    const team = await Team.findOne({ teamId });
    if (!team) return res.status(401).json({ msg: "Invalid Credentials" });

    const isValid = await verifyPassword(password, team.passwordHash);
    if (!isValid) return res.status(401).json({ msg: "Invalid Credentials" });

    // Concurrent Session Check
    if (team.activeSessions.length >= 3) {
      // FIFO: Remove oldest
      team.activeSessions.shift();
    }

    const jti = randomBytes(16).toString("hex");
    const token = jwt.sign(
      { teamId: team.teamId, role: team.role, id: team._id, jti },
      process.env.JWT_SECRET,
      { expiresIn: "12h" }
    );

    team.activeSessions.push(jti);
    await team.save();

    res.json({
      token,
      team: { name: team.name, role: team.role, level: team.currentLevel },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server Error" });
  }
};
