/**
 * BERLIN HEIST - Admin Seeding Script
 * Creates a single admin account for the game
 *
 * Usage: npm run seed:admin
 *
 * Environment Variables:
 *   ADMIN_PASSWORD - Admin password (default: random generated)
 *   ADMIN_EMAIL    - Admin email (default: admin@berlinheist.local)
 *
 * @author Prasad Bhalerao (https://linkedin.com/in/prasadbhalerao)
 */

import mongoose from "mongoose";
import Team from "../models/Team.js";
import { hashPassword } from "../utils/auth.js";
import dotenv from "dotenv";
import { randomBytes } from "node:crypto";

import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "../.env") });

const seedAdmin = async () => {
  if (!process.env.MONGODB_URI) {
    console.error("❌ MONGODB_URI is not defined in .env");
    process.exit(1);
  }

  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB.");

    // Check if admin already exists
    const existingAdmin = await Team.findOne({ role: "ADMIN" });
    if (existingAdmin) {
      console.log("ℹ️  Admin already exists:");
      console.log(`   Team ID: ${existingAdmin.teamId}`);
      console.log(`   Email: ${existingAdmin.email}`);
      console.log("\n   To reset, run: npm run db:wipe first");
      process.exit(0);
    }

    // Generate or use provided password
    const adminPassword =
      process.env.ADMIN_PASSWORD || randomBytes(8).toString("hex");
    const adminEmail = process.env.ADMIN_EMAIL || "admin@berlinheist.local";

    const hashedPassword = await hashPassword(adminPassword);
    const [salt] = hashedPassword.split(":");

    await Team.create({
      teamId: "ADMIN-MAIN",
      name: "Game Master",
      email: adminEmail,
      role: "ADMIN",
      passwordHash: hashedPassword,
      salt: salt,
      members: ["Admin"],
      path: [],
      currentLevelIndex: 0,
    });

    console.log("\n╔══════════════════════════════════════════╗");
    console.log("║       🎮 ADMIN ACCOUNT CREATED 🎮         ║");
    console.log("╠══════════════════════════════════════════╣");
    console.log(`║  Team ID:  ADMIN-MAIN                    ║`);
    console.log(`║  Password: ${adminPassword.padEnd(28)}║`);
    console.log(`║  Email:    ${adminEmail.substring(0, 28).padEnd(28)}║`);
    console.log("╚══════════════════════════════════════════╝");
    console.log("\n⚠️  Save these credentials! They won't be shown again.");

    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding admin:", error);
    process.exit(1);
  }
};

seedAdmin();
