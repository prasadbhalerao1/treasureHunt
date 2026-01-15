import Team from "../models/Team.js";
import { hashPassword, verifyPassword } from "../utils/auth.js";
import jwt from "jsonwebtoken";
import { randomBytes } from "node:crypto";
import dbConnect from "../config/dbConnect.js";
import { sendTeamIdEmail, sendOtpEmail } from "../utils/email.js";

export const register = async (req, res) => {
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
    // console.log("Hashed Password:", hashedPassword); Removed for production

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
    if (team.activeSessions.length >= 5) {
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
      team: {
        teamId: team.teamId,
        name: team.name,
        role: team.role,
        level: team.currentLevel,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server Error" });
  }
};

export const forgotPassword = async (req, res) => {
  try {
    await dbConnect();
    const { email } = req.body;

    const team = await Team.findOne({ email });
    if (!team) {
      return res
        .status(200)
        .json({ msg: "If that email exists, an OTP has been sent." });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    team.resetPasswordOtp = otp;
    team.resetPasswordExpires = Date.now() + 10 * 60 * 1000;

    await team.save();

    await team.save();

    await sendOtpEmail(email, otp, team.teamId);

    res.status(200).json({ msg: "OTP sent to your email." });
  } catch (err) {
    console.error("FORGOT PASSWORD ERROR:", err);
    res.status(500).json({ msg: "Server Error" });
  }
};

export const resetPassword = async (req, res) => {
  try {
    await dbConnect();
    const { email, otp, newPassword } = req.body;

    const team = await Team.findOne({
      email,
      resetPasswordOtp: otp,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!team) {
      return res.status(400).json({ msg: "Invalid or Expired OTP" });
    }

    const hashedPassword = await hashPassword(newPassword);
    const [saltParam, hashParam] = hashedPassword.split(":");

    team.passwordHash = hashedPassword;
    team.salt = saltParam;
    team.resetPasswordOtp = undefined;
    team.resetPasswordExpires = undefined;
    team.activeSessions = [];

    await team.save();

    res.status(200).json({ msg: "Password Reset Successful. Login now." });
  } catch (err) {
    console.error("RESET PASSWORD ERROR:", err);
    res.status(500).json({ msg: "Server Error" });
  }
};
