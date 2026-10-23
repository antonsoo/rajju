import assert from "node:assert/strict";
import test from "node:test";
import {
  CORNERS,
  FIELD_DEFAULT,
  fieldGround,
  fieldModel,
  fieldRecipe,
  METHODS,
  parseField,
  serializeField,
  sourcePeg,
} from "../src/core/field";

test("all four source methods stake the same prescribed ground", () => {
  for (const method of METHODS) {
    const placed = Object.fromEntries(CORNERS.map((corner) => [corner, sourcePeg(method, corner)]));
    for (const corner of CORNERS) {
      const m = fieldModel(sourcePeg(method, corner), corner);
      assert.equal(m.angle, 90);
      assert.equal(m.error, 0);
      assert.equal(m.peg.x, corner[0] === "w" ? 0 : 36);
      assert.equal(Math.abs(m.peg.y), corner[0] === "w" ? 15 : 12);
    }
    const ground = fieldGround(placed);
    assert.ok(ground.complete);
    assert.equal(ground.area, 972);
    assert.equal(ground.westWidth, 30);
    assert.equal(ground.eastWidth, 24);
  }
});

test("holding the 15 mark and staking it are different eastern operations", () => {
  const source = fieldModel({ method: "one", grip: 1500, stake: "mark" }, "en");
  const mistaken = fieldModel({ method: "one", grip: 1500, stake: "grip" }, "en");
  assert.deepEqual(source.gripPoint, mistaken.gripPoint);
  assert.equal(source.gripPoint.y, 15);
  assert.equal(source.peg.y, 12);
  assert.equal(mistaken.peg.y, 15);
  assert.equal(mistaken.angle, 90);
  assert.equal(mistaken.error, 3);
});

test("holding the source's 12 mark instead does not make the same perpendicular", () => {
  const m = fieldModel({ method: "one", grip: 1200, stake: "mark" }, "en");
  assert.equal(m.peg.x, 40.5);
  assert.ok(Math.abs(m.peg.y - Math.sqrt(123.75)) < 1e-12);
  assert.notEqual(m.angle, 90);
  assert.equal(m.followsSource, false);
});

test("taut endpoint degeneracy does not invent a right angle", () => {
  for (const method of METHODS)
    for (const corner of CORNERS) {
      const recipe = fieldRecipe(method, corner);
      for (const grip of [recipe.minGrip, recipe.maxGrip]) {
        const m = fieldModel({ method, grip, stake: "grip" }, corner);
        assert.equal(m.height, 0);
        assert.equal(m.angle, null);
        assert.ok(Number.isFinite(m.peg.x));
      }
    }
});

test("four right angles to the baseline can still give the wrong ground", () => {
  const placed = Object.fromEntries(
    CORNERS.map((corner) => [
      corner,
      { method: "one" as const, grip: 1500, stake: "grip" as const },
    ]),
  );
  const ground = fieldGround(placed);
  assert.ok(ground.complete);
  assert.equal(ground.area, 1080);
  assert.equal(ground.eastWidth, 30);
  assert.equal(ground.allOnTarget, false);
});

test("incomplete or crossed boundaries do not acquire an enclosed-ground area", () => {
  assert.equal(fieldGround({}).complete, false);
  const placed = Object.fromEntries(CORNERS.map((corner) => [corner, sourcePeg("one", corner)]));
  placed.wn = { method: "one", grip: 4400, stake: "grip" };
  const ground = fieldGround(placed);
  assert.ok(ground.complete);
  assert.equal(ground.crossed, true);
  assert.equal(ground.area, null);
});

test("a shared ground retains each peg's actual method and mark decisions", () => {
  const state = {
    ...FIELD_DEFAULT,
    corner: "es" as const,
    method: "81517" as const,
    grip: 1200,
    placed: {
      wn: sourcePeg("one", "wn"),
      ws: sourcePeg("345", "ws"),
      en: { method: "one" as const, grip: 1500, stake: "grip" as const },
    },
  };
  assert.deepEqual(parseField(serializeField(state)), { state, issue: null });
});

test("impossible, duplicate and truncated peg records reset the whole link", () => {
  for (const query of [
    "?grip=899",
    "?grip=4501",
    "?method=one&method=345",
    "?placed=wn,one,1500,mark;wn,345,1500,mark",
    "?placed=wn,one,1500,mark;es,one,12",
    "?placed=en,one,not-a-number,mark",
    "?page=26",
  ]) {
    const parsed = parseField(query);
    assert.ok(parsed.issue, query);
    assert.deepEqual(parsed.state, FIELD_DEFAULT);
  }
});
