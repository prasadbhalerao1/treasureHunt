/**
 * TraceRoute - Demo Team Seeding Script
 * Wipes ALL teams (admins too) and creates demo teams with balanced paths and
 * unique random question sets. Run seed:locations, seed:questions and
 * seed:settings first. Re-run seed:admin afterwards.
 *
 * Usage: npm run seed:teams [-- --count=20]
 */
import mongoose from "mongoose";
import Team from "../models/Team.js";
import { hashPassword } from "../utils/auth.js";
import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { FINALE_CHALLENGES } from "../config/constants.js";
import { getSettings } from "../services/settingsService.js";
import { generateBalancedPath } from "../services/teamService.js";
import { buildChallenges } from "../services/questionService.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "../.env") });

const CHALLENGE_TYPES = Object.values(FINALE_CHALLENGES);

const countArg = process.argv.find((a) => a.startsWith("--count="));
const TEAM_COUNT = countArg ? Number(countArg.split("=")[1]) : 20;

const seedTeams = async () => {
  if (!process.env.MONGODB_URI) {
    console.error("❌ MONGODB_URI is not defined in .env");
    process.exit(1);
  }

  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB.");

    await Team.deleteMany({});
    console.log("Cleared ALL teams (including admins).");

    const settings = await getSettings();
    const teamPassword = await hashPassword(
      process.env.DEMO_TEAM_PASSWORD || "123456",
    );
    const [teamSalt] = teamPassword.split(":");

    // Created one by one so each team sees the usage of the previous ones
    // (balanced locations and balanced question usage).
    for (let i = 1; i <= TEAM_COUNT; i++) {
      const teamPath = await generateBalancedPath(settings.totalLevels);
      const challenges = await buildChallenges(teamPath.length - 1);
      await Team.create({
        teamId: `Team-${i}`,
        name: `Team ${i}`,
        email: `team${i}@traceroute.local`,
        passwordHash: teamPassword,
        salt: teamSalt,
        role: "CANDIDATE",
        path: teamPath,
        challenges,
        currentLevelIndex: -1,
        finaleChallenge:
          CHALLENGE_TYPES[Math.floor(Math.random() * CHALLENGE_TYPES.length)],
        collectedKeywords: [],
        activeSessions: [],
      });
    }

    console.log(`✅ Created Team-1 to Team-${TEAM_COUNT}.`);
    console.log(
      `   Password: ${process.env.DEMO_TEAM_PASSWORD ? "(DEMO_TEAM_PASSWORD)" : "123456"}`,
    );
    console.log("   Now run: npm run seed:admin");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding teams:", error.message);
    process.exit(1);
  }
};

seedTeams();
