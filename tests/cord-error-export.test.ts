import assert from "node:assert/strict";
import test from "node:test";
import { cordErrorsCsv } from "../src/cord-errors-view";
import { FIELD_DEFAULT } from "../src/core/field";

test("CSV preserves procedure identities, no fabricated unreachable coordinates, and model scope", () => {
  const csv = cordErrorsCsv({ ...FIELD_DEFAULT, nearError: -300, farError: 300 });
  assert.ok(
    csv.includes('"51213","-3","3","5","12","13","9","16","unreachable","","","","","",""'),
  );
  assert.ok(csv.includes('"81517"'));
  assert.ok(csv.includes("not measurements of ancient cords"));
  assert.equal(csv.split("\r\n").length, 6);
});
