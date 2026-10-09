import Question from "../models/Question.js";
import Team from "../models/Team.js";
import { ROLES } from "../config/constants.js";
import { pickQuestionsForTeam, shuffle } from "../utils/questionLogic.js";

async function usageMap() {
  const rows = await Team.aggregate([
    { $match: { role: ROLES.CANDIDATE } },
    { $unwind: "$challenges" },
    { $group: { _id: "$challenges.questionId", n: { $sum: 1 } } },
  ]);
  const usage = {};
  rows.forEach((r) => (usage[r._id] = r.n));
  return usage;
}

const freshChallenge = (level, question) => ({
  level,
  questionId: question.questionId,
  optionOrder: shuffle(question.options.map((o) => o.key)),
  attempts: 0,
  solved: false,
  firstShownAt: null,
  solvedAt: null,
  lockedUntil: null,
});

// Build the challenges array for a team (one question per level)
export async function buildChallenges(totalLevels) {
  const pool = await Question.find({ active: true })
    .select("questionId difficulty options")
    .lean();
  const ids = pickQuestionsForTeam(pool, await usageMap(), totalLevels);
  const byId = new Map(pool.map((q) => [q.questionId, q]));
  return ids.map((id, i) => freshChallenge(i + 1, byId.get(id)));
}

// Pick a fresh replacement question for a level (not already used by this team)
export async function pickReplacement(team, level) {
  const pool = await Question.find({ active: true })
    .select("questionId difficulty options")
    .lean();
  const exclude = team.challenges.map((c) => c.questionId);
  const free = pool.filter((q) => !exclude.includes(q.questionId));
  if (!free.length) return null;
  const usage = await usageMap();
  const picked = shuffle(free).sort(
    (a, b) => (usage[a.questionId] || 0) - (usage[b.questionId] || 0),
  )[0];
  return freshChallenge(level, picked);
}

export async function nextQuestionId() {
  const last = await Question.findOne()
    .sort({ questionId: -1 })
    .select("questionId")
    .lean();
  return (last?.questionId || 0) + 1;
}
