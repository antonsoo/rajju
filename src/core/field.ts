export const CORNERS = ["wn", "ws", "en", "es"] as const;
export type Corner = (typeof CORNERS)[number];
export const METHODS = ["one", "345", "51213", "81517"] as const;
export type Method = (typeof METHODS)[number];
export type Stake = "mark" | "grip";
export interface Point {
  x: number;
  y: number;
}
export interface PegSetting {
  method: Method;
  grip: number;
  stake: Stake;
}
export interface FieldState extends PegSetting {
  corner: Corner;
  locus: boolean;
  placed: Partial<Record<Corner, PegSetting>>;
  page: number;
}
export const FIELD_PAGES = [9, 10, 11, 12] as const;
export const FIELD_DEFAULT: FieldState = {
  method: "one",
  corner: "en",
  grip: 1500,
  stake: "mark",
  locus: false,
  placed: {},
  page: 9,
};
export const CORNER_NAMES: Record<Corner, string> = {
  wn: "Northwest",
  ws: "Southwest",
  en: "Northeast",
  es: "Southeast",
};
export const METHOD_NAMES: Record<Method, string> = {
  one: "One cord, two marks",
  "345": "3–4–5, enlarged",
  "51213": "5–12–13, enlarged",
  "81517": "8–15–17 and 12–35–37",
};

export function fieldRecipe(method: Method, corner: Corner) {
  const west = corner[0] === "w";
  const north = corner[1] === "n";
  const anchor = west ? 0 : 36;
  const targetHalfWidth = west ? 15 : 12;
  const specifications: Record<
    Method,
    { west: [number, number, number]; east: [number, number, number] }
  > = {
    one: { west: [36, 54, 15], east: [0, 54, 15] },
    "345": { west: [20, 40, 15], east: [20, 32, 12] },
    "51213": { west: [36, 54, 15], east: [31, 25, 12] },
    "81517": { west: [8, 32, 15], east: [1, 49, 12] },
  };
  const [auxiliary, loop, sourceGrip] = specifications[method][west ? "west" : "east"];
  const baseline = Math.abs(auxiliary - anchor);
  return {
    method,
    corner,
    west,
    north,
    anchor,
    auxiliary,
    loop,
    sourceGrip,
    targetHalfWidth,
    baseline,
    direction: west ? 1 : -1,
    side: north ? 1 : -1,
    minGrip: (loop - baseline) * 50,
    maxGrip: (loop + baseline) * 50,
  };
}

export function sourcePeg(method: Method, corner: Corner): PegSetting {
  return { method, grip: fieldRecipe(method, corner).sourceGrip * 100, stake: "mark" };
}

export function fieldModel(setting: PegSetting, corner: Corner) {
  const r = fieldRecipe(setting.method, corner);
  if (!Number.isInteger(setting.grip) || setting.grip < r.minGrip || setting.grip > r.maxGrip)
    throw new RangeError("This mark cannot reach both fixed pegs with a taut cord.");
  const first = setting.grip / 100;
  const second = r.loop - first;
  const along = (r.baseline ** 2 + first ** 2 - second ** 2) / (2 * r.baseline);
  // Heron's product keeps the nearly collinear endpoints stable.
  const h =
    Math.sqrt(
      Math.max(
        0,
        (first + second + r.baseline) *
          (-first + second + r.baseline) *
          (first - second + r.baseline) *
          (first + second - r.baseline),
      ),
    ) /
    (2 * r.baseline);
  const gripPoint = { x: r.anchor + r.direction * along, y: r.side * h };
  const mark = setting.stake === "grip" ? first : r.targetHalfWidth;
  const peg =
    mark <= first
      ? { x: r.anchor + ((gripPoint.x - r.anchor) * mark) / first, y: (gripPoint.y * mark) / first }
      : {
          x: gripPoint.x + ((r.auxiliary - gripPoint.x) * (mark - first)) / second,
          y: gripPoint.y * (1 - (mark - first) / second),
        };
  const target = { x: r.anchor, y: r.side * r.targetHalfWidth };
  const error = Math.hypot(peg.x - target.x, peg.y - target.y);
  const angle = h === 0 ? null : (Math.atan2(h, along) * 180) / Math.PI;
  return {
    ...r,
    grip: setting.grip,
    stake: setting.stake,
    first,
    second,
    along,
    height: h,
    gripPoint,
    mark,
    peg,
    target,
    error,
    alongError: peg.x - target.x,
    acrossError: peg.y - target.y,
    angle,
    followsSource: setting.grip === r.sourceGrip * 100 && mark === r.targetHalfWidth,
    atTarget: error < 1e-9,
  };
}

function cross(a: Point, b: Point, c: Point): number {
  return (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
}
function crosses(a: Point, b: Point, c: Point, d: Point): boolean {
  return cross(a, b, c) * cross(a, b, d) < -1e-10 && cross(c, d, a) * cross(c, d, b) < -1e-10;
}

export function fieldGround(placed: FieldState["placed"]) {
  const points = CORNERS.map((corner) =>
    placed[corner] ? fieldModel(placed[corner], corner).peg : null,
  );
  const complete = points.every((p) => p !== null);
  if (!complete) return { complete: false as const, count: points.filter(Boolean).length };
  // Boundary order follows the ground, rather than the order in which pegs were placed.
  const [wn, ws, en, es] = points as [Point, Point, Point, Point];
  const polygon = [wn, en, es, ws];
  const crossed = crosses(wn, en, es, ws) || crosses(en, es, ws, wn);
  const signedArea =
    polygon.reduce((total, p, i) => {
      const q = polygon[(i + 1) % 4] as Point;
      return total + p.x * q.y - p.y * q.x;
    }, 0) / 2;
  const area = Math.abs(signedArea);
  const degenerate =
    area < 1e-9 ||
    polygon.some((p, i) => {
      const q = polygon[(i + 1) % 4] as Point;
      return Math.hypot(p.x - q.x, p.y - q.y) < 1e-9;
    });
  return {
    complete: true as const,
    count: 4,
    polygon,
    crossed,
    degenerate,
    area: crossed || degenerate ? null : area,
    algebraicArea: signedArea,
    targetArea: 972,
    westWidth: Math.hypot(wn.x - ws.x, wn.y - ws.y),
    eastWidth: Math.hypot(en.x - es.x, en.y - es.y),
    allOnTarget: CORNERS.every(
      (corner) => fieldModel(placed[corner] as PegSetting, corner).atTarget,
    ),
  };
}

const validMethod = (s: string): s is Method => METHODS.some((m) => m === s);
const validCorner = (s: string): s is Corner => CORNERS.some((m) => m === s);
const validStake = (s: string): s is Stake => s === "mark" || s === "grip";

export function parseField(search: string): { state: FieldState; issue: string | null } {
  const empty = (): FieldState => ({ ...FIELD_DEFAULT, placed: {} });
  const params = new URLSearchParams(search);
  const state = empty();
  try {
    for (const key of ["method", "corner", "grip", "stake", "locus", "placed", "page"])
      if (params.getAll(key).length > 1) throw new Error("duplicate");
    const method = params.get("method") ?? state.method;
    const corner = params.get("corner") ?? state.corner;
    const stake = params.get("stake") ?? state.stake;
    if (!validMethod(method) || !validCorner(corner) || !validStake(stake))
      throw new Error("choice");
    const integer = (raw: string) => {
      if (!/^\d{1,5}$/.test(raw)) throw new Error("number");
      return Number(raw);
    };
    const grip = params.has("grip")
      ? integer(params.get("grip") ?? "")
      : sourcePeg(method, corner).grip;
    fieldModel({ method, grip, stake }, corner);
    const page = params.has("page") ? integer(params.get("page") ?? "") : 9;
    if (!FIELD_PAGES.some((p) => p === page)) throw new Error("page");
    const locus = params.get("locus") ?? "0";
    if (locus !== "0" && locus !== "1") throw new Error("locus");
    const records = params.get("placed") ?? "";
    if (records.length > 250) throw new Error("size");
    for (const record of records ? records.split(";") : []) {
      const parts = record.split(",");
      if (parts.length !== 4) throw new Error("record");
      const [c, m, g, s] = parts as [string, string, string, string];
      if (!validCorner(c) || !validMethod(m) || !validStake(s) || state.placed[c])
        throw new Error("identity");
      const setting = { method: m, grip: integer(g), stake: s };
      fieldModel(setting, c);
      state.placed[c] = setting;
    }
    return {
      state: { ...state, method, corner, grip, stake, locus: locus === "1", page },
      issue: null,
    };
  } catch {
    return {
      state: empty(),
      issue:
        "This link has conflicting, impossible or incomplete cord settings. The starting layout is shown; no partial peg record was restored.",
    };
  }
}

export function serializeField(state: FieldState): string {
  const records = CORNERS.filter((c) => state.placed[c])
    .map((c) => {
      const s = state.placed[c] as PegSetting;
      return [c, s.method, s.grip, s.stake].join(",");
    })
    .join(";");
  return `?${new URLSearchParams({ method: state.method, corner: state.corner, grip: String(state.grip), stake: state.stake, locus: state.locus ? "1" : "0", placed: records, page: String(state.page) })}`;
}

export type FieldModel = ReturnType<typeof fieldModel>;
