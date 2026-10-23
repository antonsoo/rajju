import { base64, download, verifiedAsset } from "./assets";
import {
  CORNER_NAMES,
  CORNERS,
  FIELD_PAGES,
  type FieldState,
  fieldGround,
  fieldModel,
  METHOD_NAMES,
  type PegSetting,
  serializeField,
  sourcePeg,
} from "./core/field";
import { FIELD_LIMITS, FIELD_READINGS, FIELD_SOURCE_NOTES } from "./field-content";
import { cordRuler, fieldDrawing } from "./field-drawing";
import ink from "./field-ink.css?inline";
import { escapeHtml as esc, number, signed } from "./format";
import { STUDY_CSS } from "./study";

export function fieldCsvText(state: FieldState): string {
  const rows: string[][] = [
    [
      "scope",
      "corner",
      "method",
      "hold_from_selected_end",
      "stake_from_selected_end",
      "x_east",
      "y_north",
      "distance_from_target",
      "grip_angle_degrees",
      "reference",
    ],
  ];
  const row = (scope: string, corner: FieldState["corner"], setting: PegSetting) => {
    const m = fieldModel(setting, corner);
    rows.push([
      scope,
      corner,
      setting.method,
      String(m.first),
      String(m.mark),
      String(m.peg.x),
      String(m.peg.y),
      String(m.error),
      m.angle === null ? "collinear" : String(m.angle),
      "Length in consistent source units; origin W; positive x east, positive y north. Grip angle is at the baseline end, not the trapezoid corner.",
    ]);
  };
  row("proposed", state.corner, state);
  for (const c of CORNERS) if (state.placed[c]) row("placed", c, state.placed[c]);
  const ground = fieldGround(state.placed);
  rows.push([
    "ground",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    ground.complete && ground.area !== null
      ? `Enclosed area ${ground.area} square source units; prescribed 972; western width ${ground.westWidth}; eastern width ${ground.eastWidth}.`
      : ground.complete
        ? "Area withheld: the boundary crosses or collapses."
        : `Area withheld: ${ground.count} of four pegs placed.`,
  ]);
  const quote = (s: string) => `"${s.replaceAll('"', '""')}"`;
  return `${rows.map((r) => r.map(quote).join(",")).join("\r\n")}\r\n`;
}

export function fieldCsvDownload(state: FieldState): void {
  download(
    new Blob([fieldCsvText(state)], { type: "text/csv;charset=utf-8" }),
    "rajju-field-pegs.csv",
  );
}

export async function fieldStudyDownload(state: FieldState): Promise<void> {
  const paths = [
    ...FIELD_PAGES.map((p) => `sources/thibaut-${String(p).padStart(2, "0")}.jpg`),
    "fonts/Newsreader.ttf",
    "fonts/NotoSerifDevanagari.ttf",
    "fonts/IBMPlexSans-Regular.woff2",
    "fonts/newsreader-OFL.txt",
    "fonts/notoserifdevanagari-OFL.txt",
    "fonts/IBMPlex-OFL.txt",
  ];
  const assets = new Map(
    await Promise.all(paths.map(async (path) => [path, await verifiedAsset(path)] as const)),
  );
  const data = (path: string, mime: string) => {
    const bytes = assets.get(path);
    if (!bytes) throw new Error(`The field reading is missing ${path}.`);
    return `data:${mime};base64,${base64(bytes)}`;
  };
  const fonts = [
    ["Plex", "IBMPlexSans-Regular.woff2", "font/woff2"],
    ["Newsreader", "Newsreader.ttf", "font/ttf"],
    ["Devanagari", "NotoSerifDevanagari.ttf", "font/ttf"],
  ]
    .map(
      ([family, file, mime]) =>
        `@font-face{font-family:${family};src:url('${data(`fonts/${file}`, mime ?? "font/ttf")}');font-weight:100 900}`,
    )
    .join("");
  const m = fieldModel(state, state.corner);
  const ground = fieldGround(state.placed);
  const verdict = !ground.complete
    ? `${ground.count} of four pegs placed. No area is assigned to an incomplete boundary.`
    : ground.area === null
      ? "The boundary crosses or collapses. No simple enclosed-ground area is assigned."
      : `The enclosed area is ${number(ground.area, 9)} square source units, ${signed((ground.area / 972 - 1) * 100, 9)}% against the prescribed 972. The western width is ${number(ground.westWidth, 9)}; the eastern width is ${number(ground.eastWidth, 9)}.`;
  const table = CORNERS.map((c) => {
    const setting = state.placed[c];
    const p = setting ? fieldModel(setting, c) : null;
    return `<tr><th scope="row">${CORNER_NAMES[c]}</th><td>${setting && p ? `${METHOD_NAMES[setting.method]}<br>Hold ${number(p.first, 2)}, stake ${number(p.mark, 2)}` : "Not placed"}</td><td>${p ? `(${number(p.peg.x, 9)}, ${number(p.peg.y, 9)})` : "—"}</td><td>${p ? number(p.error, 9) : "—"}</td></tr>`;
  }).join("");
  const readings = FIELD_READINGS.map(
    (p) =>
      `<section class="reading-passage"><p class="sanskrit" lang="sa">${p.devanagari}</p><p class="iast" lang="sa-Latn">${p.iast}</p><p>${p.english}</p><p class="small">${p.note}</p></section>`,
  ).join("");
  const scans = FIELD_PAGES.map(
    (p) =>
      `<figure class="source-page"><h3>Thibaut, printed p. ${p} · PDF page ${p + 6}</h3><img src="${data(`sources/thibaut-${String(p).padStart(2, "0")}.jpg`, "image/jpeg")}" alt="Complete printed source page ${p}" width="1430" height="2000"><figcaption>${FIELD_SOURCE_NOTES[p]}</figcaption></figure>`,
  ).join("");
  const licenses = paths
    .filter((p) => p.endsWith("OFL.txt"))
    .map((p) => `<h3>${esc(p)}</h3><pre>${esc(new TextDecoder().decode(assets.get(p)))}</pre>`)
    .join("");
  const link = new URL(location.href);
  link.search = serializeField(state);
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; img-src data:; font-src data:; base-uri 'none'; form-action 'none'"><title>Rajju — Hold fifteen. Stake twelve.</title><style>${fonts}${STUDY_CSS}${ink}.field-plate{max-width:650px}.tag{font-size:12px}.point-label{font-size:15px}@media print{.field-plate{max-width:145mm;break-inside:avoid}.source-page img{max-height:232mm}}</style></head><body><header><p>RAJJU · <span lang="sa">रज्जु</span> · geometry by the cord</p><h1>Hold fifteen. Stake twelve.</h1><p>Āpastamba’s ground: 36 units eastward, 30 wide at the west and 24 at the east. Source units are used consistently; no conversion to a modern physical length is inferred.</p><p class="small">Edition ${esc(__RAJJU_EDITION__)}. <a href="${esc(link.href)}">Open this retained layout online</a>. This file needs no network to read or print.</p></header><main><section><h2>The proposed ${CORNER_NAMES[state.corner].toLowerCase()} peg</h2><p>${METHOD_NAMES[state.method]}. Fix the cord at ${m.west ? "W" : "E"} and ${m.baseline} units inward. Cord length ${m.loop}. Hold at ${number(m.first, 2)}; stake at ${number(m.mark, 2)}. These distances are measured along the cord from the selected end.</p><div class="plate field-plate">${fieldDrawing(state, "saved-field")}</div><p>The rust ring proposes a peg; the dark dot is the grip. Blue dots retain placed pegs. Dashed outline: prescribed ground.${state.locus ? " The dotted ellipse shows all taut grip positions; this is modern analysis." : ""}</p><p>Proposed position (${number(m.peg.x, 9)}, ${number(m.peg.y, 9)}); target (${m.target.x}, ${m.target.y}). Distance from target ${number(m.error, 9)}. Grip-to-baseline angle ${m.angle === null ? "is collinear; there is no right angle" : `is ${number(m.angle, 9)}°`}. The angle is measured at the centre-line end, not at a sloping corner of the final trapezoid.</p><div class="ruler">${cordRuler(state, "saved-unbent")}</div><p>In the eastern one-cord operation, a grip at fifteen establishes the perpendicular. The corner peg goes at twelve on the same piece of cord. Putting the peg at the grip gives an eastern width of thirty, while the prescribed width is twenty-four.</p></section><section><h2>The pegs you retained</h2><p>${verdict}</p><table><thead><tr><th>Corner</th><th>Method and cord marks</th><th>Position (east, north)</th><th>Distance from target</th></tr></thead><tbody>${table}</tbody></table><p>Changing the proposed grip does not move an already placed peg. Each placed peg retains its own method, grip and stake choice. Coordinates are recomputed from those choices.</p><p class="download-link"><a download="rajju-field-pegs.csv" href="data:text/csv;charset=utf-8,${esc(encodeURIComponent(fieldCsvText(state)))}">Save these exact CSV bytes</a></p></section><section><h2>Read the instructions</h2><p>The western corners are śroṇī, haunches; the eastern ones aṃsa, shoulders. The following excerpts are from printed p. 9, with normalized Unicode, spacing and punctuation. Brackets show supplied English.</p>${readings}</section><section><h2>Sources and limits</h2><p>${FIELD_LIMITS}</p><p>George Thibaut, <cite>The Śulvasūtras</cite> (1875), pp. 9–12. <a href="https://archive.org/details/ulvastras00ktgoog">Complete source volume</a>. The printed direction discrepancy on p. 10 is retained in the page note. The optional modern ellipse and coordinate calculations do not establish the original derivation.</p><p>The four JPEGs, fonts and font licenses were checked against the edition’s SHA-256 identities before saving. Historical source print is public domain; new drawings, English notes and code are MIT, Anton Soloviev, 2026.</p></section>${scans}<details class="licenses"><summary>Embedded font licenses</summary>${licenses}</details></main></body></html>`;
  download(new Blob([html], { type: "text/html;charset=utf-8" }), "rajju-field-reading.html");
}

export function fieldTemplateText(state: FieldState): string {
  const canonical = sourcePeg(state.method, state.corner);
  const m = fieldModel(canonical, state.corner);
  const x = (v: number) => 70 + v * 10;
  const y = (v: number) => 210 - v * 10;
  const xy = (a: number, b: number) => `${x(a)},${y(b)}`;
  const peg = (a: number, b: number, name: string, dy = -12) =>
    `<circle cx="${x(a)}" cy="${y(b)}" r="3"/><text x="${x(a)}" y="${y(b) + dy}" text-anchor="middle">${name}</text>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="186mm" height="180mm" viewBox="0 0 620 600" role="img" aria-labelledby="template-title template-desc"><title id="template-title">Rajju paper exercise: ${METHOD_NAMES[state.method]}, ${CORNER_NAMES[state.corner]}</title><desc id="template-desc">Source procedure restored. One source unit is a chosen three millimetres on this paper. The centre line should measure 108 millimetres. The calibration bar should measure 30 millimetres. Print at actual size, 100 percent, without fitting to page. This is a modern activity, not an ancient unit conversion.</desc><style>text{font-family:serif;font-size:12px;fill:#173c51}path,polygon,line{fill:none;stroke:#173c51;stroke-width:1}circle{fill:#173c51}.note{font-size:10px}.cord{stroke:#a6462c;stroke-width:2}.mark{fill:white;stroke:#a6462c;stroke-width:2}</style><text x="35" y="22" style="font-size:17px">RAJJU · ${METHOD_NAMES[state.method]} · ${CORNER_NAMES[state.corner]}</text><text x="35" y="40" class="note">Source method restored · 1 chosen paper unit = 3 mm · Thibaut 1875, pp. 9–12</text><polygon points="${xy(0, 15)} ${xy(36, 12)} ${xy(36, -12)} ${xy(0, -15)}" stroke-dasharray="4 4"/><path d="M${xy(0, 0)}H${x(36)}" stroke-dasharray="2 3"/><path d="M${xy(m.anchor, 0)}L${xy(m.gripPoint.x, m.gripPoint.y)}L${xy(m.auxiliary, 0)}" class="cord"/>
${peg(0, 0, "W", 18)}${peg(36, 0, "E", 18)}${m.auxiliary !== 0 && m.auxiliary !== 36 ? peg(m.auxiliary, 0, "P", -12) : ""}${peg(0, 15, "WN")}${peg(0, -15, "WS", 18)}${peg(36, 12, "EN")}${peg(36, -12, "ES", 18)}<circle cx="${x(m.peg.x)}" cy="${y(m.peg.y)}" r="6" class="mark"/>
<text x="${x(18)}" y="395" text-anchor="middle">Centre line 36 units = 108 mm on this paper</text><text x="35" y="420">Fix at ${m.west ? "W" : "E"} and ${m.baseline} units inward. Hold at ${m.sourceGrip}; stake at ${m.targetHalfWidth}.</text><path d="M70,465H${x(m.loop)}" class="cord" data-template="cord"/><path d="M70,457v16m${m.loop * 10},-16v16"/><circle cx="${x(m.sourceGrip)}" cy="465" r="3"/><circle cx="${x(m.targetHalfWidth)}" cy="465" r="6" class="mark"/><text x="${x(m.sourceGrip)}" y="447" text-anchor="middle">Hold ${m.sourceGrip}</text><text x="${x(m.targetHalfWidth)}" y="493" text-anchor="middle">Stake ${m.targetHalfWidth}</text><text x="70" y="493" text-anchor="middle">0</text><text x="${x(m.loop)}" y="493" text-anchor="middle">${m.loop}</text><text x="35" y="518" class="note">Unbent cord: ${m.loop} units = ${m.loop * 3} mm. Measure every mark from the selected end.</text><path d="M70,550H170m-100,-5v10m100,-10v10" data-template="calibration"/><text x="190" y="554">This bar must measure 30 mm.</text><text x="35" y="580" class="note">Print at actual size (100%). Check the bar before using string. A4 portrait; no fit-to-page.</text><text x="35" y="595" class="note">antonsoo.github.io/rajju/field.html · New drawing MIT · Not an ancient-unit conversion.</text></svg>`;
}

export function fieldTemplateDownload(state: FieldState): void {
  download(
    new Blob([fieldTemplateText(state)], { type: "image/svg+xml;charset=utf-8" }),
    "rajju-paper-cord.svg",
  );
}
