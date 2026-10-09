import assert from "node:assert/strict";
import request from "supertest";

const auth = (t) => ({ Authorization: `Bearer ${t}` });

/**
 * Plays one team through the whole event over HTTP and asserts every step.
 *
 * Flow: scan Start -> MCQ 1 -> riddle L1 -> scan L1 -> MCQ 2 -> ... ->
 *       solve MCQ N -> riddle LN -> scan LN -> rapid-fire round -> finish.
 *
 * qrFor(locationId)  -> the text a phone would read from that location's QR
 * locations          -> Map(locationId -> { hint, name, keyword })
 * getRecord()        -> fresh lean Team doc (path, challenges)
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
  const N = team.path.length - 1; // MCQ levels
  const report = { teamId, path: team.path, hints: [], qrsScanned: [], wrong: 0 };

  // ---- Not started
  let res = await get("/api/game/state");
  assert.equal(res.body.status, "NOT_STARTED", `${teamId} initial status`);
  assert.equal(res.body.totalLevels, N);

  // A QR from another location must not start the game
  res = await post("/api/game/scan", { qrString: qrFor(team.path[1]) });
  assert.equal(res.status, 400, `${teamId} wrong QR for start`);

  for (let level = 1; level <= N; level++) {
    // The QR to scan for this question is path[level - 1]
    const scanId = team.path[level - 1];
    const ch = team.challenges.find((c) => c.level === level);
    const q = await getQuestion(ch.questionId);

    // Answering before scanning is refused
    res = await post("/api/game/answer", { level, optionKey: "A" });
    assert.equal(res.status, 400, `${teamId} answer before scan L${level}`);

    // Wrong QR is refused
    res = await post("/api/game/scan", { qrString: "NOT-A-REAL-QR" });
    assert.equal(res.status, 400);
    const other = team.path.find((id) => id !== scanId);
    res = await post("/api/game/scan", { qrString: qrFor(other) });
    assert.equal(res.status, 400, `${teamId} out-of-order QR L${level}`);

    // Scan the right QR -> the MCQ opens
    res = await post("/api/game/scan", { qrString: qrFor(scanId) });
    assert.equal(res.status, 200, JSON.stringify(res.body));
    report.qrsScanned.push(scanId);
    assert.equal(res.body.state.status, "CHALLENGE_OPEN", `L${level} opens a question`);
    assert.equal(res.body.state.challenge.prompt, q.prompt);
    const raw = JSON.stringify(res.body);
    assert.ok(!raw.includes(q.explanation), "explanation leaked");
    assert.ok(!raw.includes("correctKey"), "correctKey leaked");

    // Re-scan is idempotent
    const again = await post("/api/game/scan", { qrString: qrFor(scanId) });
    assert.equal(again.body.state.challenge.prompt, q.prompt);

    if (wrongOnOddLevels && level % 2 === 1) {
      const wrong = q.options.find((o) => o.key !== q.correctKey).key;
      res = await post("/api/game/answer", { level, optionKey: wrong });
      assert.equal(res.status, 400);
      assert.equal(res.body.correct, false);
      assert.ok(res.body.penaltyAdded > 0);
      assert.ok(!JSON.stringify(res.body).includes(q.explanation));
      report.wrong++;
    }

    // Correct answer -> the riddle for the NEXT location
    const [r1, r2] = await Promise.all([
      post("/api/game/answer", { level, optionKey: q.correctKey }),
      post("/api/game/answer", { level, optionKey: q.correctKey }),
    ]);
    assert.deepEqual(
      [r1.status, r2.status].sort(),
      [200, 409],
      `level ${level}: double submit must advance once`,
    );
    const ok = r1.status === 200 ? r1 : r2;
    assert.equal(ok.body.correct, true);
    assert.equal(ok.body.explanation, q.explanation);
    assert.equal(ok.body.state.level, level);
    assert.equal(ok.body.state.status, "HINT_UNLOCKED");
    assert.equal(
      ok.body.state.hint,
      locations.get(team.path[level]).hint,
      `L${level}: riddle for the next location`,
    );
    report.hints.push(team.path[level]);
  }

  report.penaltyBeforeFinale = (await get("/api/game/state")).body.penaltySeconds;

  // ---- Scanning the last location unlocks the rapid-fire round
  const lastId = team.path[N];
  res = await post("/api/game/scan", { qrString: qrFor(lastId) });
  assert.equal(res.status, 200, JSON.stringify(res.body));
  report.qrsScanned.push(lastId);
  assert.equal(res.body.state.status, "FINALE");
  assert.ok(res.body.state.finaleTotal > 0, "a finale set was drawn");
  assert.ok(res.body.state.finaleQuestion, "the first finale question is served");

  // Questions must NOT repeat what the team already answered
  const seen = new Set(team.challenges.map((c) => c.questionId));
  const after = await getRecord();
  for (const fq of after.finaleQuestions) {
    assert.ok(!seen.has(fq.questionId), "finale reuses a question the team saw");
  }
  report.finaleTotal = after.finaleQuestions.length;

  // ---- Answer every finale question; miss the first one once
  for (let i = 0; i < after.finaleQuestions.length; i++) {
    const state = (await get("/api/game/state")).body;
    assert.equal(state.status, "FINALE");
    const fq = state.finaleQuestion;
    assert.ok(fq, `finale question ${i + 1} is served`);
    assert.equal(state.finaleSolved, i);
    const q = await getQuestion(after.finaleQuestions[i].questionId);
    assert.equal(fq.prompt, q.prompt);
    assert.ok(!JSON.stringify(state).includes(q.explanation), "explanation leaked");

    if (i === 0) {
      const wrong = q.options.find((o) => o.key !== q.correctKey).key;
      res = await post("/api/game/submit", { optionKey: wrong });
      assert.equal(res.status, 400);
      assert.equal(res.body.correct, false);
      // no penalty, and the same question is still open
      assert.equal(res.body.state.penaltySeconds, report.penaltyBeforeFinale ?? res.body.state.penaltySeconds);
      assert.equal(res.body.state.finaleQuestion.prompt, q.prompt);
      assert.equal(res.body.state.finaleSolved, 0);
      report.wrong++;
    }

    res = await post("/api/game/submit", { optionKey: q.correctKey });
    assert.equal(res.status, 200, JSON.stringify(res.body));
    assert.equal(res.body.correct, true);
  }

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
