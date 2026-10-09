/**
 * TraceRoute - Settings Seeding Script
 * Creates the single settings document with defaults (existing values are kept
 * unless you pass --reset).
 *
 * Usage: npm run seed:settings [-- --reset]
 */
import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Settings from "../models/Settings.js";
import { DEFAULT_SETTINGS } from "../config/constants.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "../.env") });

const seedSettings = async () => {
  if (!process.env.MONGODB_URI) {
    console.error("❌ MONGODB_URI is not defined in .env");
    process.exit(1);
  }

  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const reset = process.argv.includes("--reset");
    const existing = await Settings.findOne({ key: "main" });

    if (existing && !reset) {
      console.log("ℹ️  Settings already exist (use --reset to overwrite).");
    } else {
      await Settings.findOneAndUpdate(
        { key: "main" },
        { $set: { key: "main", ...DEFAULT_SETTINGS } },
        { upsert: true },
      );
      console.log("✅ Settings saved:", DEFAULT_SETTINGS);
    }
    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding settings:", error);
    process.exit(1);
  }
};

seedSettings();
