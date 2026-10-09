import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import { MongoMemoryServer } from "mongodb-memory-server";
import request from "supertest";
import QRCode from "qrcode";
import { playTeam } from "./helpers/playTeam.js";
import { LOCATION_DATA, START_HINT } from "../data/locations.js";

const require = createRequire(import.meta.url);
const jsQR = require("jsqr");
const { PNG } = require("pngjs");

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const auth = (t) => ({ Authorization: `Bearer ${t}` });

const TEAMS = [
  ["Packet Pirates", "pirates@test.local", "pirate-pass-1"],
  ["Router Rangers", "rangers@test.local", "ranger-pass-2"],
  ["Null Pointers", "null@test.local", "nullptr-pass-3"],
  ["Ping Pong", "ping@test.local", "pingpong-4"],
  ["Hop Hackers", "hop@test.local", "hophack-pass-5"],
  ["Subnet Squad", "subnet@test.local", "subnet-pass-6"],
  ["Latency Lords", "latency@test.local", "latency-pass-7"],
  ["Bit Bandits", "bits@test.local", "bitband-pass-8"],
  ["Switch Sharks", "sharks@test.local", "sharks-pass-9"],
  ["Cache Crew", "cache@test.local", "cache-pass-10"],
];

let mongod;
let app;
let models;
let admin;
let hook; // fake Make.com receiver
const received = [];
const locations = new Map(); // id -> {name, hint, keyword, qrSecret}
const qrText = new Map(); // id -> text decoded from the generated QR image
const created = [];

before(async () => {
  mongod = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongod.getUri("traceroute_event");
  process.env.JWT_SECRET = "event-test-secret";
  process.env.NODE_ENV = "production";
  process.env.FRONTEND_URL = "https://traceroute.example.app";

  // Fake Make.com webhook
  hook = http.createServer((req, res) => {
    let body = "";
    req.on("data", (c) => (body += c));
    req.on("end", () => {
      received.push(JSON.parse(body));
      res.writeHead(200, { "Content-Type": "text/plain" });
      res.end("Accepted");
    });
  });
  await new Promise((r) => hook.listen(0, "127.0.0.1", r));
  process.env.MAKE_WEBHOOK_URL = `http://127.0.0.1:${hook.address().port}/hook`;

  const dbConnect = (await import("../config/dbConnect.js")).default;
  await dbConnect();
  models = {
    Team: (await import("../models/Team.js")).default,
    Location: (await import("../models/Location.js")).default,
    Question: (await import("../models/Question.js")).default,
  };
  const { parseMcqMarkdown } = await import("../utils/questionLogic.js");
  const { hashPassword } = await import("../utils/auth.js");

  // The REAL venue data (names, hints, hop codes), with random QR secrets
  const docs = [
    {
      locationId: 0,
      name: "Location-0 (Start)",
      hint: START_HINT,
      qrSecret: "START-AB12CD34",
      keyword: "START",
    },
    ...LOCATION_DATA.map((l, i) => ({
      locationId: i + 1,
      name: l.name,
      hint: l.hint,
      qrSecret: `${l.shortCode}_${100000 + i * 7919}`,
      keyword: l.keyword,
    })),
  ];
  await models.Location.insertMany(docs);
  docs.forEach((d) => locations.set(d.locationId, d));

  await models.Question.insertMany(
    parseMcqMarkdown(
      fs.readFileSync(
        path.join(__dirname, "../../computer_networks_placement_mcqs.md"),
        "utf8",
      ),
    ),
  );

  const hash = await hashPassword("admin-pass-123");
  await models.Team.create({
    teamId: "ADMIN-T",
    name: "Admin",
    email: "admin@test.local",
    role: "ADMIN",
    passwordHash: hash,
    salt: hash.split(":")[0],
    path: [],
  });

  ({ default: app } = await import("../index.js"));
  const login = await request(app)
    .post("/api/auth/login")
    .send({ teamId: "ADMIN-T", password: "admin-pass-123" });
  admin = login.body.token;

  // No cooldown so the simulated players do not wait
  await request(app)
    .put("/api/admin/settings")
    .set(auth(admin))
    .send({ wrongAnswerCooldownSeconds: 0 });
});

after(async () => {
  const mongoose = (await import("mongoose")).default;
  await mongoose.disconnect();
  await mongod.stop();
  await new Promise((r) => hook.close(r));
});

test("every location QR image decodes back to its own secret", async () => {
  assert.equal(locations.size, 10);
  for (const [id, loc] of locations) {
    const buf = await QRCode.toBuffer(loc.qrSecret, {
      width: 600,
      margin: 4,
      errorCorrectionLevel: "M",
    });
    const png = PNG.sync.read(buf);
    const res = jsQR(new Uint8ClampedArray(png.data), png.width, png.height);
    assert.ok(res, `QR for ${loc.name} is not decodable`);
    assert.equal(res.data, loc.qrSecret, `QR mismatch for ${loc.name}`);
    qrText.set(id, res.data);
  }
  assert.equal(new Set(qrText.values()).size, 10, "QR secrets must be unique");
});

test("every location has a usable hint, hop code and unique secret", () => {
  const codes = new Set();
  for (const [id, loc] of locations) {
    if (id === 0) continue;
    assert.ok(loc.hint.trim().length > 20, `${loc.name}: hint too short`);
    assert.ok(!loc.hint.includes(loc.qrSecret), `${loc.name}: hint leaks QR`);
    assert.match(loc.keyword, /^[A-Z]+$/);
    codes.add(loc.keyword);
  }
  assert.equal(codes.size, 9, "hop codes must be unique");
});

test("admin validation: bad team payloads are rejected", async () => {
  const post = (b) =>
    request(app).post("/api/admin/teams").set(auth(admin)).send(b);
  assert.equal((await post({ email: "a@b.co", password: "123456" })).status, 400);
  assert.equal((await post({ name: "X", email: "nope", password: "123456" })).status, 400);
  assert.equal((await post({ name: "X", email: "a@b.co", password: "123" })).status, 400);
  assert.equal(received.length, 0, "no email for rejected teams");
});

test("admin adds 10 teams and each one is emailed its credentials", async () => {
  for (const [name, email, password] of TEAMS) {
    const res = await request(app)
      .post("/api/admin/teams")
      .set(auth(admin))
      .send({ name, email, password });
    assert.equal(res.status, 201, JSON.stringify(res.body));
    assert.equal(res.body.emailSent, true);
    created.push({ teamId: res.body.team.teamId, name, email, password });
  }

  assert.equal(received.length, 10);
  assert.equal(new Set(created.map((c) => c.teamId)).size, 10);

  for (const c of created) {
    const mail = received.find((r) => r.teamId === c.teamId);
    assert.ok(mail, `no webhook for ${c.teamId}`);
    assert.equal(mail.to, c.email);
    assert.equal(mail.email, c.email);
    assert.equal(mail.name, c.name);
    assert.equal(mail.password, c.password);
    assert.equal(mail.eventName, "TraceRoute");
    assert.equal(mail.totalLevels, 5);
    assert.equal(mail.loginUrl, "https://traceroute.example.app");
    assert.equal(mail.subject, "Your TraceRoute login");
    assert.ok(!("members" in mail) && !("membersText" in mail));
    // the secret route and questions must never travel by email
    assert.ok(!("path" in mail) && !("pathAsString" in mail));
    assert.ok(!JSON.stringify(mail).includes("challenges"));
  }

  // Duplicates are refused and do not send a second email
  const dup = await request(app)
    .post("/api/admin/teams")
    .set(auth(admin))
    .send({ name: TEAMS[0][0], email: "other@test.local", password: "abcdef" });
  assert.equal(dup.status, 400);
  assert.equal(received.length, 10);
});

test("each new team got a unique route and its own 5 questions", async () => {
  const docs = await models.Team.find({ role: "CANDIDATE" }).lean();
  assert.equal(docs.length, 10);

  const paths = new Set(docs.map((d) => d.path.join(",")));
  assert.equal(paths.size, 10, "routes must all differ");
  const qsets = new Set(
    docs.map((d) => d.challenges.map((c) => c.questionId).join(",")),
  );
  assert.equal(qsets.size, 10, "question sets must all differ");

  const usage = {};
  for (const d of docs) {
    assert.equal(d.path.length, 6);
    assert.equal(d.path[0], 0);
    assert.equal(new Set(d.path).size, 6);
    assert.equal(d.challenges.length, 5);
    assert.equal(new Set(d.challenges.map((c) => c.questionId)).size, 5);
    d.path.slice(1).forEach((id) => (usage[id] = (usage[id] || 0) + 1));
  }
  // 50 visits over 9 locations: balanced to within one
  const counts = Object.values(usage);
  assert.equal(counts.length, 9, "every location is used");
  assert.ok(Math.max(...counts) - Math.min(...counts) <= 1, JSON.stringify(usage));
});

test("all 10 teams play the whole event at the same time", async () => {
  const reports = await Promise.all(
    created.map((c) =>
      playTeam({
        app,
        teamId: c.teamId,
        password: c.password,
        qrFor: (id) => qrText.get(id),
        locations,
        getRecord: () => models.Team.findOne({ teamId: c.teamId }).lean(),
        getQuestion: (id) => models.Question.findOne({ questionId: id }).lean(),
      }),
    ),
  );

  assert.equal(reports.length, 10);

  // Every QR and every hint was exercised by somebody
  const scanned = new Set(reports.flatMap((r) => r.qrsScanned));
  assert.deepEqual([...scanned].sort((a, b) => a - b), [...locations.keys()]);
  const hintsSeen = new Set(reports.flatMap((r) => r.hints));
  for (const id of [...locations.keys()].filter((i) => i !== 0)) {
    assert.ok(hintsSeen.has(id), `hint for location ${id} was never shown`);
  }

  // Each team scanned Start + exactly its 6 locations, in order
  for (const r of reports) {
    assert.deepEqual(r.qrsScanned, r.path);
    assert.ok(r.wrong >= 2, "wrong answers were exercised");
    assert.ok(r.penaltySeconds >= 60, `penalties applied: ${r.penaltySeconds}`);
  }

  // DB: all finished, nothing double counted
  const docs = await models.Team.find({ role: "CANDIDATE" }).lean();
  for (const d of docs) {
    assert.equal(d.currentLevelIndex, 7, `${d.teamId} finished`);
    assert.deepEqual(
      d.levelHistory.map((h) => h.level),
      [0, 1, 2, 3, 4, 5, 6],
      "start + 5 questions + the final challenge",
    );
    assert.ok(d.challenges.every((c) => c.solved && c.solvedAt));
  }
});

test("leaderboard, per-level view, and CSV cover all 10 teams", async () => {
  let res = await request(app).get("/api/admin/stats").set(auth(admin));
  assert.equal(res.status, 200);
  assert.equal(res.body.totalLevels, 5);
  const rows = res.body.leaderboard;
  assert.equal(rows.length, 10);
  assert.ok(rows.every((r) => r.finished));
  for (let i = 1; i < rows.length; i++) {
    assert.ok(rows[i - 1].timeTaken <= rows[i].timeTaken, "sorted fastest first");
  }
  assert.ok(rows.every((r) => r.timeTaken >= r.penaltySeconds * 1000));

  for (const level of [1, 3, 5]) {
    res = await request(app)
      .get(`/api/admin/stats?level=${level}`)
      .set(auth(admin));
    assert.equal(res.body.leaderboard.length, 10, `level ${level} view`);
  }

  res = await request(app).get("/api/admin/results.csv").set(auth(admin));
  const lines = res.text.trim().split("\n");
  assert.equal(lines.length, 11);
  assert.match(lines[0], /^rank,teamId,name,finished/);
  for (const c of created) {
    assert.ok(res.text.includes(c.teamId));
  }
});

test("Make.com being down does not break team creation", async () => {
  const live = process.env.MAKE_WEBHOOK_URL;
  process.env.MAKE_WEBHOOK_URL = "http://127.0.0.1:9/dead";
  const res = await request(app)
    .post("/api/admin/teams")
    .set(auth(admin))
    .send({ name: "Offline Crew", email: "offline@test.local", password: "offline-pass" });
  process.env.MAKE_WEBHOOK_URL = live;
  assert.equal(res.status, 201);
  assert.equal(res.body.emailSent, false);
  assert.match(res.body.msg, /NOT sent/);

  // and with no webhook configured at all
  delete process.env.MAKE_WEBHOOK_URL;
  const res2 = await request(app)
    .post("/api/admin/teams")
    .set(auth(admin))
    .send({ name: "Silent Crew", email: "silent@test.local", password: "silent-pass" });
  process.env.MAKE_WEBHOOK_URL = live;
  assert.equal(res2.status, 201);
  assert.equal(res2.body.emailSent, false);
});

test("a team created after the event started can log in and sees level 0", async () => {
  const login = await request(app)
    .post("/api/auth/login")
    .send({ teamId: created[0].teamId.toLowerCase(), password: created[0].password });
  assert.equal(login.status, 200, "team IDs are case-insensitive");
  const late = await request(app)
    .post("/api/auth/login")
    .send({ teamId: (await models.Team.findOne({ name: "Offline Crew" })).teamId, password: "offline-pass" });
  assert.equal(late.status, 200);
  const state = await request(app)
    .get("/api/game/state")
    .set(auth(late.body.token));
  assert.equal(state.body.status, "NOT_STARTED");
  assert.equal(state.body.totalLevels, 5);
});
