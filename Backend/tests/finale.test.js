import test from "node:test";
import assert from "node:assert/strict";
import { isValidOrder } from "../utils/finale.js";

const HOPS = ["ROUTER", "GATEWAY", "SWITCH", "DNS", "NAT", "HUB", "PROXY"];

test("ALPHA_ASC accepts the sorted order only", () => {
  const sorted = [...HOPS].sort();
  assert.equal(isValidOrder(sorted, HOPS, "ALPHA_ASC"), true);
  assert.equal(isValidOrder([...HOPS], HOPS, "ALPHA_ASC"), false);
});

test("ALPHA_DESC accepts the reverse order", () => {
  const sorted = [...HOPS].sort().reverse();
  assert.equal(isValidOrder(sorted, HOPS, "ALPHA_DESC"), true);
  assert.equal(isValidOrder([...HOPS].sort(), HOPS, "ALPHA_DESC"), false);
});

test("LENGTH_ASC accepts any order among equal-length ties", () => {
  const a = ["DNS", "NAT", "HUB", "PROXY", "ROUTER", "SWITCH", "GATEWAY"];
  const b = ["HUB", "NAT", "DNS", "PROXY", "SWITCH", "ROUTER", "GATEWAY"];
  assert.equal(isValidOrder(a, HOPS, "LENGTH_ASC"), true);
  assert.equal(isValidOrder(b, HOPS, "LENGTH_ASC"), true);
  assert.equal(isValidOrder([...a].reverse(), HOPS, "LENGTH_ASC"), false);
});

test("SECOND_LETTER and LAST_LETTER use the right character", () => {
  const second = [...HOPS].sort((x, y) => x[1].localeCompare(y[1]));
  assert.equal(isValidOrder(second, HOPS, "SECOND_LETTER"), true);
  const last = [...HOPS].sort((x, y) =>
    x[x.length - 1].localeCompare(y[y.length - 1]),
  );
  assert.equal(isValidOrder(last, HOPS, "LAST_LETTER"), true);
});

test("rejects missing, extra, or duplicated hop codes", () => {
  const sorted = [...HOPS].sort();
  assert.equal(isValidOrder(sorted.slice(1), HOPS, "ALPHA_ASC"), false);
  assert.equal(isValidOrder([...sorted, "FAKE"], HOPS, "ALPHA_ASC"), false);
  const dup = [...sorted];
  dup[1] = dup[0];
  assert.equal(isValidOrder(dup, HOPS, "ALPHA_ASC"), false);
  // duplicate padding must not sneak through the set comparison
  assert.equal(
    isValidOrder([...sorted, sorted[0]], HOPS, "ALPHA_ASC"),
    false,
  );
});
