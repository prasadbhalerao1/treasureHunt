import Team from "../models/Team.js";
import { ROLES } from "../config/constants.js";
import logger from "../utils/logger.js";
import { getSettings } from "./settingsService.js";

// One webhook request per recipient. The email's own subject and copy live in
// the Make.com scenario; this only tells it who to send to.
// Mail goes out one team at a time, chosen in the admin UI: there is no
// send-to-everyone call, so a stray click cannot reach the whole roster.
export async function sendToTeam(teamId) {
  const url = process.env.MAKE_BROADCAST_WEBHOOK_URL;
  if (!url) {
    throw new Error("MAKE_BROADCAST_WEBHOOK_URL is not configured");
  }

  const team = await Team.findOne({ teamId, role: ROLES.CANDIDATE })
    .select("teamId name email")
    .lean();
  if (!team) throw new Error("Team not found");
  if (!team.email) throw new Error("That team has no email address");

  const settings = await getSettings();
  const payload = {
    teamId: team.teamId,
    name: team.name,
    email: team.email,
    to: team.email,
    eventName: settings.eventName,
    tagline: settings.tagline,
  };

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(8000),
    });
    logger.info(`Broadcast to ${team.teamId} responded ${res.status}`);
    if (!res.ok) {
      return { sent: false, email: team.email, reason: `Webhook returned HTTP ${res.status}` };
    }
    return { sent: true, email: team.email };
  } catch (err) {
    logger.error(`Broadcast to ${team.teamId} failed: ${err.message}`, err);
    return { sent: false, email: team.email, reason: err.message };
  }
}
