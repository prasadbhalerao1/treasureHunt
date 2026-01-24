  import Team from "../models/Team.js";
import { hashPassword, verifyPassword } from "../utils/auth.js";
import jwt from "jsonwebtoken";
import { randomBytes } from "node:crypto";
import dbConnect from "../config/dbConnect.js";
import { sendTeamIdEmail } from "../utils/email.js";

export const register = async (req, res, next) => {
  try {
    await dbConnect();
    const { teamName, email, password, members } = req.body;

    if (members && members.length > 3) {
      return res
        .status(400)
        .json({ msg: "Maximum 4 members allowed (Leader + 3 others)." });
    }

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
    // Send Email (Await to ensure it works)
    console.log(`Sending email to ${email}...`);
    const emailSent = await sendTeamIdEmail(email, teamName, teamId);
    if (!emailSent) {
      console.error("FAILED TO SEND EMAIL in register controller");
      // Optional: return error or just warn? For now warn.
    } else {
      console.log("Email successfully handed off to nodemailer.");
    }

    console.log(`[AUTH] Team Registered: ${newTeam.teamId} (${email})`);
    res.status(201).json({ msg: "Team Registered", teamId: newTeam.teamId });
  } catch (err) {
    console.error(`[AUTH_ERROR] Register Failed: ${err.message}`);
    next(err); // Pass to global handler
  }
};

export const login = async (req, res, next) => {
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
      { expiresIn: "12h" },
    );

    team.activeSessions.push(jti);
    await team.save();

    console.log(`[AUTH] Login Success: ${team.teamId}`);
    res.json({
      token,
      team: {
        teamId: team.teamId,
        name: team.name,
        role: team.role,
        level: team.currentLevel,
      },
    });
  } catch (err) {
    console.error(`[AUTH_ERROR] Login Failed: ${err.message}`);
    next(err);
  }
};
