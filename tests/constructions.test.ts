import assert from "node:assert/strict";
import test from "node:test";
import { asText } from "../src/core/fraction";
import { circleModel, diagonalModel } from "../src/core/geometry";
import { DEFAULT_STATE, parseState, serializeState } from "../src/core/state";

test("a close return must not erase the intermediate area mismatch", () => {
  const m = circleModel(1000, "third", 333, "detailed");
  assert.ok(m.circleErrorPercent > 1.7 && m.circleErrorPercent < 1.8);
  assert.ok(m.returnErrorPercent > 0 && m.returnErrorPercent < 0.001);
  assert.ok(m.returnErrorFromCirclePercent < -1.6);
  assert.equal(asText(m.returnFactor), "9785/11136");
  assert.ok(Math.abs(m.gainedArea - m.lostArea - (m.circleArea - m.originalArea)) < 1e-8);
});

test("source third and a rounded custom third are distinct constructions", () => {
  const source = circleModel(1000, "third", 333, "detailed");
  const altered = circleModel(1000, "custom", 333, "detailed");
  assert.notEqual(source.radius, altered.radius);
  assert.equal(source.kept, 1 / 3);
  assert.equal(altered.kept, 333 / 1000);
});

test("equal-area comparison does not make the historical return exact", () => {
  const m = circleModel(1000, "equal", 333, "detailed");
  assert.ok(Math.abs(m.circleErrorPercent) < 1e-12);
  assert.ok(m.returnErrorPercent < -1.6);
  assert.ok(Math.abs(m.gainedArea - m.lostArea) < 1e-8);
});

test("inscribed and circumscribed endpoints keep area sets nonnegative", () => {
  const inscribed = circleModel(1000, "custom", 0, "simple");
  const circumscribed = circleModel(1000, "custom", 1000, "simple");
  assert.equal(inscribed.gainedArea, 0);
  assert.ok(circumscribed.lostArea < 1e-8);
  assert.ok(inscribed.lostArea > 0);
  assert.ok(circumscribed.gainedArea > 0);
});

test("the final cord leaves one unit of area in the 408-squared grid", () => {
  const d = diagonalModel(1000, 3);
  assert.equal(asText(d.ratio), "577/408");
  assert.equal(577n ** 2n - 2n * 408n ** 2n, 1n);
  assert.equal(asText(d.areaError), "1/166464");
  assert.equal(asText(d.relativeAreaError), "1/332928");
  assert.ok(d.lengthError > 0.002 && d.lengthError < 0.003);
});

test("doubling area and doubling length are not interchangeable", () => {
  const one = diagonalModel(1000, 0);
  assert.equal(asText(one.relativeAreaError), "-1/2");
  const third = diagonalModel(1000, 1);
  assert.ok(third.areaErrorPpm < 0);
  const fourth = diagonalModel(1000, 2);
  assert.ok(fourth.areaErrorPpm > 0);
});

test("physical scale changes length linearly and area quadratically", () => {
  const a = circleModel(100, "third", 333, "detailed");
  const b = circleModel(10000, "third", 333, "detailed");
  assert.ok(Math.abs(b.radius / a.radius - 100) < 1e-12);
  assert.ok(Math.abs(b.circleArea / a.circleArea - 10000) < 1e-10);
  assert.equal(a.circleErrorPercent, b.circleErrorPercent);
});

test("malformed and ambiguous links never silently replay a valid prefix", () => {
  for (const search of [
    "?side=999&side=1000",
    "?side=1000junk",
    "?kept=-1",
    "?page=25",
    "?rule=unknown",
    "?lesson=diagonal&side=NaN",
  ]) {
    const parsed = parseState(search);
    assert.ok(parsed.issue, search);
    assert.deepEqual(parsed.state, DEFAULT_STATE);
  }
});

test("shared selections retain both lessons, the passage and the independent scan page", () => {
  const state = {
    ...DEFAULT_STATE,
    lesson: "diagonal" as const,
    side: 7333,
    step: 1,
    stage: 2,
    rule: "custom" as const,
    kept: 371,
    returnRule: "simple" as const,
    passage: "return" as const,
    page: 15,
  };
  assert.deepEqual(parseState(serializeState(state)), { state, issue: null });
});

test("invalid dimensions and stages are rejected at the calculation boundary", () => {
  for (const side of [0, 99, 10001, 333.5, Infinity, NaN])
    assert.throws(() => circleModel(side, "third", 333, "detailed"), RangeError);
  for (const kept of [-1, 1001, NaN, 0.1])
    assert.throws(() => circleModel(1000, "custom", kept, "simple"), RangeError);
  for (const stage of [-1, 4, 1.2, NaN])
    assert.throws(() => diagonalModel(1000, stage), RangeError);
});
