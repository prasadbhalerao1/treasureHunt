export const ROLES = {
  ADMIN: "ADMIN",
  CANDIDATE: "CANDIDATE",
};

export const GAME_STATUS = {
  NOT_STARTED: "NOT_STARTED", // Registered, Start QR not scanned yet
  HINT_UNLOCKED: "HINT_UNLOCKED", // Next location revealed, waiting for QR scan
  CHALLENGE_OPEN: "CHALLENGE_OPEN", // QR scanned, MCQ must be solved
  FINALE: "FINALE", // All levels solved, Mega Puzzle open
  COMPLETED: "COMPLETED", // Mega Puzzle solved
};

export const EVENT_STATUS = {
  DRAFT: "DRAFT",
  LIVE: "LIVE",
  ENDED: "ENDED",
};

export const OUT_OF_ATTEMPTS = {
  SWAP_QUESTION: "SWAP_QUESTION",
  LOCK_UNTIL_ADMIN: "LOCK_UNTIL_ADMIN",
};

export const DIFFICULTY = {
  EASY: "EASY",
  MEDIUM: "MEDIUM",
  HARD: "HARD",
};

export const ERRORS = {
  TEAM_NOT_FOUND: "Team not found",
  SERVER_ERROR: "Server Error",
};

export const DEFAULT_SETTINGS = {
  eventName: "TraceRoute",
  tagline: "Follow the hops. Reach the destination.",
  totalLevels: 6,
  maxAttemptsPerQuestion: 3,
  wrongAnswerCooldownSeconds: 20,
  wrongAnswerTimePenaltySeconds: 30,
  outOfAttemptsAction: OUT_OF_ATTEMPTS.SWAP_QUESTION,
  eventStatus: EVENT_STATUS.LIVE,
  showLeaderboardToTeams: false,
};

