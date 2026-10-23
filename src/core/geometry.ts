import { add, asNumber, fraction, multiply } from "./fraction";

export type CircleRule = "third" | "equal" | "custom";
export type ReturnRule = "detailed" | "simple";

export const DETAILED_RETURN = add(
  add(fraction(7n, 8n), fraction(1n, 232n)),
  add(fraction(-1n, 1392n), fraction(1n, 11136n)),
);
export const SIMPLE_RETURN = fraction(13n, 15n);
export const DIAGONAL_STAGES = [
  fraction(1n),
  fraction(4n, 3n),
  fraction(17n, 12n),
  fraction(577n, 408n),
] as const;

function checkSide(side: number): void {
  if (!Number.isInteger(side) || side < 100 || side > 10000) {
    throw new RangeError("Use a whole-number side from 100 to 10,000 mm.");
  }
}

export function circleModel(
  side: number,
  rule: CircleRule,
  thousandths: number,
  returnRule: ReturnRule,
) {
  checkSide(side);
  if (!Number.isInteger(thousandths) || thousandths < 0 || thousandths > 1000) {
    throw new RangeError("Keep between zero and all of the excess cord.");
  }
  const excessPerSide = (Math.SQRT2 - 1) / 2;
  const kept =
    rule === "third"
      ? 1 / 3
      : rule === "equal"
        ? (1 / Math.sqrt(Math.PI) - 0.5) / excessPerSide
        : thousandths / 1000;
  const radiusRatio = 0.5 + kept * excessPerSide;
  const circleAreaRatio = Math.PI * radiusRatio ** 2;
  // Four disjoint circular segments lie outside the square for this radius
  // range. At the endpoints, clamp floating-point cancellation to zero.
  const segment =
    radiusRatio ** 2 * Math.acos(0.5 / radiusRatio) -
    0.5 * Math.sqrt(Math.max(0, radiusRatio ** 2 - 0.25));
  const gainedRatio = Math.max(0, 4 * segment);
  const lostRatio = Math.max(0, 1 - circleAreaRatio + gainedRatio);
  const returnFactor = returnRule === "detailed" ? DETAILED_RETURN : SIMPLE_RETURN;
  const returnedSideRatio = 2 * radiusRatio * asNumber(returnFactor);
  return {
    side,
    rule,
    thousandths,
    returnRule,
    kept,
    halfDiagonal: side / Math.SQRT2,
    excess: side * excessPerSide,
    radiusRatio,
    radius: side * radiusRatio,
    diameter: side * radiusRatio * 2,
    originalArea: side ** 2,
    circleAreaRatio,
    circleArea: side ** 2 * circleAreaRatio,
    gainedRatio,
    lostRatio,
    gainedArea: gainedRatio * side ** 2,
    lostArea: lostRatio * side ** 2,
    returnFactor,
    returnedSideRatio,
    returnedSide: side * returnedSideRatio,
    returnedAreaRatio: returnedSideRatio ** 2,
    returnedArea: (side * returnedSideRatio) ** 2,
    sideError: side * (returnedSideRatio - 1),
    circleErrorPercent: (circleAreaRatio - 1) * 100,
    returnErrorPercent: (returnedSideRatio ** 2 - 1) * 100,
    returnErrorFromCirclePercent: (returnedSideRatio ** 2 / circleAreaRatio - 1) * 100,
  };
}

export function diagonalModel(side: number, stage: number) {
  checkSide(side);
  const ratio = DIAGONAL_STAGES[stage];
  if (!ratio || !Number.isInteger(stage)) throw new RangeError("Choose a step from 0 to 3.");
  const area = multiply(ratio, ratio);
  const areaError = add(area, fraction(-2n));
  const relativeAreaError = multiply(areaError, fraction(1n, 2n));
  const ratioNumber = asNumber(ratio);
  return {
    side,
    stage,
    ratio,
    ratioNumber,
    diagonal: side * ratioNumber,
    geometricDiagonal: side * Math.SQRT2,
    lengthError: side * (ratioNumber - Math.SQRT2),
    area,
    areaError,
    relativeAreaError,
    targetArea: 2 * side ** 2,
    producedArea: asNumber(area) * side ** 2,
    areaErrorPpm: asNumber(relativeAreaError) * 1000000,
  };
}

export type CircleModel = ReturnType<typeof circleModel>;
export type DiagonalModel = ReturnType<typeof diagonalModel>;
