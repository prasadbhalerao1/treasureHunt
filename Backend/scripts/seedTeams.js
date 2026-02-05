import mongoose from "mongoose";
import Team from "../models/Team.js";
import { hashPassword } from "../utils/auth.js";
import dotenv from "dotenv";

import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "../.env") });

import { FINALE_CHALLENGES } from "../config/constants.js";

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

const CHALLENGE_TYPES = Object.values(FINALE_CHALLENGES);

const seedTeams = async () => {
  if (!process.env.MONGODB_URI) {
    console.error("❌ MONGODB_URI is not defined in .env");
    process.exit(1);
  }

  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB.");

    // Delete ALL teams (Candidates AND Admins) as requested for a full wipe
    await Team.deleteMany({});
    console.log("Cleared ALL teams (including admins).");

    // 1. Create ADMIN
    const adminPass = await hashPassword("adminpassword123");
    const [adminSalt, adminHash] = adminPass.split(":");

    await Team.create({
      teamId: "ADMIN-MAIN",
      name: "Master Admin",
      email: "admin@treasurehunt.com",
      role: "ADMIN",
      passwordHash: adminPass,
      salt: adminSalt,
      members: ["Admin"],
      path: [],
      currentLevelIndex: 0,
    });
    console.log("✅ Admin (ADMIN-MAIN) created.");

    // 2. Create 35 Teams with BALANCED PATHS
    const teamPassword = await hashPassword("123456");
    const [teamSalt, teamHash] = teamPassword.split(":");

    const teams = [];
    const locationIds = Array.from({ length: 12 }, (_, i) => i + 1); // [1...12]

    // --- BALANCING LOGIC START ---
    const locationUsage = {};
    for (const id of locationIds) {
      locationUsage[id] = 0;
    }

    const getBalancedPath = () => {
      // 1. Sort locations by usage count (ascending) to pick least used first
      const sortedLocs = [...locationIds].sort((a, b) => {
        const diff = locationUsage[a] - locationUsage[b];
        // Break ties randomly
        if (diff !== 0) return diff;
        return Math.random() - 0.5;
      });

      // 2. Pick top 6
      const selected = sortedLocs.slice(0, 6);

      // 3. Update usage
      selected.forEach((id) => locationUsage[id]++);

      // 4. Shuffle selection for random order
      return shuffle(selected);
    };
    // --- BALANCING LOGIC END ---

    for (let i = 1; i <= 20; i++) {
      const teamId = `Team-${i}`;

      // Random Challenge
      const randomChallenge =
        CHALLENGE_TYPES[Math.floor(Math.random() * CHALLENGE_TYPES.length)];

      const balancedLocs = getBalancedPath();
      const path = [0, ...balancedLocs]; // Start + 6 balanced

      teams.push({
        teamId: teamId,
        name: `Team ${i}`,
        email: `team${i}@berlinheist.local`,
        passwordHash: teamPassword,
        salt: teamSalt,
        members: [`Member 1`, `Member 2`],
        role: "CANDIDATE",
        path: path,
        currentLevelIndex: -1,
        finaleChallenge: randomChallenge,
        collectedKeywords: [],
        activeSessions: [],
      });
    }

    await Team.insertMany(teams);

    console.log("\n╔══════════════════════════════════════════╗");
    console.log("║       🎮 TEAMS CREATED SUCCESSFULLY 🎮    ║");
    console.log("╠══════════════════════════════════════════╣");
    console.log(`║  Teams:    Team-1 to Team-20              ║`);
    console.log(`║  Password: 123456                         ║`);
    console.log("╚══════════════════════════════════════════╝");

    // Log usage stats for verification
    console.log("\n--- Location Usage Stats (Target ~17-18) ---");
    Object.entries(locationUsage).forEach(([id, count]) => {
      console.log(`Loc ${id}: ${count}`);
    });

    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding teams:", error);
    process.exit(1);
  }
};

seedTeams();
