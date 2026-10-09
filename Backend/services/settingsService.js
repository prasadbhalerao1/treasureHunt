import Settings from "../models/Settings.js";
import { DEFAULT_SETTINGS } from "../config/constants.js";

// Returns the (lean) settings document, creating defaults on first use
export async function getSettings() {
  let doc = await Settings.findOne({ key: "main" }).lean();
  if (!doc) {
    try {
      doc = (await Settings.create({ key: "main" })).toObject();
    } catch {
      doc = await Settings.findOne({ key: "main" }).lean();
    }
  }
  return { ...DEFAULT_SETTINGS, ...doc };
}

export const PUBLIC_FIELDS = [
  "eventName",
  "tagline",
  "totalLevels",
  "eventStatus",
  "showLeaderboardToTeams",
];

export function publicSettings(s) {
  const out = {};
  PUBLIC_FIELDS.forEach((k) => (out[k] = s[k]));
  return out;
}

const NUMERIC_BOUNDS = {
  totalLevels: [1, 12],
  maxAttemptsPerQuestion: [1, 20],
  wrongAnswerCooldownSeconds: [0, 3600],
  wrongAnswerTimePenaltySeconds: [0, 3600],
};

// Validates and filters an admin payload into a $set object
export function cleanSettingsUpdate(body) {
  const update = {};
  for (const [k, [min, max]] of Object.entries(NUMERIC_BOUNDS)) {
    if (body[k] === undefined) continue;
    const n = Number(body[k]);
    if (!Number.isInteger(n) || n < min || n > max) {
      throw new Error(`${k} must be an integer between ${min} and ${max}`);
    }
    update[k] = n;
  }
  for (const k of ["eventName", "tagline"]) {
    if (body[k] !== undefined) {
      const v = String(body[k]).trim().slice(0, 120);
      if (k === "eventName" && !v) throw new Error("eventName cannot be empty");
      update[k] = v;
    }
  }
  if (body.eventStatus !== undefined) {
    if (!["DRAFT", "LIVE", "ENDED"].includes(body.eventStatus)) {
      throw new Error("Invalid eventStatus");
    }
    update.eventStatus = body.eventStatus;
  }
  if (body.outOfAttemptsAction !== undefined) {
    if (
      !["SWAP_QUESTION", "LOCK_UNTIL_ADMIN"].includes(body.outOfAttemptsAction)
    ) {
      throw new Error("Invalid outOfAttemptsAction");
    }
    update.outOfAttemptsAction = body.outOfAttemptsAction;
  }
  if (body.showLeaderboardToTeams !== undefined) {
    update.showLeaderboardToTeams = Boolean(body.showLeaderboardToTeams);
  }
  return update;
}
