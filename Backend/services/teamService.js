import Team from "../models/Team.js";
import { hashPassword } from "../utils/auth.js";
import { randomBytes } from "node:crypto";
import { ROLES } from "../config/constants.js";
import logger from "../utils/logger.js";

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

// Generate randomized game path: Start (0) + 6 random from 1-12
// Generate balanced game path: Start (0) + 6 least used random locations
// queries DB to find current load on each location
export async function generateBalancedPath() {
  const allTeams = await Team.find({ role: "CANDIDATE" }).select("path");
  const locationUsage = {};

  // Initialize counts for 1-12
  for (let i = 1; i <= 12; i++) {
    locationUsage[i] = 0;
  }

  // Count existing usage
  allTeams.forEach((t) => {
    // path is [0, loc1, loc2, ..., loc6]
    // we only care about indices 1-6
    t.path.slice(1).forEach((locId) => {
      if (locationUsage[locId] !== undefined) {
        locationUsage[locId]++;
      }
    });
  });

  // Sort locations by usage (least used first)
  const locationIds = Array.from({ length: 12 }, (_, i) => i + 1);
  const sortedLocs = locationIds.sort((a, b) => {
    const diff = locationUsage[a] - locationUsage[b];
    // Break ties randomly to avoid predictable patterns
    if (diff !== 0) return diff;
    return Math.random() - 0.5;
  });

  // Pick top 6 least used
  const selected = sortedLocs.slice(0, 6);

  // Shuffle them for random order in the path
  const shuffledSelection = shuffle(selected);

  return [0, ...shuffledSelection];
}

// Core Team Creation Logic
export async function createTeamRecord({ name, email, password, members }) {
  const existing = await Team.findOne({ $or: [{ name }, { email }] });
  if (existing) {
    throw new Error("Team Name or Email already taken");
  }

  const teamId = generateTeamId(name);
  const hashedPassword = await hashPassword(password);
  const [salt] = hashedPassword.split(":");
  const path = await generateBalancedPath();

  const newTeam = await Team.create({
    teamId,
    name,
    email,
    passwordHash: hashedPassword,
    salt,
    members: members || [],
    role: ROLES.CANDIDATE,
    path,
    currentLevelIndex: -1,
    collectedKeywords: [],
    activeSessions: [],
  });

  return { team: newTeam, path, password };
}

// Trigger Make.com Webhook (Fire-and-Forget)
export function triggerWebhook(teamData) {
  const WEBHOOK_URL = process.env.MAKE_WEBHOOK_URL;

  if (!WEBHOOK_URL) {
    logger.warn("Webhook URL not configured.");
    return;
  }

  logger.info(`Firing webhook: ${WEBHOOK_URL}`);

  // Fire-and-forget: Don't await, just log result
  fetch(WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      teamId: teamData.teamId,
      name: teamData.name,
      email: teamData.email,
      to: teamData.email,
      members: teamData.members,
      password: teamData.password,
      pathAsString: teamData.path.join("->"),
    }),
  })
    .then((res) => logger.info(`Webhook response: ${res.status}`))
    .catch((err) => logger.error(`Webhook failed: ${err.message}`, err));
}
