import { type CordErrorModel, compareCordErrors } from "./core/cord-errors";
import { CORNER_NAMES, type FieldState, METHOD_NAMES } from "./core/field";
import { number, signed } from "./format";

export const CORD_ERROR_ASSUMPTIONS =
  "Modern sensitivity experiment. Each row starts from its source recipe, independently of the separately proposed and placed pegs. Both anchors stay exact. Add the same signed length errors to each recipe’s near and return segments. Stake the grip except in the eastern one-cord procedure, where the separate twelve mark stays exact. A positive error makes a segment longer. These are chosen errors, not measurements of ancient cords, a probability distribution or a ranking of historical practice.";

export const CORD_ERROR_KEY = "○ One cord · □ 3–4–5 · △ 5–12–13 · ◇ 8–15–17 / 12–35–37";

export function cordErrorsIntro(state: FieldState): string {
  return `${CORNER_NAMES[state.corner]} corner. Near-segment error ${signed(state.nearError / 100, 2)}; return-segment error ${signed(state.farError / 100, 2)} source units. The differences below are measured from this corner’s prescribed peg.`;
}

export function cordErrorsTable(models: CordErrorModel[]): string {
  return `<table><caption>Four source recipes under the same two chosen errors. Lengths and misses are in source units; displayed decimals are rounded.</caption><thead><tr><th scope="col">Procedure</th><th scope="col">Baseline</th><th scope="col">Near + return<br>prescribed → actual</th><th scope="col">Peg offset<br>east, north</th><th scope="col">Distance<br>from target</th><th scope="col">Grip angle<br>at baseline end</th></tr></thead><tbody>${models.map((m, i) => `<tr data-error-method="${m.method}"><th scope="row">${i + 1}. ${METHOD_NAMES[m.method]}${m.separateMark ? "<small>Exact twelve mark; grip at fifteen before errors</small>" : "<small>Stake the grip</small>"}</th><td>${m.baseline}</td><td>${m.prescribedNear} + ${m.prescribedFar}<br>${number(m.actualNear, 2)} + ${number(m.actualFar, 2)}</td>${m.kind === "unreachable" ? '<td colspan="3">Cannot reach both anchors: the two circles do not meet.</td>' : `<td>${signed(m.dx, 6)}, ${signed(m.dy, 6)}</td><td>${number(m.miss, 6)}</td><td>${m.angle === null ? "Collinear; no right angle" : `${number(m.angle, 6)}°`}</td>`}</tr>`).join("")}</tbody></table>`;
}

export function cordErrorsDrawing(models: CordErrorModel[], id = "cord-error-plot"): string {
  const reachable = models.filter((m) => m.kind !== "unreachable");
  // The microscope zoom is bounded and explicitly labelled; both axes share it.
  const largest = Math.max(0.05, ...reachable.flatMap((m) => [Math.abs(m.dx), Math.abs(m.dy)]));
  const extent =
    10 ** Math.floor(Math.log10(largest)) *
    Math.ceil(largest / 10 ** Math.floor(Math.log10(largest)));
  const scale = 155 / extent;
  const x = (v: number) => 240 + v * scale;
  const y = (v: number) => 220 - v * scale;
  const symbols = (m: CordErrorModel, i: number) => {
    if (m.kind === "unreachable") return "";
    const px = x(m.dx);
    const py = y(m.dy);
    const shapes = [
      `<circle cx="${px}" cy="${py}" r="7"/>`,
      `<rect x="${px - 7}" y="${py - 7}" width="14" height="14"/>`,
      `<path d="M${px},${py - 9}l8,15h-16Z"/>`,
      `<path d="M${px},${py - 10}l9,10l-9,10l-9,-10Z"/>`,
    ];
    return `<g class="error-symbol error-symbol-${i}" data-method="${m.method}" data-dx="${m.dx}" data-dy="${m.dy}" data-miss="${m.miss}"><title>${i + 1}. ${METHOD_NAMES[m.method]}: ${number(m.miss, 6)} source units from target${m.kind === "collinear" ? "; collinear" : ""}</title><path class="error-leader" d="M240,220L${px},${py}"/>${shapes[i]}</g>`;
  };
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 450" class="cord-error-plot" role="img" aria-labelledby="${id}-title ${id}-desc" data-scale="${scale}" data-origin-x="240" data-origin-y="220"><title id="${id}-title">Peg displacements from one shared target</title><desc id="${id}-desc">Displacements only, not the ground plan. East is right; north is up. Equal axis scales; centre to each outer guide is ${number(extent, 6)} source units. Circle: one cord; square: 3–4–5; triangle: 5–12–13; diamond: 8–15–17 or 12–35–37. Coincident symbols can overlap. Read each individual result in the comparison table. Unreachable procedures have no symbol.</desc><rect x="85" y="65" width="310" height="310" class="error-boundary"/><path d="M85,220H395M240,65V375" class="error-axis"/><path d="M230,220h20M240,210v20" class="error-target"/><text x="240" y="30" text-anchor="middle">North</text><text x="425" y="225" text-anchor="middle">East</text><text x="240" y="411" text-anchor="middle">Centre to guide: ${number(extent, 6)} units</text><text x="240" y="436" text-anchor="middle">Magnified offsets · equal scales</text>${models.map(symbols).join("")}</svg>`;
}

export function cordErrorVerdict(models: CordErrorModel[]): string {
  const reachable = models.filter((m) => m.kind !== "unreachable");
  if (reachable.length === models.length && reachable.every((m) => m.miss < 1e-10))
    return "With exact lengths, all four procedures reach the same prescribed peg. Add an error to separate them.";
  return `${reachable.length} of four procedures can reach both anchors. ${models.filter((m) => m.kind === "collinear").length} are collinear. The same length errors need not produce the same peg displacement. Overlapping symbols are possible; the table keeps every result.`;
}

export function cordErrorsCsv(state: FieldState): string {
  const quote = (s: unknown) => `"${String(s).replaceAll('"', '""')}"`;
  const header = [
    "model",
    "corner",
    "method",
    "near_error",
    "return_error",
    "baseline",
    "prescribed_near",
    "prescribed_return",
    "actual_near",
    "actual_return",
    "status",
    "peg_x_east",
    "peg_y_north",
    "dx_east",
    "dy_north",
    "miss",
    "grip_angle_degrees",
    "separate_exact_twelve_mark",
    "assumptions",
  ];
  return `${[
    header,
    ...compareCordErrors(state.corner, state).map((m) => [
      "modern_segment_errors",
      state.corner,
      m.method,
      m.nearError / 100,
      m.farError / 100,
      m.baseline,
      m.prescribedNear,
      m.prescribedFar,
      m.actualNear,
      m.actualFar,
      m.kind,
      m.peg?.x ?? "",
      m.peg?.y ?? "",
      m.kind === "unreachable" ? "" : m.dx,
      m.kind === "unreachable" ? "" : m.dy,
      m.kind === "unreachable" ? "" : m.miss,
      m.kind === "unreachable" || m.angle === null ? "" : m.angle,
      m.separateMark,
      CORD_ERROR_ASSUMPTIONS,
    ]),
  ]
    .map((r) => r.map(quote).join(","))
    .join("\r\n")}\r\n`;
}

export function cordErrorsStudy(state: FieldState): string {
  const models = compareCordErrors(state.corner, state);
  return `<section class="cord-error-study"><h2>Same error. Different miss.</h2><p>${cordErrorsIntro(state)}</p><p>${CORD_ERROR_ASSUMPTIONS}</p>${cordErrorsDrawing(models, "saved-error-plot")}<p class="error-symbol-key">${CORD_ERROR_KEY}</p><p>Centre cross: prescribed peg. Only displacements are magnified; the scale is shown on the plot.</p><p>${cordErrorVerdict(models)}</p><div class="table-scroll" tabindex="0" role="region" aria-label="Cord error comparison; scroll horizontally">${cordErrorsTable(models)}</div><p><a download="rajju-cord-errors.csv" href="data:text/csv;charset=utf-8,${encodeURIComponent(cordErrorsCsv(state))}">Save the segment-error CSV</a></p></section>`;
}
