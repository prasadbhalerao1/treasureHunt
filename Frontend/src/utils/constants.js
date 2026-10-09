export const ROLES = {
  ADMIN: "ADMIN",
  CANDIDATE: "CANDIDATE",
};

export const GAME_STATUS = {
  NOT_STARTED: "NOT_STARTED",
  HINT_UNLOCKED: "HINT_UNLOCKED",
  CHALLENGE_OPEN: "CHALLENGE_OPEN",
  FINALE: "FINALE",
  COMPLETED: "COMPLETED",
};

export const DEFAULT_SETTINGS = {
  eventName: "TraceRoute",
  tagline: "Follow the hops. Reach the destination.",
  totalLevels: 7,
  eventStatus: "LIVE",
  showLeaderboardToTeams: false,
};

// ms -> "1h 02m 05s" / "4m 07s"
export function formatDuration(ms) {
  if (ms === null || ms === undefined || Number.isNaN(ms) || ms < 0) return "-";
  const total = Math.floor(ms / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n) => String(n).padStart(2, "0");
  return h > 0 ? `${h}h ${pad(m)}m ${pad(s)}s` : `${m}m ${pad(s)}s`;
}

// "A", "B", "C"... by position
export const optionLabel = (index) => String.fromCharCode(65 + index);
