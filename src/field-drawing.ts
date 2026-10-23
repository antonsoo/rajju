import { CORNER_NAMES, CORNERS, type FieldState, fieldGround, fieldModel } from "./core/field";
import { number } from "./format";

export const FIELD_SCALE = 10;
const X = (x: number) => 160 + x * FIELD_SCALE;
const Y = (y: number) => 300 - y * FIELD_SCALE;
const point = (x: number, y: number) => `${X(x)},${Y(y)}`;

export function fieldDrawing(state: FieldState, prefix = "field"): string {
  const m = fieldModel(state, state.corner);
  const ground = fieldGround(state.placed);
  const grip = point(m.gripPoint.x, m.gripPoint.y);
  const peg = point(m.peg.x, m.peg.y);
  const target = point(m.target.x, m.target.y);
  const ellipseA = m.loop / 2;
  const ellipseB = Math.sqrt(ellipseA ** 2 - (m.baseline / 2) ** 2);
  const placed = CORNERS.filter((c) => state.placed[c])
    .map((c) => {
      const p = fieldModel(state.placed[c] as NonNullable<FieldState["placed"][typeof c]>, c).peg;
      return `<circle cx="${X(p.x)}" cy="${Y(p.y)}" r="6" class="placed-peg" data-placed-corner="${c}"/><text x="${X(p.x) + (c[0] === "w" ? -14 : 14)}" y="${Y(p.y) + (c[1] === "n" ? -15 : 25)}" text-anchor="${c[0] === "w" ? "end" : "start"}" class="point-label">${c.toUpperCase()}</text>`;
    })
    .join("");
  const marks = [12, 15]
    .map((mark) => {
      const t = mark <= m.first ? mark / m.first : (mark - m.first) / m.second;
      const x =
        mark <= m.first
          ? m.anchor + (m.gripPoint.x - m.anchor) * t
          : m.gripPoint.x + (m.auxiliary - m.gripPoint.x) * t;
      const y = mark <= m.first ? m.gripPoint.y * t : m.gripPoint.y * (1 - t);
      const labelX =
        mark === 12 ? Math.min(X(x), X(m.gripPoint.x)) - 22 : Math.max(X(x), X(m.gripPoint.x)) + 22;
      const labelY = Y(y) + (mark === 12 ? 22 : -20);
      return `<circle cx="${X(x)}" cy="${Y(y)}" r="4" class="cord-mark"/><path d="M${X(x)},${Y(y)}L${labelX + (mark === 12 ? 5 : -5)},${labelY - 5}" class="mark-leader"/><text x="${labelX}" y="${labelY}" text-anchor="${mark === 12 ? "end" : "start"}" class="mark-label">${mark}</text>`;
    })
    .join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 740 625" role="img" aria-labelledby="${prefix}-title ${prefix}-desc" data-drawing="field" data-scale="${FIELD_SCALE}" data-origin-x="160" data-origin-y="300">
    <title id="${prefix}-title">Taut cord for the ${CORNER_NAMES[state.corner].toLowerCase()} peg</title>
    <desc id="${prefix}-desc">The centre line runs 36 units east from W to E. The prescribed west and east widths are 30 and 24. The cord is ${m.loop} units long, held ${number(m.first, 2)} units from the selected end. The grip and the stake mark are distinct. The current peg is at ${number(m.peg.x, 8)}, ${number(m.peg.y, 8)}. Both axes use the same scale. North is upward.</desc>
    <path d="M${point(-11, 0)}L${point(48, 0)}" class="axis"/>
    <text x="${X(48)}" y="${Y(0) - 13}" text-anchor="end" class="direction">EAST</text>
    <text x="${X(-10)}" y="${Y(22)}" class="direction">NORTH ↑</text>
    <polygon points="${point(0, 15)} ${point(36, 12)} ${point(36, -12)} ${point(0, -15)}" class="target-ground"/>
    ${ground.complete ? `<polygon points="${ground.polygon.map((p) => point(p.x, p.y)).join(" ")}" class="measured-ground"/>` : ""}
    ${state.locus ? `<ellipse cx="${X((m.anchor + m.auxiliary) / 2)}" cy="${Y(0)}" rx="${ellipseA * FIELD_SCALE}" ry="${ellipseB * FIELD_SCALE}" class="grip-locus"/>` : ""}
    <path d="M${point(m.anchor, 0)}L${grip}L${point(m.auxiliary, 0)}" class="field-cord" data-shape="taut-cord"/>
    ${m.angle !== null && Math.abs(m.angle - 90) < 1e-8 ? `<path d="M${point(m.anchor + m.direction * 1.5, 0)}L${point(m.anchor + m.direction * 1.5, m.side * 1.5)}L${point(m.anchor, m.side * 1.5)}" class="dimension"/>` : ""}
    ${state.method === "one" ? marks : ""}
    <path d="M${target}L${peg}" class="peg-error"/>
    <circle cx="${X(m.gripPoint.x)}" cy="${Y(m.gripPoint.y)}" r="7" class="held-point" data-shape="grip"/>
    <circle cx="${X(m.peg.x)}" cy="${Y(m.peg.y)}" r="10" class="proposed-peg" data-shape="proposed-peg"/>
    ${placed}
    <circle cx="${X(0)}" cy="${Y(0)}" r="6" class="fixed-peg"/><text x="${X(0) - 13}" y="${Y(0) + 25}" class="point-label">W</text>
    <circle cx="${X(36)}" cy="${Y(0)}" r="6" class="fixed-peg"/><text x="${X(36) + 9}" y="${Y(0) + 25}" class="point-label">E</text>
    ${m.auxiliary !== 0 && m.auxiliary !== 36 ? `<circle cx="${X(m.auxiliary)}" cy="${Y(0)}" r="5" class="auxiliary-peg"/><text x="${X(m.auxiliary)}" y="${Y(0) - 15}" text-anchor="middle" class="point-label">P</text>` : ""}
    <path d="M${X(0)},${Y(-23)}v10m0,-5H${X(36)}m0,-5v10" class="dimension"/>
    <text x="${X(18)}" y="${Y(-23) + 28}" text-anchor="middle">36 source units · centre line</text>
    <text x="370" y="605" text-anchor="middle" class="caption">Dashed outline: prescribed ground · rings: proposed peg · dots: placed pegs</text>
  </svg>`;
}

export function cordRuler(state: FieldState, prefix = "cord-ruler"): string {
  const m = fieldModel(state, state.corner);
  const start = 50;
  const end = 650;
  const x = (n: number) => start + (n / m.loop) * (end - start);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 700 135" role="img" aria-labelledby="${prefix}-title"><title id="${prefix}-title">Unbent cord of length ${m.loop}; grip at ${number(m.first, 2)}, stake mark at ${number(m.mark, 2)}</title>
    <path d="M${start},60H${end}" class="cord-guide"/><path d="M${start},60H${x(m.first)}" class="active-cord"/>
    ${[0, m.loop].map((v) => `<path d="M${x(v)},50v20" class="dimension"/><text x="${x(v)}" y="96" text-anchor="middle">${v}</text>`).join("")}
    <circle cx="${x(m.first)}" cy="60" r="7" class="held-point"/><text x="${x(m.first)}" y="25" text-anchor="middle">Hold at ${number(m.first, 2)}</text>
    <circle cx="${x(m.mark)}" cy="60" r="10" class="proposed-peg"/><text x="${x(m.mark)}" y="101" text-anchor="middle">Stake at ${number(m.mark, 2)}</text>
    <text x="350" y="130" text-anchor="middle" class="caption">Distance measured from the selected end of the cord</text></svg>`;
}
