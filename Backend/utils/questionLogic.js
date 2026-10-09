// Pure helpers for the question bank (no DB access, unit-testable)

export function shuffle(array) {
  const a = [...array];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Difficulty target for a level: first ~30% easy, middle ~40% medium, rest hard
export function difficultyForLevel(level, totalLevels) {
  const f = level / totalLevels;
  if (f <= 0.3) return "EASY";
  if (f <= 0.72) return "MEDIUM";
  return "HARD";
}

const SECTION_DIFFICULTY = {
  1: "EASY",
  2: "EASY",
  3: "MEDIUM",
  4: "EASY",
  5: "MEDIUM",
  6: "HARD",
  7: "HARD",
};

// Parse the markdown MCQ file (sections, "### N. prompt", "A. option" lines
// and a "| Q | Answer | Explanation |" table at the end).
export function parseMcqMarkdown(md) {
  const lines = md.split(/\r?\n/);
  const questions = new Map();
  let section = "General";
  let sectionNo = 0;
  let current = null;

  for (const raw of lines) {
    const line = raw.trimEnd();

    const sec = line.match(/^##\s+Section\s+(\d+):\s*(.+)$/);
    if (sec) {
      sectionNo = Number(sec[1]);
      section = sec[2].trim();
      current = null;
      continue;
    }

    const q = line.match(/^###\s+(\d+)\.\s+(.+)$/);
    if (q) {
      current = {
        questionId: Number(q[1]),
        prompt: q[2].trim(),
        options: [],
        section,
        difficulty: SECTION_DIFFICULTY[sectionNo] || "MEDIUM",
      };
      questions.set(current.questionId, current);
      continue;
    }

    const opt = line.match(/^([A-F])\.\s+(.+)$/);
    if (opt && current) {
      current.options.push({ key: opt[1], text: opt[2].trim() });
      continue;
    }

    const ans = line.match(/^\|\s*(\d+)\s*\|\s*([A-F])\s*\|\s*(.*?)\s*\|\s*$/);
    if (ans) {
      const target = questions.get(Number(ans[1]));
      if (target) {
        target.correctKey = ans[2];
        target.explanation = ans[3].trim();
      }
    }
  }

  return [...questions.values()].sort((a, b) => a.questionId - b.questionId);
}

// Throws if the parsed bank is malformed
export function validateQuestions(list, expectedCount) {
  if (expectedCount && list.length !== expectedCount) {
    throw new Error(
      `Expected ${expectedCount} questions, parsed ${list.length}`,
    );
  }
  for (const q of list) {
    if (!q.prompt) throw new Error(`Q${q.questionId}: empty prompt`);
    if (q.options.length < 2) throw new Error(`Q${q.questionId}: <2 options`);
    if (!q.correctKey) throw new Error(`Q${q.questionId}: missing answer`);
    if (!q.options.some((o) => o.key === q.correctKey)) {
      throw new Error(
        `Q${q.questionId}: answer ${q.correctKey} not in options`,
      );
    }
  }
  return true;
}

// Choose one question per level for a team.
// pool: [{questionId, difficulty}], usage: {questionId: timesAssigned}
// Rules: no repeats, difficulty ramps up, least-used first (random tie-break)
export function pickQuestionsForTeam(pool, usage, totalLevels, exclude = []) {
  if (pool.length < totalLevels) {
    throw new Error(
      `Question bank too small: ${pool.length} active questions, ${totalLevels} needed`,
    );
  }
  const used = new Set(exclude);
  const picks = [];
  for (let level = 1; level <= totalLevels; level++) {
    const want = difficultyForLevel(level, totalLevels);
    const free = pool.filter((q) => !used.has(q.questionId));
    const preferred = free.filter((q) => q.difficulty === want);
    const candidates = preferred.length ? preferred : free;
    const sorted = shuffle(candidates).sort(
      (a, b) => (usage[a.questionId] || 0) - (usage[b.questionId] || 0),
    );
    const chosen = sorted[0];
    used.add(chosen.questionId);
    picks.push(chosen.questionId);
  }
  return picks;
}

// Public view of a question for a team: no answer, no explanation
export function sanitizeChallenge(question, challenge, now = new Date()) {
  const byKey = new Map(question.options.map((o) => [o.key, o]));
  const order = challenge.optionOrder?.length
    ? challenge.optionOrder
    : question.options.map((o) => o.key);
  const lockedMs = challenge.lockedUntil
    ? new Date(challenge.lockedUntil).getTime() - now.getTime()
    : 0;
  return {
    level: challenge.level,
    prompt: question.prompt,
    section: question.section,
    options: order
      .filter((k) => byKey.has(k))
      .map((k) => ({ key: k, text: byKey.get(k).text })),
    attempts: challenge.attempts,
    retryAfterSeconds: lockedMs > 0 ? Math.ceil(lockedMs / 1000) : 0,
  };
}
