import Team from "../models/Team.js";
import { ROLES } from "../config/constants.js";
import logger from "../utils/logger.js";
import { getSettings } from "./settingsService.js";

// Sends one webhook request per recipient so the Make.com scenario stays a
// simple single-email template, the same shape as the credentials webhook.
// Requests go out in small batches: a serverless function would otherwise
// risk its time limit on a large roster.
const BATCH_SIZE = 4;

// A real send must be asked for explicitly. Anything else goes to the test
// address only, so a mistaken click can never reach the teams.
export const TEST_ADDRESS = "prasad9a38@gmail.com";

async function sendOne(url, payload) {
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(8000),
    });
    return res.ok
      ? { email: payload.email, teamId: payload.teamId, sent: true }
      : {
          email: payload.email,
          teamId: payload.teamId,
          sent: false,
          reason: `HTTP ${res.status}`,
        };
  } catch (err) {
    return {
      email: payload.email,
      teamId: payload.teamId,
      sent: false,
      reason: err.message,
    };
  }
}

/**
 * Broadcasts a message.
 *
 * mode "TEST" (the default) sends exactly one email to TEST_ADDRESS.
 * mode "ALL" sends to every candidate team and requires confirm === "SEND TO ALL
 * TEAMS", so no single click or stray request can mail the roster.
 */
export async function broadcastToTeams({ subject, body, mode = "TEST", confirm }) {
  const url = process.env.MAKE_BROADCAST_WEBHOOK_URL;
  if (!url) {
    throw new Error("MAKE_BROADCAST_WEBHOOK_URL is not configured");
  }

  const settings = await getSettings();
  const base = {
    subject,
    body,
    eventName: settings.eventName,
    tagline: settings.tagline,
  };

  let recipients;
  if (mode === "ALL") {
    if (confirm !== "SEND TO ALL TEAMS") {
      throw new Error(
        'Refusing to mail every team: confirm must be exactly "SEND TO ALL TEAMS"',
      );
    }
    const teams = await Team.find({ role: ROLES.CANDIDATE })
      .select("teamId name email")
      .lean();
    recipients = teams
      .filter((t) => t.email)
      .map((t) => ({ ...base, teamId: t.teamId, name: t.name, email: t.email, to: t.email }));
  } else {
    recipients = [
      {
        ...base,
        teamId: "TEST",
        name: "Test Run",
        email: TEST_ADDRESS,
        to: TEST_ADDRESS,
        subject: `[TEST] ${subject}`,
      },
    ];
  }

  if (!recipients.length) {
    return { mode, total: 0, sent: 0, failed: 0, results: [] };
  }

  const results = [];
  for (let i = 0; i < recipients.length; i += BATCH_SIZE) {
    const batch = recipients.slice(i, i + BATCH_SIZE);
    results.push(...(await Promise.all(batch.map((p) => sendOne(url, p)))));
  }

  const sent = results.filter((r) => r.sent).length;
  logger.info(`Broadcast (${mode}) "${subject}": ${sent}/${results.length} sent`);
  return { mode, total: results.length, sent, failed: results.length - sent, results };
}
