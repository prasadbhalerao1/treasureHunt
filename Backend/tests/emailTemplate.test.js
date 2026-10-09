import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { MongoMemoryServer } from "mongodb-memory-server";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEMPLATE = fs.readFileSync(
  path.join(__dirname, "../../docs/email_template.html"),
  "utf8",
);

let mongod;
let hook;
let payload;

before(async () => {
  mongod = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongod.getUri("traceroute_mail");
  process.env.JWT_SECRET = "mail-test";
  process.env.FRONTEND_URL = "https://traceroute.example.app";
  hook = http.createServer((req, res) => {
    let b = "";
    req.on("data", (c) => (b += c));
    req.on("end", () => {
      payload = JSON.parse(b);
      res.end("ok");
    });
  });
  await new Promise((r) => hook.listen(0, "127.0.0.1", r));
  process.env.MAKE_WEBHOOK_URL = `http://127.0.0.1:${hook.address().port}`;

  const dbConnect = (await import("../config/dbConnect.js")).default;
  await dbConnect();
  const { triggerWebhook } = await import("../services/teamService.js");
  const out = await triggerWebhook({
    teamId: "PAC-3F2A",
    name: "Packet Pirates",
    email: "lead@college.edu",
    password: "s3cret!",
  });
  assert.equal(out.sent, true);
});

after(async () => {
  const mongoose = (await import("mongoose")).default;
  await mongoose.disconnect();
  await mongod.stop();
  await new Promise((r) => hook.close(r));
});

test("every {{1.field}} in the email template exists in the webhook payload", () => {
  const used = [...TEMPLATE.matchAll(/\{\{1\.(\w+)\}\}/g)].map((m) => m[1]);
  assert.ok(used.length > 8, "template should use the payload fields");
  for (const key of new Set(used)) {
    assert.ok(key in payload, `template uses {{1.${key}}} but the webhook does not send it`);
    assert.ok(payload[key] !== "" && payload[key] !== undefined, `${key} is empty`);
  }
});

test("template shows credentials, link and rules, with no old branding", () => {
  for (const key of ["teamId", "password", "loginUrl", "eventName", "name", "totalLevels"]) {
    assert.ok(TEMPLATE.includes(`{{1.${key}}}`), `missing {{1.${key}}}`);
  }
  assert.ok(!/berlin|heist|treasure|bitlocker|contact form|unlink/i.test(TEMPLATE));
  // no stray Make placeholders from the old contact-form template
  assert.ok(!/\{\{2\./.test(TEMPLATE));
  assert.ok(!/<img\b/i.test(TEMPLATE), "email must not contain images");
  // balanced tables
  const open = (TEMPLATE.match(/<table/g) || []).length;
  const close = (TEMPLATE.match(/<\/table>/g) || []).length;
  assert.equal(open, close);
});

test("rendered email contains the right values", () => {
  const html = TEMPLATE.replace(/\{\{1\.(\w+)\}\}/g, (_, k) => String(payload[k]));
  assert.ok(html.includes("PAC-3F2A"));
  assert.ok(html.includes("s3cret!"));
  assert.ok(html.includes('href="https://traceroute.example.app"'));
  assert.ok(html.includes("<title>Your TraceRoute login</title>"));
  assert.ok(!html.includes("{{"));
});
