import { asText } from "../src/core/fraction";
import { circleModel, diagonalModel } from "../src/core/geometry";

const circle = [];
for (const side of [100, 1000, 7333, 10000]) {
  for (const returnRule of ["detailed", "simple"] as const) {
    for (const rule of ["third", "equal", "custom"] as const) {
      for (const kept of rule === "custom"
        ? [0, 1, 10, 100, 250, 309, 310, 333, 334, 500, 750, 999, 1000]
        : [333]) {
        const model = circleModel(side, rule, kept, returnRule);
        circle.push({ ...model, returnFactor: asText(model.returnFactor) });
      }
    }
  }
}
const diagonal = [];
for (const side of [100, 1000, 7333, 10000]) {
  for (const stage of [0, 1, 2, 3]) {
    const model = diagonalModel(side, stage);
    diagonal.push({
      ...model,
      ratio: asText(model.ratio),
      area: asText(model.area),
      areaError: asText(model.areaError),
      relativeAreaError: asText(model.relativeAreaError),
    });
  }
}
process.stdout.write(JSON.stringify({ circle, diagonal }));
