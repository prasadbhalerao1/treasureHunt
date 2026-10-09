import express from "express";
import dbConnect from "../config/dbConnect.js";
import { getSettings, publicSettings } from "../services/settingsService.js";

const router = express.Router();

// Unauthenticated: branding and non-sensitive event info only
router.get("/public", async (req, res) => {
  try {
    await dbConnect();
    res.json(publicSettings(await getSettings()));
  } catch {
    res.status(500).json({ msg: "Server Error" });
  }
});

export default router;
