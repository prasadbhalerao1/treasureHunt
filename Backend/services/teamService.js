import Team from "../models/Team.js";
import { hashPassword } from "../utils/auth.js";
import { randomBytes } from "node:crypto";
import { ROLES, FINALE_CHALLENGES } from "../config/constants.js";
import logger from "../utils/logger.js";
import { getSettings } from "./settingsService.js";
import { buildChallenges } from "./questionService.js";

// Fisher-Yates Shuffle
function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

// Generate unique Team ID (e.g., "TIT-A3F2")
export function generateTeamId(name) {
  const suffix = randomBytes(2).toString("hex").toUpperCase();
  const prefix = name
    .substring(0, 3)
    .toUpperCase()
    .replace(/[^A-Z]/g, "X");
  return `${prefix}-${suffix}`;
}

// Generate balanced game path: Start (0) + `levels` least-used random locations.
// Queries the DB to find the current load on each location.
export async function generateBalancedPath(levels = 7) {
  const allTeams = await Team.find({ role: "CANDIDATE" }).select("path");
  const locationUsage = {};
  const existingOrders = new Set();

  // Initialize counts for 1-12
  for (let i = 1; i <= 12; i++) {
    locationUsage[i] = 0;
  }

  allTeams.forEach((t) => {
    existingOrders.add(t.path.join(","));
    t.path.slice(1).forEach((locId) => {
      if (locationUsage[locId] !== undefined) {
        locationUsage[locId]++;
      }
    });
  });

  const locationIds = Array.from({ length: 12 }, (_, i) => i + 1);
  const count = Math.min(levels, locationIds.length);

  let path;
  // Retry a few times so two teams never share an identical order
  for (let attempt = 0; attempt < 20; attempt++) {
    const sorted = [...locationIds].sort((a, b) => {
      const diff = locationUsage[a] - locationUsage[b];
      if (diff !== 0) return diff;
      return Math.random() - 0.5;
    });
    path = [0, ...shuffle(sorted.slice(0, count))];
    if (!existingOrders.has(path.join(","))) break;
  }
  return path;
}

// Core Team Creation Logic
export async function createTeamRecord({ name, email, password }) {
  const existing = await Team.findOne({ $or: [{ name }, { email }] });
  if (existing) {
    throw new Error("Team Name or Email already taken");
  }

  const teamId = generateTeamId(name);
  const hashedPassword = await hashPassword(password);
  const [salt] = hashedPassword.split(":");
  const settings = await getSettings();
  const path = await generateBalancedPath(settings.totalLevels);
  const challenges = await buildChallenges(settings.totalLevels);

  const newTeam = await Team.create({
    teamId,
    name,
    email,
    passwordHash: hashedPassword,
    salt,
    role: ROLES.CANDIDATE,
    path,
    currentLevelIndex: -1,
    finaleChallenge:
      Object.values(FINALE_CHALLENGES)[
        Math.floor(Math.random() * Object.values(FINALE_CHALLENGES).length)
      ],
    challenges,
    collectedKeywords: [],
    activeSessions: [],
  });

  return { team: newTeam, path, password };
}

// Trigger the Make.com webhook that emails the team its login details.
// Awaited by the caller (serverless functions may be frozen right after the
// response is sent), with a timeout so a slow webhook cannot hang team creation.
export async function triggerWebhook(teamData) {
  const WEBHOOK_URL = process.env.MAKE_WEBHOOK_URL;

  if (!WEBHOOK_URL) {
    logger.warn("Webhook URL not configured.");
    return { sent: false, reason: "MAKE_WEBHOOK_URL is not configured" };
  }

  try {
    const settings = await getSettings();
    const payload = {
      teamId: teamData.teamId,
      name: teamData.name,
      email: teamData.email,
      to: teamData.email,
      password: teamData.password,
      eventName: settings.eventName,
      tagline: settings.tagline,
      totalLevels: settings.totalLevels,
      loginUrl: process.env.FRONTEND_URL || "",
      subject: `Your ${settings.eventName} login`,
    };

    const res = await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(8000),
    });
    logger.info(`Webhook for ${teamData.teamId} responded ${res.status}`);
    return res.ok
      ? { sent: true }
      : { sent: false, reason: `Webhook returned HTTP ${res.status}` };
  } catch (err) {
    logger.error(`Webhook failed: ${err.message}`, err);
    return { sent: false, reason: err.message };
  }
}
