import { type Corner, fieldRecipe, METHODS, type Method, type Point } from "./field";

export interface CordErrors {
  /** Actual minus prescribed length, in hundredths of one source unit. */
  nearError: number;
  farError: number;
}

export function checkCordErrors(errors: CordErrors): void {
  for (const value of [errors.nearError, errors.farError])
    if (!Number.isInteger(value) || Math.abs(value) > 300)
      throw new RangeError("Segment errors must be whole hundredths between −300 and 300.");
}

export function cordErrorModel(method: Method, corner: Corner, errors: CordErrors) {
  checkCordErrors(errors);
  const recipe = fieldRecipe(method, corner);
  // Integer hundredths decide reachability and tangency before any square root.
  const a = recipe.sourceGrip * 100 + errors.nearError;
  const b = (recipe.loop - recipe.sourceGrip) * 100 + errors.farError;
  const c = recipe.baseline * 100;
  const common = {
    method,
    corner,
    nearError: errors.nearError,
    farError: errors.farError,
    baseline: recipe.baseline,
    prescribedNear: recipe.sourceGrip,
    prescribedFar: recipe.loop - recipe.sourceGrip,
    actualNear: a / 100,
    actualFar: b / 100,
    // Only the eastern one-cord method stakes a separate mark instead of its grip.
    separateMark: recipe.sourceGrip !== recipe.targetHalfWidth,
    target: { x: recipe.anchor, y: recipe.side * recipe.targetHalfWidth },
  };
  if (a + b < c || Math.abs(a - b) > c)
    return { ...common, kind: "unreachable" as const, peg: null, grip: null };
  const tangent = a + b === c || Math.abs(a - b) === c;
  const u = (c * c + a * a - b * b) / (2 * c);
  const h = tangent
    ? 0
    : Math.sqrt((a + b + c) * (-a + b + c) * (a - b + c) * (a + b - c)) / (2 * c);
  const grip = { x: recipe.anchor + (recipe.direction * u) / 100, y: (recipe.side * h) / 100 };
  // In the distinct-mark case the twelve mark is assumed exact; it is within
  // the near segment throughout this bounded experiment (15 +/- 3 >= 12).
  const factor = common.separateMark ? recipe.targetHalfWidth / common.actualNear : 1;
  const peg: Point = {
    x: recipe.anchor + (grip.x - recipe.anchor) * factor,
    y: grip.y * factor,
  };
  const dx = peg.x - common.target.x;
  const dy = peg.y - common.target.y;
  return {
    ...common,
    kind: tangent ? ("collinear" as const) : ("taut" as const),
    grip,
    peg,
    dx,
    dy,
    miss: Math.hypot(dx, dy),
    angle: tangent ? null : (Math.atan2(h, u) * 180) / Math.PI,
  };
}

export const compareCordErrors = (corner: Corner, errors: CordErrors) =>
  METHODS.map((method) => cordErrorModel(method, corner, errors));
export type CordErrorModel = ReturnType<typeof cordErrorModel>;
