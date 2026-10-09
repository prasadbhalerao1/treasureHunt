import assert from "node:assert/strict";
import request from "supertest";
import { getSortKey, isValidOrder } from "../../utils/finale.js";

const ASC = ["ALPHA_ASC", "LENGTH_ASC", "SECOND_LETTER", "LAST_LETTER"];

const auth = (t) => ({ Authorization: `Bearer ${t}` });

// One valid ordering of the hop codes for a rule
export function solveFinale(hops, rule) {
  const cmp = (a, b) => {
    const ka = getSortKey(a, rule);
    const kb = getSortKey(b, rule);
    return typeof ka === "number" ? ka - kb : ka.localeCompare(kb);
  };
  const sorted = [...hops].sort(cmp);
  if (!ASC.includes(rule)) sorted.reverse();
  assert.ok(isValidOrder(sorted, hops, rule), `solver failed for ${rule}`);
  return sorted;
}

/**
 * Plays one team through the entire event over HTTP and asserts every step.
 *
 * qrFor(locationId)  -> the text a phone would read from that location's QR
 * locations          -> Map(locationId -> { hint, name, keyword })
 * getRecord()        -> fresh lean Team doc (path, challenges, finaleChallenge)
 * getQuestion(id)    -> Question doc (correctKey, options, prompt, explanation)
 */
export async function playTeam({
  app,
  teamId,
  password,
  qrFor,
  locations,
  getRecord,
  getQuestion,
  wrongOnOddLevels = true,
}) {
  const login = await request(app)
    .post("/api/auth/login")
    .send({ teamId, password });
  assert.equal(login.status, 200, `${teamId} login: ${JSON.stringify(login.body)}`);
  const token = login.body.token;
  const get = (path) => request(app).get(path).set(auth(token));
  const post = (path, body) =>
    request(app).post(path).set(auth(token)).send(body);

  const team = await getRecord();
  const N = team.path.length - 1;
  const report = { teamId, path: team.path, hints: [], qrsScanned: [], wrong: 0 };

  // ---- Not started
  let res = await get("/api/game/state");
  assert.equal(res.body.status, "NOT_STARTED", `${teamId} initial status`);
  assert.equal(res.body.totalLevels, N);

  // A QR from some other location must not start the game
  res = await post("/api/game/scan", { qrString: qrFor(team.path[1]) });
  assert.equal(res.status, 400, `${teamId} wrong QR for start`);

  // ---- Start
  res = await post("/api/game/scan", { qrString: qrFor(0) });
  assert.equal(res.status, 200, JSON.stringify(res.body));
  report.qrsScanned.push(0);
  assert.equal(res.body.state.status, "HINT_UNLOCKED");
  assert.equal(res.body.state.level, 0);
  assert.equal(res.body.state.hint, locations.get(team.path[1]).hint);
  report.hints.push(team.path[1]);

  // ---- Hops 1..N
  for (let level = 1; level <= N; level++) {
    const locId = team.path[level];
    const ch = team.challenges.find((c) => c.level === level);
    const q = await getQuestion(ch.questionId);

    // The hint on screen is the one for THIS location
    res = await get("/api/game/state");
    assert.equal(res.body.status, "HINT_UNLOCKED");
    assert.equal(res.body.hint, locations.get(locId).hint, `${teamId} hint L${level}`);
    assert.ok(!res.body.challenge, "challenge must not show before the scan");

    // Answering before scanning is refused
    res = await post("/api/game/answer", { level, optionKey: "A" });
    assert.equal(res.status, 400, `${teamId} answer before scan L${level}`);

    // Any other location's QR is refused
    const other = team.path.find((id, i) => i !== level && i !== 0 && id !== locId);
    res = await post("/api/game/scan", { qrString: qrFor(other) });
    assert.equal(res.status, 400, `${teamId} out-of-order QR L${level}`);
    res = await post("/api/game/scan", { qrString: "NOT-A-REAL-QR" });
    assert.equal(res.status, 400);

    // The right QR opens this level's assigned question
    res = await post("/api/game/scan", { qrString: qrFor(locId) });
    assert.equal(res.status, 200, JSON.stringify(res.body));
    report.qrsScanned.push(locId);
    assert.equal(res.body.state.status, "CHALLENGE_OPEN");
    assert.equal(res.body.state.challenge.prompt, q.prompt);
    assert.equal(res.body.state.challenge.options.length, q.options.length);
    const raw = JSON.stringify(res.body);
    assert.ok(!raw.includes(q.explanation), "explanation leaked");
    assert.ok(!raw.includes("correctKey"), "correctKey leaked");

    // Odd levels: miss once first (penalty, attempts left)
    if (wrongOnOddLevels && level % 2 === 1) {
      const wrong = q.options.find((o) => o.key !== q.correctKey).key;
      res = await post("/api/game/answer", { level, optionKey: wrong });
      assert.equal(res.status, 400);
      assert.equal(res.body.correct, false);
      assert.ok(res.body.penaltyAdded > 0);
      assert.ok(!JSON.stringify(res.body).includes(q.explanation));
      report.wrong++;
    }

    res = await post("/api/game/answer", { level, optionKey: q.correctKey });
    assert.equal(res.status, 200, `${teamId} L${level}: ${JSON.stringify(res.body)}`);
    assert.equal(res.body.correct, true);
    assert.equal(res.body.explanation, q.explanation);
    assert.equal(res.body.state.level, level);

    if (level < N) {
      assert.equal(res.body.state.status, "HINT_UNLOCKED");
      assert.equal(res.body.state.hint, locations.get(team.path[level + 1]).hint);
      report.hints.push(team.path[level + 1]);
    } else {
      assert.equal(res.body.state.status, "FINALE");
    }
  }

  // ---- Mega Puzzle
  res = await get("/api/game/state");
  assert.equal(res.body.status, "FINALE");
  const hops = res.body.hopCodes;
  assert.equal(hops.length, N, "one hop code per level");
  assert.deepEqual(
    [...hops].sort(),
    [...team.path.slice(1).map((id) => locations.get(id).keyword)].sort(),
  );

  const good = solveFinale(hops, team.finaleChallenge);
  const bad = [...good].reverse();
  if (!isValidOrder(bad, hops, team.finaleChallenge)) {
    res = await post("/api/game/submit", { answer: bad.join("-") });
    assert.equal(res.status, 400);
    assert.equal(res.body.correct, false);
    report.wrong++;
  }
  res = await post("/api/game/submit", { answer: good.join("-") });
  assert.equal(res.status, 200, JSON.stringify(res.body));
  assert.equal(res.body.state.status, "COMPLETED");
  assert.ok(res.body.state.finishedAt);

  // Finished teams cannot keep scanning
  res = await post("/api/game/scan", { qrString: qrFor(team.path[1]) });
  assert.equal(res.status, 200);
  assert.equal(res.body.state.status, "COMPLETED");

  report.penaltySeconds = res.body.state.penaltySeconds;
  report.startedAt = res.body.state.startedAt;
  report.finishedAt = res.body.state.finishedAt;
  return report;
}
