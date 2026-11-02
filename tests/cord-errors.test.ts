import assert from "node:assert/strict";
import test from "node:test";
import { compareCordErrors, cordErrorModel } from "../src/core/cord-errors";
import { CORNERS, FIELD_DEFAULT, METHODS, parseField, serializeField } from "../src/core/field";

const close = (actual: number, expected: number) =>
  assert.ok(Math.abs(actual - expected) < 1e-10, `${actual} != ${expected}`);

test("zero errors recover every source corner, regardless of the current proposal", () => {
  for (const corner of CORNERS) {
    // A full UI state carries unrelated method/corner/grip values. They must not
    // replace the identity or geometry of each independently compared recipe.
    const proposal = { ...FIELD_DEFAULT, grip: 4400 };
    const models = compareCordErrors(corner, proposal);
    assert.deepEqual(
      models.map((m) => m.method),
      METHODS,
    );
    for (const m of models) {
      assert.equal(m.corner, corner);
      assert.equal(m.kind, "taut");
      assert.equal(m.miss, 0);
      assert.equal(m.angle, 90);
      assert.equal(m.peg.x, corner[0] === "w" ? 0 : 36);
      assert.equal(m.peg.y, (corner[1] === "n" ? 1 : -1) * (corner[0] === "w" ? 15 : 12));
    }
  }
});

test("a near-length error does not move the independent eastern twelve mark radially", () => {
  const models = compareCordErrors("en", { nearError: 10, farError: 0 });
  const misses = models.map((m) => {
    assert.notEqual(m.kind, "unreachable");
    if (m.kind === "unreachable") throw new Error("unreachable");
    const radius = Math.hypot(m.peg.x - 36, m.peg.y);
    close(radius, m.method === "one" ? 12 : 12.1);
    return m.miss;
  });
  const [one, three, fiveMiss, eight] = misses;
  assert.ok(
    one !== undefined && three !== undefined && fiveMiss !== undefined && eight !== undefined,
  );
  assert.ok(one < eight && eight < three && three < fiveMiss);
  const five = models[2];
  assert.ok(five && five.kind !== "unreachable");
  // Subtract the two squared circle equations, with lengths 12.1 and 13.
  close(five.dx, -0.241);
  close(five.dy, Math.sqrt(12.1 ** 2 - 0.241 ** 2) - 12);
});

test("no meeting and tangent meeting are distinct, using integer side inequalities", () => {
  assert.equal(
    cordErrorModel("51213", "en", { nearError: -300, farError: 300 }).kind,
    "unreachable",
  );
  const tangent = cordErrorModel("51213", "en", { nearError: 300, farError: -300 });
  assert.equal(tangent.kind, "collinear");
  assert.equal(tangent.angle, null);
  assert.equal(tangent.peg.y, 0);
  close(tangent.peg.x, 21);
});

test("a moved grip on a fixed-total cord agrees with the existing ideal geometry", async () => {
  const { fieldModel } = await import("../src/core/field");
  for (const corner of CORNERS)
    for (const method of METHODS)
      for (const e of [-100, -1, 0, 1, 100]) {
        const m = cordErrorModel(method, corner, { nearError: e, farError: -e });
        if (m.kind === "unreachable") continue;
        const exact = fieldModel(
          { method, grip: m.prescribedNear * 100 + e, stake: m.separateMark ? "mark" : "grip" },
          corner,
        );
        close(m.peg.x, exact.peg.x);
        close(m.peg.y, exact.peg.y);
      }
});

test("segment errors round-trip alongside retained pegs; malformed error links reset entirely", () => {
  const state = {
    ...FIELD_DEFAULT,
    nearError: -300,
    farError: 300,
    placed: { wn: { method: "345" as const, grip: 1500, stake: "mark" as const } },
  };
  assert.deepEqual(parseField(serializeField(state)), { state, issue: null });
  for (const query of [
    "?nearerr=301",
    "?nearerr=-301",
    "?farerr=0.1",
    "?nearerr=1&nearerr=2",
    "?farerr=NaN",
    "?farerr=",
  ]) {
    const result = parseField(query);
    assert.ok(result.issue, query);
    assert.deepEqual(result.state, FIELD_DEFAULT);
  }
  for (const n of [NaN, Infinity, 0.5, 301, -301])
    assert.throws(() => cordErrorModel("one", "wn", { nearError: n, farError: 0 }), RangeError);
});
