import { CORNERS, fieldModel, fieldRecipe, METHODS } from "../src/core/field";

const cases = [];
for (const method of METHODS)
  for (const corner of CORNERS) {
    const r = fieldRecipe(method, corner);
    const grips = new Set([r.minGrip, r.minGrip + 1, r.maxGrip - 1, r.maxGrip, r.sourceGrip * 100]);
    for (let n = 1; n < 13; n++)
      grips.add(Math.round(r.minGrip + (n / 13) * (r.maxGrip - r.minGrip)));
    for (const grip of grips)
      for (const stake of ["mark", "grip"] as const) {
        const m = fieldModel({ method, grip, stake }, corner);
        cases.push({ method, corner, grip: grip / 100, stake, held: m.gripPoint, peg: m.peg });
      }
  }
process.stdout.write(JSON.stringify(cases));
