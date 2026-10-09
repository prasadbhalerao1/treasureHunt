import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { MongoMemoryServer } from "mongodb-memory-server";
import request from "supertest";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let mongod;
let app;
let models;
let admin;
let teams = {};

const KEYWORDS = [
  "ROUTER",
  "GATEWAY",
  "SWITCH",
  "FIREWALL",
  "PROXY",
  "DNS",
  "DHCP",
  "NAT",
  "BRIDGE",
  "MODEM",
  "REPEATER",
  "HUB",
];

const auth = (t) => ({ Authorization: `Bearer ${t}` });

async function login(teamId, password) {
  const res = await request(app)
    .post("/api/auth/login")
    .send({ teamId, password });
  assert.equal(res.status, 200, JSON.stringify(res.body));
  return res.body.token;
}

before(async () => {
  mongod = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongod.getUri("traceroute_test");
  process.env.JWT_SECRET = "test-secret";
  process.env.NODE_ENV = "production"; // do not auto-listen

  const dbConnect = (await import("../config/dbConnect.js")).default;
  await dbConnect();

  models = {
    Team: (await import("../models/Team.js")).default,
    Location: (await import("../models/Location.js")).default,
    Question: (await import("../models/Question.js")).default,
  };
  const { parseMcqMarkdown } = await import("../utils/questionLogic.js");
  const { createTeamRecord } = await import("../services/teamService.js");
  const { hashPassword } = await import("../utils/auth.js");

  // Locations: Start + 12
  const locs = [
    {
      locationId: 0,
      name: "Start",
      hint: "start",
      qrSecret: "START-TEST0001",
      keyword: "START",
    },
  ];
  KEYWORDS.forEach((k, i) =>
    locs.push({
      locationId: i + 1,
      name: `Place ${i + 1}`,
      hint: `HINT-FOR-LOC-${i + 1}`,
      qrSecret: `LOC${i + 1}_${100000 + i}`,
      keyword: k,
    }),
  );
  await models.Location.insertMany(locs);

  const md = fs.readFileSync(
    path.join(__dirname, "../../computer_networks_placement_mcqs.md"),
    "utf8",
  );
  await models.Question.insertMany(parseMcqMarkdown(md));

  const hash = await hashPassword("adminpass");
  await models.Team.create({
    teamId: "ADMIN-T",
    name: "Admin",
    email: "admin@test.local",
    role: "ADMIN",
    passwordHash: hash,
    salt: hash.split(":")[0],
    path: [],
  });

  for (const n of ["Alpha", "Bravo"]) {
    const { team } = await createTeamRecord({
      name: n,
      email: `${n}@test.local`,
      password: "teampass",
    });
    teams[n] = team;
  }

  ({ default: app } = await import("../index.js"));
  admin = await login("ADMIN-T", "adminpass");
});

after(async () => {
  const mongoose = (await import("mongoose")).default;
  await mongoose.disconnect();
  await mongod.stop();
});

test("public settings expose only branding", async () => {
  const res = await request(app).get("/api/settings/public");
  assert.equal(res.status, 200);
  assert.equal(res.body.eventName, "TraceRoute");
  assert.equal(res.body.totalLevels, 6);
  assert.ok(!("maxAttemptsPerQuestion" in res.body));
});

test("teams get 6 locations, 6 distinct questions, different sets", async () => {
  const a = await models.Team.findById(teams.Alpha._id).lean();
  const b = await models.Team.findById(teams.Bravo._id).lean();
  assert.equal(a.path.length, 7);
  assert.equal(a.path[0], 0);
  assert.equal(a.challenges.length, 6);
  assert.equal(new Set(a.challenges.map((c) => c.questionId)).size, 6);
  assert.notDeepEqual(
    a.challenges.map((c) => c.questionId),
    b.challenges.map((c) => c.questionId),
  );
  assert.notEqual(a.path.join(), b.path.join());
});

test("event gating: DRAFT blocks players, admin can reopen", async () => {
  const token = await login(teams.Alpha.teamId, "teampass");
  let res = await request(app)
    .put("/api/admin/settings")
    .set(auth(admin))
    .send({ eventStatus: "DRAFT" });
  assert.equal(res.status, 200);
  res = await request(app)
    .post("/api/game/scan")
    .set(auth(token))
    .send({ qrString: "START-TEST0001" });
  assert.equal(res.status, 403);
  res = await request(app)
    .put("/api/admin/settings")
    .set(auth(admin))
    .send({ eventStatus: "LIVE", wrongAnswerCooldownSeconds: 0 });
  assert.equal(res.status, 200);
});

test("settings validation rejects nonsense", async () => {
  const res = await request(app)
    .put("/api/admin/settings")
    .set(auth(admin))
    .send({ totalLevels: 99 });
  assert.equal(res.status, 400);
});

test("candidates cannot reach admin routes", async () => {
  const token = await login(teams.Alpha.teamId, "teampass");
  const res = await request(app).get("/api/admin/questions").set(auth(token));
  assert.equal(res.status, 403);
});

test("full game: scan opens a question, the answer reveals the next riddle", async () => {
  const token = await login(teams.Alpha.teamId, "teampass");
  const team = await models.Team.findById(teams.Alpha._id).lean();
  const N = team.path.length - 1;

  let res = await request(app).get("/api/game/state").set(auth(token));
  assert.equal(res.body.status, "NOT_STARTED");

  // Wrong QR, and a later location's QR, are both refused
  res = await request(app)
    .post("/api/game/scan")
    .set(auth(token))
    .send({ qrString: "NOPE" });
  assert.equal(res.status, 400);
  const later = await models.Location.findOne({ locationId: team.path[2] });
  res = await request(app)
    .post("/api/game/scan")
    .set(auth(token))
    .send({ qrString: later.qrSecret });
  assert.equal(res.status, 400);

  for (let level = 1; level <= N; level++) {
    const scanLoc = await models.Location.findOne({
      locationId: team.path[level - 1],
    });
    const ch = team.challenges.find((c) => c.level === level);
    const q = await models.Question.findOne({ questionId: ch.questionId });

    // Scanning opens THIS level's question (the Start QR included)
    res = await request(app)
      .post("/api/game/scan")
      .set(auth(token))
      .send({ qrString: scanLoc.qrSecret.toLowerCase() });
    assert.equal(res.status, 200, JSON.stringify(res.body));
    assert.equal(res.body.state.status, "CHALLENGE_OPEN", `level ${level}`);
    assert.equal(res.body.state.challenge.prompt, q.prompt);
    assert.ok(!JSON.stringify(res.body).includes(q.explanation));
    assert.ok(!("correctKey" in res.body.state.challenge));

    if (level === 1) {
      const wrongKey = q.options.find((o) => o.key !== q.correctKey).key;
      res = await request(app)
        .post("/api/game/answer")
        .set(auth(token))
        .send({ level, optionKey: wrongKey });
      assert.equal(res.status, 400);
      assert.equal(res.body.correct, false);
      assert.equal(res.body.attemptsLeft, 2);
      assert.equal(res.body.state.penaltySeconds, 30);
      assert.equal(res.body.state.status, "CHALLENGE_OPEN");
    }

    // Double submit advances exactly once
    const [r1, r2] = await Promise.all([
      request(app)
        .post("/api/game/answer")
        .set(auth(token))
        .send({ level, optionKey: q.correctKey }),
      request(app)
        .post("/api/game/answer")
        .set(auth(token))
        .send({ level, optionKey: q.correctKey }),
    ]);
    assert.deepEqual([r1.status, r2.status].sort(), [200, 409]);
    const ok = r1.status === 200 ? r1 : r2;
    assert.equal(ok.body.correct, true);
    assert.equal(ok.body.explanation, q.explanation);

    // ... and reveals the riddle for the next location
    const nextLoc = await models.Location.findOne({
      locationId: team.path[level],
    });
    assert.equal(ok.body.state.status, "HINT_UNLOCKED");
    assert.equal(ok.body.state.hint, nextLoc.hint);
    assert.equal(ok.body.state.level, level);
  }

  // Scanning the last location unlocks the final challenge
  const lastLoc = await models.Location.findOne({ locationId: team.path[N] });
  res = await request(app)
    .post("/api/game/scan")
    .set(auth(token))
    .send({ qrString: lastLoc.qrSecret });
  assert.equal(res.status, 200);
  assert.equal(res.body.state.status, "FINALE");

  // Final challenge is a single button
  res = await request(app).post("/api/game/submit").set(auth(token)).send({});
  assert.equal(res.status, 200, JSON.stringify(res.body));
  assert.equal(res.body.state.status, "COMPLETED");

  res = await request(app).get("/api/admin/stats").set(auth(admin));
  assert.equal(res.body.totalLevels, 6);
  const row = res.body.leaderboard.find((r) => r.teamId === teams.Alpha.teamId);
  assert.equal(row.finished, true);
  assert.ok(row.penaltySeconds >= 30);

  const csv = await request(app).get("/api/admin/results.csv").set(auth(admin));
  assert.equal(csv.status, 200);
  assert.ok(csv.text.split("\n")[1].includes(teams.Alpha.teamId));
});

test("cooldown, out-of-attempts swap, and admin unlock", async () => {
  const token = await login(teams.Bravo.teamId, "teampass");
  await request(app)
    .put("/api/admin/settings")
    .set(auth(admin))
    .send({ wrongAnswerCooldownSeconds: 5, maxAttemptsPerQuestion: 2 });

  const team = await models.Team.findById(teams.Bravo._id).lean();
  await request(app)
    .post("/api/game/scan")
    .set(auth(token))
    .send({ qrString: "START-TEST0001" });

  const ch = team.challenges[0];
  const q = await models.Question.findOne({ questionId: ch.questionId });
  const wrong = q.options.find((o) => o.key !== q.correctKey).key;

  let res = await request(app)
    .post("/api/game/answer")
    .set(auth(token))
    .send({ level: 1, optionKey: wrong });
  assert.equal(res.status, 400);

  // Immediate retry is blocked by the cooldown
  res = await request(app)
    .post("/api/game/answer")
    .set(auth(token))
    .send({ level: 1, optionKey: q.correctKey });
  assert.equal(res.status, 429);
  assert.ok(res.body.retryAfterSeconds > 0);

  // Admin unlock clears the cooldown and the attempt count
  res = await request(app)
    .post(`/api/admin/teams/${teams.Bravo._id}/unlock`)
    .set(auth(admin));
  assert.equal(res.status, 200);

  await request(app)
    .put("/api/admin/settings")
    .set(auth(admin))
    .send({ wrongAnswerCooldownSeconds: 0 });
  const before = (await models.Team.findById(teams.Bravo._id)).penaltySeconds;

  res = await request(app)
    .post("/api/game/answer")
    .set(auth(token))
    .send({ level: 1, optionKey: wrong });
  assert.equal(res.status, 400);
  assert.equal(res.body.swapped, false);
  assert.equal(res.body.attemptsLeft, 1);

  // Second miss exhausts the 2 attempts -> new question + extra penalty
  res = await request(app)
    .post("/api/game/answer")
    .set(auth(token))
    .send({ level: 1, optionKey: wrong });
  assert.equal(res.status, 400);
  assert.equal(res.body.swapped, true);
  assert.equal(res.body.penaltyAdded, 60);
  assert.notEqual(res.body.state.challenge.prompt, q.prompt);
  assert.equal(res.body.state.challenge.attempts, 0);

  const after = await models.Team.findById(teams.Bravo._id).lean();
  assert.equal(after.penaltySeconds, before + 90);
  assert.equal(new Set(after.challenges.map((c) => c.questionId)).size, 6);
});

test("admin question CRUD and import validation", async () => {
  let res = await request(app)
    .post("/api/admin/questions")
    .set(auth(admin))
    .send({
      prompt: "What does TTL stand for?",
      options: [
        { text: "Time To Live" },
        { text: "Total Transfer Length" },
        { text: "Transmit Token List" },
      ],
      correctKey: "A",
      explanation: "Time To Live.",
      difficulty: "EASY",
    });
  assert.equal(res.status, 201, JSON.stringify(res.body));
  const id = res.body.question.questionId;
  assert.equal(id, 61);

  res = await request(app)
    .post("/api/admin/questions")
    .set(auth(admin))
    .send({ prompt: "bad", options: [{ text: "x" }, { text: "y" }], correctKey: "Z" });
  assert.equal(res.status, 400);

  res = await request(app)
    .put(`/api/admin/questions/${id}`)
    .set(auth(admin))
    .send({ active: false });
  assert.equal(res.status, 200);
  assert.equal(res.body.question.active, false);

  res = await request(app).get("/api/admin/questions").set(auth(admin));
  assert.equal(res.body.questions.length, 61);
  assert.equal(res.body.active, 60);

  res = await request(app)
    .delete(`/api/admin/questions/${id}`)
    .set(auth(admin));
  assert.equal(res.status, 200);

  res = await request(app)
    .post("/api/admin/questions/import")
    .set(auth(admin))
    .send([{ prompt: "no options", options: [], correctKey: "A" }]);
  assert.equal(res.status, 400);
});

test("admin reset puts a finished team back at the start", async () => {
  const res = await request(app)
    .post(`/api/admin/teams/${teams.Alpha._id}/reset`)
    .set(auth(admin));
  assert.equal(res.status, 200);
  const t = await models.Team.findById(teams.Alpha._id).lean();
  assert.equal(t.currentLevelIndex, -1);
  assert.equal(t.penaltySeconds, 0);
  assert.equal(t.challenges.length, 6);
});

test("login rejects regex injection and bad creds", async () => {
  let res = await request(app)
    .post("/api/auth/login")
    .send({ teamId: ".*", password: "teampass" });
  assert.equal(res.status, 401);
  res = await request(app)
    .post("/api/auth/login")
    .send({ teamId: teams.Alpha.teamId, password: "wrong" });
  assert.equal(res.status, 401);
});
