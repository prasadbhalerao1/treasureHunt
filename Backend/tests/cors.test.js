import { test, before } from "node:test";
import assert from "node:assert/strict";
import express from "express";
import request from "supertest";
import configureExpress, { buildOriginMatchers } from "../config/express.js";

let app;

before(() => {
  process.env.CORS_ORIGINS = [
    "https://traceroute-cn.vercel.app/", // trailing slash must be tolerated
    "https://traceroute-ivory.vercel.app",
    "https://traceroute-*-prasads-projects-b60fa4b6.vercel.app",
  ].join(",");

  app = express();
  configureExpress(app);
  app.get("/api/ok", (req, res) => res.json({ ok: true }));
  app.get("/api/denied", (req, res) => res.status(401).json({ msg: "nope" }));
  app.post("/api/boom", (req, res) => res.status(500).json({ msg: "boom" }));
});

const ALLOWED = [
  "https://traceroute-cn.vercel.app",
  "https://traceroute-ivory.vercel.app",
  "https://traceroute-abc123xyz-prasads-projects-b60fa4b6.vercel.app", // deployment URL
  "http://localhost:5173",
  "http://localhost:3000",
];

const BLOCKED = [
  "https://evil.example",
  "https://traceroute.vercel.app", // someone else's project
  "https://traceroute-cn.vercel.app.evil.example", // suffix trick
  "https://traceroute-x.y-prasads-projects-b60fa4b6.vercel.app", // wildcard must not cross dots
  "https://traceroute--prasads-projects-b60fa4b6.vercel.app.evil.io",
  "http://traceroute-cn.vercel.app", // wrong scheme
];

test("allowed origins get matching CORS headers on normal responses", async () => {
  for (const origin of ALLOWED) {
    const res = await request(app).get("/api/ok").set("Origin", origin);
    assert.equal(res.status, 200);
    assert.equal(res.headers["access-control-allow-origin"], origin, origin);
    assert.equal(res.headers["access-control-allow-credentials"], "true");
  }
});

test("blocked origins never receive CORS headers (and do not crash)", async () => {
  for (const origin of BLOCKED) {
    const res = await request(app).get("/api/ok").set("Origin", origin);
    assert.equal(res.status, 200, `${origin} should not 500`);
    assert.equal(res.headers["access-control-allow-origin"], undefined, origin);
  }
});

test("preflight works for every method and header the app uses", async () => {
  for (const method of ["POST", "GET", "PUT", "DELETE"]) {
    const res = await request(app)
      .options("/api/anything")
      .set("Origin", "https://traceroute-cn.vercel.app")
      .set("Access-Control-Request-Method", method)
      .set("Access-Control-Request-Headers", "authorization,content-type");
    assert.equal(res.status, 204, method);
    assert.equal(res.headers["access-control-allow-origin"], "https://traceroute-cn.vercel.app");
    assert.match(res.headers["access-control-allow-methods"], new RegExp(method));
    assert.match(res.headers["access-control-allow-headers"], /authorization/i);
    assert.match(res.headers["access-control-allow-headers"], /content-type/i);
    assert.equal(res.headers["access-control-max-age"], "86400");
  }
});

test("preflight from a blocked origin gets no allow headers", async () => {
  const res = await request(app)
    .options("/api/anything")
    .set("Origin", "https://evil.example")
    .set("Access-Control-Request-Method", "POST");
  assert.notEqual(res.status, 500);
  assert.equal(res.headers["access-control-allow-origin"], undefined);
});

test("error responses still carry CORS headers so the browser shows the real error", async () => {
  const origin = "https://traceroute-cn.vercel.app";
  const a = await request(app).get("/api/denied").set("Origin", origin);
  assert.equal(a.status, 401);
  assert.equal(a.headers["access-control-allow-origin"], origin);
  const b = await request(app).post("/api/boom").set("Origin", origin);
  assert.equal(b.status, 500);
  assert.equal(b.headers["access-control-allow-origin"], origin);
});

test("requests without an Origin header (curl, server-side) still work", async () => {
  const res = await request(app).get("/api/ok");
  assert.equal(res.status, 200);
});

test("wildcard matcher is anchored and escapes dots", () => {
  const m = buildOriginMatchers("https://a-*.example.com");
  const ok = (o) => m.some((f) => f(o));
  assert.ok(ok("https://a-1.example.com"));
  assert.ok(!ok("https://a-1.example.com.evil.io"));
  assert.ok(!ok("https://a-1xexample.com"));
  assert.ok(!ok("https://a-.example.com"));
});
