import Team from "../models/Team.js";
import { hashPassword } from "../utils/auth.js";
import { randomBytes } from "node:crypto";

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

// Generate randomized game path: Start (0) + 6 random from 1-16
export function generatePath() {
  const locationIds = Array.from({ length: 16 }, (_, i) => i + 1);
  const shuffledLocs = shuffle([...locationIds]);
  return [0, ...shuffledLocs.slice(0, 6)];
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
  const path = generatePath();

  const newTeam = await Team.create({
    teamId,
    name,
    email,
    passwordHash: hashedPassword,
    salt,
    members: members || [],
    role: "CANDIDATE",
    path,
    currentLevelIndex: 0,
    collectedKeywords: [],
    activeSessions: [],
  });

  return { team: newTeam, path, password };
}

// Trigger Make.com Webhook (Fire-and-Forget)
export function triggerWebhook(teamData) {
  const WEBHOOK_URL = process.env.MAKE_WEBHOOK_URL;

  if (!WEBHOOK_URL) {
    console.warn("Webhook URL not configured.");
    return;
  }

  console.log("Firing webhook:", WEBHOOK_URL);

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
    .then((res) => console.log("Webhook response:", res.status))
    .catch((err) => console.error("Webhook failed:", err.message));
}
