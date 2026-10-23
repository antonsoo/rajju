import type { CircleModel, DiagonalModel } from "./core/geometry";
import { number, signed } from "./format";

const dot = (x: number, y: number, label: string, dx = 0, dy = -15) =>
  `<circle cx="${x}" cy="${y}" r="4" class="peg"/><text x="${x + dx}" y="${y + dy}" text-anchor="middle" class="point-label">${label}</text>`;

const dimension = (x1: number, x2: number, y: number, label: string) =>
  `<path d="M${x1},${y - 5}v10m0,-5H${x2}m0,-5v10" class="dimension"/><text x="${(x1 + x2) / 2}" y="${y + 27}" text-anchor="middle">${label}</text>`;

export function circleDrawing(m: CircleModel, step: number, prefix = "plan"): string {
  const cx = 315;
  const cy = 270;
  const scale = 330;
  const half = scale / 2;
  const diagonal = scale / Math.SQRT2;
  const r = scale * m.radiusRatio;
  const east = cx + half;
  const end = cx + diagonal;
  const kept = cx + r;
  const atEdge = m.kept === 0 && step >= 2;
  const atEnd = m.kept === 1 && step >= 2;
  const circleClass = step < 3 ? "preview-circle" : "circle-outline";
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 660 580" role="img" aria-labelledby="${prefix}-title ${prefix}-desc" data-drawing="circle" data-scale="${scale}" data-side-mm="${m.side}">
    <title id="${prefix}-title">The half-diagonal cord swung east, with ${number(m.kept * 100, 6)} percent of its excess retained</title>
    <desc id="${prefix}-desc">Both axes have the same scale. The square side is ${m.side} millimetres. The circle radius is ${number(m.radius, 9)} millimetres. C is the centre, A the corner, E the east edge, H the end of the full half-diagonal cord, and R the retained radius end. Rust hatching marks corners removed; blue hatching marks area added outside the square.</desc>
    <defs>
      <pattern id="${prefix}-lost" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(40)"><path d="M0 0v7" stroke="#a6462c" stroke-width="2"/></pattern>
      <pattern id="${prefix}-gained" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(-40)"><path d="M0 0v7" stroke="#226579" stroke-width="2"/></pattern>
      <mask id="${prefix}-outside-square"><rect width="660" height="580" fill="white"/><rect x="${cx - half}" y="${cy - half}" width="${scale}" height="${scale}" fill="black"/></mask>
      <mask id="${prefix}-outside-circle"><rect width="660" height="580" fill="white"/><circle cx="${cx}" cy="${cy}" r="${r}" fill="black"/></mask>
    </defs>
    <path d="M55,${cy}H610M${cx},35V480" class="axis"/>
    <text x="607" y="${cy - 16}" text-anchor="end" class="direction">EAST</text>
    ${step >= 3 ? `<circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#${prefix}-gained)" mask="url(#${prefix}-outside-square)" class="added-area"/><rect x="${cx - half}" y="${cy - half}" width="${scale}" height="${scale}" fill="url(#${prefix}-lost)" mask="url(#${prefix}-outside-circle)" class="lost-area"/>` : ""}
    <rect x="${cx - half}" y="${cy - half}" width="${scale}" height="${scale}" class="square-outline" data-shape="original-square"/>
    <circle cx="${cx}" cy="${cy}" r="${r}" class="${circleClass}" data-shape="constructed-circle"/>
    <path d="M${cx},${cy}L${east},${cy - half}" class="diagonal-guide"/>
    ${step >= 1 ? `<path d="M${east},${cy - half}A${diagonal},${diagonal} 0 0 1 ${end},${cy}" class="swing"/><path d="M${cx},${cy}H${end}" class="cord-guide"/><path d="M${east},${cy}H${end}" class="excess-cord"/>` : `<path d="M${cx},${cy}L${east},${cy - half}" class="active-cord"/>`}
    ${step >= 2 ? `<path d="M${cx},${cy}H${kept}" class="active-cord"/>${[1, 2].map((n) => `<path d="M${east + ((end - east) * n) / 3},${cy - 7}v14" class="division"/>`).join("")}${dot(kept, cy, atEnd ? "R = H" : atEdge ? "R = E" : "R", 0, 48)}` : ""}
    ${dot(cx, cy, "C", -15, 28)}${dot(east, cy - half, "A", 14, -12)}
    ${step >= 1 ? `${atEdge ? "" : dot(east, cy, "E", 0, -21)}${atEnd ? "" : dot(end, cy, "H", 12, 24)}` : ""}
    ${dimension(cx - half, cx + half, 485, `${number(m.side)} mm · starting side`)}
    <text x="330" y="554" text-anchor="middle" class="caption">Equal horizontal and vertical scales · modern plan</text>
  </svg>`;
}

export function returnDrawing(m: CircleModel, prefix = "return"): string {
  const scale = 190;
  const x = 58;
  const bottom = 255;
  const returned = scale * m.returnedSideRatio;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 350 335" role="img" aria-labelledby="${prefix}-title ${prefix}-desc" data-drawing="return" data-scale="${scale}">
    <title id="${prefix}-title">The returned square compared with the original</title>
    <desc id="${prefix}-desc">The two squares share a lower-left corner. Original side ${m.side} millimetres; returned side ${number(m.returnedSide, 9)} millimetres. The difference is ${signed(m.sideError, 9)} millimetres; at the source settings it is too small to see at this scale.</desc>
    <rect x="${x}" y="${bottom - scale}" width="${scale}" height="${scale}" class="original-reference" data-shape="return-original"/>
    <rect x="${x}" y="${bottom - returned}" width="${returned}" height="${returned}" class="returned-square" data-shape="returned-square"/>
    ${dimension(x, x + returned, 275, `${number(m.returnedSide, 6)} mm`)}
    <text x="175" y="38" text-anchor="middle" class="caption">Same scale · shared lower-left corner</text>
    <text x="175" y="328" text-anchor="middle" class="caption">Dashed: original · solid: returned</text>
  </svg>`;
}

export function errorDrawing(error: number, unit: string, prefix: string): string {
  // This is an explicitly rescaled number line, never a distorted shaft edge.
  const span = Math.max(Math.abs(error) * 1.3, 0.001);
  const x = 300 + (error / span) * 225;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 115" role="img" aria-labelledby="${prefix}-title">
    <title id="${prefix}-title">Magnified error ruler: ${signed(error, 9)} ${unit}. The ruler endpoints are plus and minus ${number(span, 9)} ${unit}.</title>
    <path d="M75,45H525M300,25V65M75,39V51M525,39V51" class="dimension"/>
    <path d="M300,45H${x}" class="active-cord"/><circle cx="${x}" cy="45" r="6" class="peg"/>
    <text x="300" y="87" text-anchor="middle">0</text>
    <text x="75" y="87" text-anchor="middle">−${number(span, 6)}</text><text x="525" y="87" text-anchor="middle">+${number(span, 6)}</text>
    <text x="300" y="111" text-anchor="middle" class="caption">${unit} · enlarged number line · scale changes with the error</text>
  </svg>`;
}

export function diagonalDrawing(m: DiagonalModel, prefix = "diagonal"): string {
  const a = { x: 130, y: 330 };
  const original = 180;
  const t = m.ratioNumber / Math.SQRT2;
  const points = `${a.x},${a.y} ${a.x + original * t},${a.y - original * t} ${a.x + 2 * original * t},${a.y} ${a.x + original * t},${a.y + original * t}`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 660 580" role="img" aria-labelledby="${prefix}-title ${prefix}-desc" data-drawing="diagonal" data-scale="${original}">
    <title id="${prefix}-title">A square on the chosen numerical cord compared with a square on the geometric diagonal</title>
    <desc id="${prefix}-desc">Original square side ${m.side} millimetres. The dashed diamond has exactly twice its area. The solid diamond uses the selected numerical cord, ${number(m.diagonal, 9)} millimetres. These are equal-scale modern comparison drawings.</desc>
    <rect x="130" y="150" width="180" height="180" class="square-outline" data-shape="diagonal-original"/>
    <polygon points="130,330 310,150 490,330 310,510" class="target-square"/>
    <polygon points="${points}" class="numerical-square" data-shape="numerical-square"/>
    <path d="M130,330L310,150" class="diagonal-guide"/>
    <path d="M130,330L${a.x + original * t},${a.y - original * t}" class="active-cord"/>
    ${dot(130, 330, "A", -15, 25)}${dot(310, 150, "B", 18, -14)}
    <text x="220" y="135" text-anchor="middle">Original square</text>
    <text x="447" y="352" text-anchor="middle">Square on the cord</text>
    ${dimension(130, 310, 80, `${number(m.side)} mm`)}
    <text x="330" y="554" text-anchor="middle" class="caption">Dashed: exact double area · solid: selected approximation</text>
  </svg>`;
}

export function stripsDrawing(prefix = "strips"): string {
  const lines = Array.from({ length: 18 }, (_, i) => {
    const p = 50 + i * 12;
    return `<path d="M${p},40V244M50,${40 + i * 12}H254" class="grid-line"/>`;
  }).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 305" role="img" aria-labelledby="${prefix}-title ${prefix}-desc">
    <title id="${prefix}-title">Why a small excess remains after trimming two strips</title>
    <desc id="${prefix}-desc">The left square has 17 by 17 cells. Two cuts of depth 1/34 leave side 17 minus 1/34. The right diagram enlarges only the corner where the two removed strips overlap: that corner was subtracted twice in the intended subtraction of one square unit. The retained area is 288 plus 1/1156 in this twelve-side scaling.</desc>
    <rect x="50" y="40" width="204" height="204" class="square-outline"/>${lines}
    <path d="M253.647,40V244M50,243.647H254" class="cut-line"/>
    <text x="152" y="275" text-anchor="middle">17 × 17 = 289</text>
    <path d="M254,244L365,185" class="swing"/>
    <rect x="390" y="55" width="180" height="150" fill="#fbfcf9" stroke="#173c51"/>
    <path d="M560,55V195H390" fill="none" stroke="#a6462c" stroke-width="20" opacity="0.35"/>
    <rect x="550" y="185" width="20" height="20" fill="#226579"/>
    <text x="480" y="34" text-anchor="middle">Overlap enlarged, not to scale</text>
    <text x="480" y="246" text-anchor="middle">Corner counted twice</text>
    <text x="480" y="275" text-anchor="middle">(1/34)² = 1/1156</text>
  </svg>`;
}
