import { cordErrorModel } from "../src/core/cord-errors";
import { CORNERS, METHODS } from "../src/core/field";

const errors = [-300, -200, -100, -10, -1, 0, 1, 10, 100, 200, 300];
for (const corner of CORNERS)
  for (const method of METHODS)
    for (const nearError of errors)
      for (const farError of errors)
        console.log(JSON.stringify(cordErrorModel(method, corner, { nearError, farError })));
