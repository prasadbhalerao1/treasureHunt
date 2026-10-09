import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  parseMcqMarkdown,
  validateQuestions,
  pickQuestionsForTeam,
  difficultyForLevel,
  sanitizeChallenge,
} from "../utils/questionLogic.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MD = fs.readFileSync(
  path.join(__dirname, "../../computer_networks_placement_mcqs.md"),
  "utf8",
);

test("parses all 60 bundled MCQs with valid answers", () => {
  const qs = parseMcqMarkdown(MD);
  assert.equal(qs.length, 60);
  assert.ok(validateQuestions(qs, 60));
  assert.equal(qs[0].questionId, 1);
  assert.equal(qs[0].correctKey, "B");
  assert.equal(qs[59].correctKey, "C");
  assert.ok(qs.every((q) => q.options.length === 4));
  assert.ok(qs.every((q) => q.explanation.length > 0));
});

test("validateQuestions rejects a missing or out-of-range answer", () => {
  const bad = [
    {
      questionId: 1,
      prompt: "x",
      options: [
        { key: "A", text: "a" },
        { key: "B", text: "b" },
      ],
      correctKey: "D",
    },
  ];
  assert.throws(() => validateQuestions(bad), /not in options/);
  assert.throws(() => validateQuestions([], 60), /Expected 60/);
});

test("difficulty ramps up across 7 levels", () => {
  const d = [1, 2, 3, 4, 5, 6, 7].map((l) => difficultyForLevel(l, 7));
  assert.deepEqual(d, [
    "EASY",
    "EASY",
    "MEDIUM",
    "MEDIUM",
    "MEDIUM",
    "HARD",
    "HARD",
  ]);
});

test("each team gets 7 distinct questions and usage is balanced", () => {
  const pool = parseMcqMarkdown(MD).map((q) => ({
    questionId: q.questionId,
    difficulty: q.difficulty,
  }));
  const usage = {};
  const sets = [];
  for (let t = 0; t < 8; t++) {
    const ids = pickQuestionsForTeam(pool, usage, 7);
    assert.equal(new Set(ids).size, 7, "no repeats within a team");
    ids.forEach((id) => (usage[id] = (usage[id] || 0) + 1));
    sets.push(ids.join(","));
  }
  // The difficulty ramp draws 2 HARD questions per team from a small HARD pool,
  // so a little reuse is expected, but least-used-first keeps it tight.
  assert.ok(Math.max(...Object.values(usage)) <= 2);
  assert.equal(new Set(sets).size, 8);
});

test("pickQuestionsForTeam throws when the bank is too small", () => {
  const pool = [{ questionId: 1, difficulty: "EASY" }];
  assert.throws(() => pickQuestionsForTeam(pool, {}, 7), /too small/);
});

test("sanitized challenge never leaks the answer or explanation", () => {
  const [q] = parseMcqMarkdown(MD);
  const view = sanitizeChallenge(q, {
    level: 1,
    optionOrder: ["D", "C", "B", "A"],
    attempts: 0,
    lockedUntil: null,
  });
  const json = JSON.stringify(view);
  assert.ok(!("correctKey" in view));
  assert.ok(!("explanation" in view));
  assert.ok(!json.includes(q.explanation));
  assert.deepEqual(
    view.options.map((o) => o.key),
    ["D", "C", "B", "A"],
  );
});

test("sanitizeChallenge reports remaining cooldown", () => {
  const [q] = parseMcqMarkdown(MD);
  const now = new Date("2026-01-01T00:00:00Z");
  const view = sanitizeChallenge(
    q,
    {
      level: 1,
      optionOrder: ["A", "B", "C", "D"],
      attempts: 1,
      lockedUntil: new Date(now.getTime() + 12_300),
    },
    now,
  );
  assert.equal(view.retryAfterSeconds, 13);
});
