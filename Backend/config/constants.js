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
  totalLevels: 7,
  maxAttemptsPerQuestion: 3,
  wrongAnswerCooldownSeconds: 20,
  wrongAnswerTimePenaltySeconds: 30,
  outOfAttemptsAction: OUT_OF_ATTEMPTS.SWAP_QUESTION,
  eventStatus: EVENT_STATUS.LIVE,
  showLeaderboardToTeams: false,
};

// Mega Puzzle: sort the collected hop codes by the team's assigned rule
export const FINALE_CHALLENGES = {
  ALPHA_ASC: "ALPHA_ASC", // A-Z
  ALPHA_DESC: "ALPHA_DESC", // Z-A
  LENGTH_ASC: "LENGTH_ASC", // Shortest First
  LENGTH_DESC: "LENGTH_DESC", // Longest First
  SECOND_LETTER: "SECOND_LETTER", // 2nd Letter A-Z
  LAST_LETTER: "LAST_LETTER", // Last Letter A-Z
};

export const FINALE_DESCRIPTIONS = {
  ALPHA_ASC: "REASSEMBLE THE PACKET: ORDER THE HOP CODES ALPHABETICALLY (A → Z)",
  ALPHA_DESC:
    "REASSEMBLE THE PACKET: ORDER THE HOP CODES IN REVERSE ALPHABETICAL ORDER (Z → A)",
  LENGTH_ASC: "REASSEMBLE THE PACKET: ORDER BY LENGTH (SHORTEST → LONGEST)",
  LENGTH_DESC: "REASSEMBLE THE PACKET: ORDER BY LENGTH (LONGEST → SHORTEST)",
  SECOND_LETTER:
    "REASSEMBLE THE PACKET: ORDER ALPHABETICALLY BY THE SECOND LETTER",
  LAST_LETTER: "REASSEMBLE THE PACKET: ORDER ALPHABETICALLY BY THE LAST LETTER",
};

export const MEGA_MAX_ATTEMPTS_BEFORE_COOLDOWN = 3;
export const MEGA_COOLDOWN_SECONDS = 30;
