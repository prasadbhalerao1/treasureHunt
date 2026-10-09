/**
 * TraceRoute: API contracts (documentation only, nothing imports this file).
 * The source of truth is Backend/controllers and docs/openapi.yaml.
 */

export const ROLES = { ADMIN: "ADMIN", CANDIDATE: "CANDIDATE" };

export const GAME_STATUS = {
  NOT_STARTED: "NOT_STARTED",
  HINT_UNLOCKED: "HINT_UNLOCKED",
  CHALLENGE_OPEN: "CHALLENGE_OPEN",
  FINALE: "FINALE",
  COMPLETED: "COMPLETED",
};

export const EVENT_STATUS = { DRAFT: "DRAFT", LIVE: "LIVE", ENDED: "ENDED" };

export const FINALE_CHALLENGES = {
  ALPHA_ASC: "ALPHA_ASC",
  ALPHA_DESC: "ALPHA_DESC",
  LENGTH_ASC: "LENGTH_ASC",
  LENGTH_DESC: "LENGTH_DESC",
  SECOND_LETTER: "SECOND_LETTER",
  LAST_LETTER: "LAST_LETTER",
};

/**
 * @typedef {Object} Option
 * @property {string} key   Server-side option key ("A".."F"). Labels shown to
 *                          players are positional, because order is shuffled per team.
 * @property {string} text
 */

/**
 * Answer-free view of the open question. It never contains the correct key
 * or the explanation.
 * @typedef {Object} Challenge
 * @property {number} level
 * @property {string} prompt
 * @property {string} section
 * @property {Option[]} options
 * @property {number} attempts
 * @property {number} maxAttempts
 * @property {number} retryAfterSeconds  Cooldown left
 * @property {boolean} locked            Locked until an organiser unlocks it
 */

/**
 * Returned by GET /game/state and inside every /game/* response as `state`.
 * @typedef {Object} GameState
 * @property {string} teamId
 * @property {string} name
 * @property {keyof typeof GAME_STATUS} status
 * @property {number} level            -1 not started, k = hop k solved
 * @property {number} totalLevels
 * @property {string} hint             Where to go next (or the Mega Puzzle rule)
 * @property {Challenge} [challenge]   Only when CHALLENGE_OPEN
 * @property {string[]} [hopCodes]     Only when FINALE
 * @property {number} penaltySeconds
 * @property {string|null} startedAt
 * @property {string|null} finishedAt
 * @property {string} serverTime       Use it to correct the local clock
 * @property {string[]} collectedKeywords
 * @property {keyof typeof EVENT_STATUS} eventStatus
 */

/**
 * POST /game/scan      body { qrString }            -> { msg, state }
 * POST /game/answer    body { level, optionKey }    -> { correct, msg, explanation?, keyword?, state }
 *                      wrong: 400 { correct:false, attemptsLeft, penaltyAdded, swapped, locked, retryAfterSeconds, state }
 * POST /game/submit    body { answer: "A-B-C" }     -> { correct, msg, state }
 * GET  /settings/public                             -> { eventName, tagline, totalLevels, eventStatus, showLeaderboardToTeams }
 */
export {};
