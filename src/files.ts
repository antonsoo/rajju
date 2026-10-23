import { base64, download, verifiedAsset } from "./assets";
import { DIAGONAL_STEPS, LIMITATIONS, PASSAGES, SOURCE_NOTES, SOURCE_URL } from "./content";
import { asText } from "./core/fraction";
import { circleModel, diagonalModel } from "./core/geometry";
import { SOURCE_PAGES, type State, serializeState } from "./core/state";
import {
  circleDrawing,
  diagonalDrawing,
  errorDrawing,
  returnDrawing,
  stripsDrawing,
} from "./drawing";
import { escapeHtml as esc, number, signed } from "./format";
import { STUDY_CSS } from "./study";

export function measurements(state: State): string[][] {
  const rows = [
    ["selection", "lesson", state.lesson, "", "Selected lesson"],
    ["selection", "side", String(state.side), "mm", "Modern illustrative scale"],
  ];
  if (state.lesson === "circle") {
    const m = circleModel(state.side, state.rule, state.kept, state.returnRule);
    rows.push(
      [
        "selection",
        "circle_rule",
        state.rule,
        "",
        state.rule === "third" ? "Source rule" : "Modern comparison",
      ],
      ["selection", "return_rule", state.returnRule, "", "Source rule"],
      [
        "circle",
        "kept_excess_fraction",
        String(m.kept),
        "ratio",
        state.rule === "third" ? "Exactly 1/3; decimal rounded" : "Chosen comparison",
      ],
      ["circle", "half_diagonal", String(m.halfDiagonal), "mm", "Geometric diagonal, not 577/408"],
      ["circle", "excess", String(m.excess), "mm", "Half diagonal minus half side"],
      ["circle", "radius", String(m.radius), "mm", "Half side plus kept excess"],
      ["circle", "diameter", String(m.diameter), "mm", "Twice radius"],
      ["circle", "original_area", String(m.originalArea), "mm^2", "Starting square"],
      ["circle", "circle_area", String(m.circleArea), "mm^2", "Pi times radius squared"],
      ["circle", "lost_area", String(m.lostArea), "mm^2", "Square outside circle"],
      ["circle", "gained_area", String(m.gainedArea), "mm^2", "Circle outside square"],
      [
        "circle",
        "area_error_percent",
        String(m.circleErrorPercent),
        "%",
        "Circle versus starting square",
      ],
      [
        "return",
        "factor",
        asText(m.returnFactor),
        "exact ratio",
        "Returned side divided by circle diameter",
      ],
      ["return", "side", String(m.returnedSide), "mm", "Diameter times return factor"],
      ["return", "area", String(m.returnedArea), "mm^2", "Returned square"],
      ["return", "side_error", String(m.sideError), "mm", "Returned side minus starting side"],
      [
        "return",
        "area_error_percent",
        String(m.returnErrorPercent),
        "%",
        "Returned square versus starting square",
      ],
      [
        "return",
        "circle_area_error_percent",
        String(m.returnErrorFromCirclePercent),
        "%",
        "Returned square versus intermediate circle",
      ],
    );
  } else {
    const d = diagonalModel(state.side, state.stage);
    rows.push(
      [
        "selection",
        "stage",
        String(state.stage),
        "",
        DIAGONAL_STEPS[state.stage]?.expression ?? "",
      ],
      [
        "diagonal",
        "ratio",
        asText(d.ratio),
        "exact ratio",
        "Numerical cord divided by starting side",
      ],
      ["diagonal", "numerical_length", String(d.diagonal), "mm", "Side times rational ratio"],
      ["diagonal", "geometric_length", String(d.geometricDiagonal), "mm", "Side times sqrt(2)"],
      ["diagonal", "length_error", String(d.lengthError), "mm", "Numerical minus geometric length"],
      [
        "diagonal",
        "area_ratio",
        asText(d.area),
        "exact ratio",
        "Square on cord divided by original square",
      ],
      [
        "diagonal",
        "area_error_ratio",
        asText(d.areaError),
        "exact ratio",
        "Excess divided by original square",
      ],
      [
        "diagonal",
        "relative_area_error",
        asText(d.relativeAreaError),
        "exact ratio",
        "Excess divided by target double area",
      ],
      [
        "diagonal",
        "area_error_ppm",
        String(d.areaErrorPpm),
        "ppm",
        "Excess divided by target double area",
      ],
    );
  }
  return rows;
}

export function csvText(state: State): string {
  const quote = (s: string) => `"${s.replaceAll('"', '""')}"`;
  return `${[["scope", "quantity", "value", "unit", "reference"], ...measurements(state)]
    .map((row) => row.map(quote).join(","))
    .join("\r\n")}\r\n`;
}

export function downloadCsv(state: State): void {
  download(
    new Blob([csvText(state)], { type: "text/csv;charset=utf-8" }),
    `rajju-${state.lesson}-measurements.csv`,
  );
}

export async function saveStudy(state: State): Promise<void> {
  const assets = [
    ...SOURCE_PAGES.map((p) => `sources/thibaut-${String(p).padStart(2, "0")}.jpg`),
    "fonts/Newsreader.ttf",
    "fonts/NotoSerifDevanagari.ttf",
    "fonts/IBMPlexSans-Regular.woff2",
    "fonts/newsreader-OFL.txt",
    "fonts/notoserifdevanagari-OFL.txt",
    "fonts/IBMPlex-OFL.txt",
  ];
  const bytes = new Map(
    await Promise.all(assets.map(async (path) => [path, await verifiedAsset(path)] as const)),
  );
  const data = (path: string, mime: string) => {
    const value = bytes.get(path);
    if (!value) throw new Error(`The reading is missing ${path}.`);
    return `data:${mime};base64,${base64(value)}`;
  };
  const fonts = [
    ["Newsreader", "Newsreader.ttf", "truetype", "font/ttf"],
    ["Devanagari", "NotoSerifDevanagari.ttf", "truetype", "font/ttf"],
    ["Plex", "IBMPlexSans-Regular.woff2", "woff2", "font/woff2"],
  ]
    .map(
      ([family, file, format, mime]) =>
        `@font-face{font-family:${family};src:url('${data(`fonts/${file}`, mime ?? "font/ttf")}') format('${format}');font-weight:100 900}`,
    )
    .join("\n");
  const m = circleModel(state.side, state.rule, state.kept, state.returnRule);
  const d = diagonalModel(state.side, state.stage);
  const circle = state.lesson === "circle";
  const title = circle
    ? "A circle too large. A return almost perfect."
    : "A diagonal in four instructions.";
  const construction = circle
    ? `<p>Radius rule: <strong>${state.rule === "third" ? "source third" : state.rule === "equal" ? "modern equal-area comparison" : `modern experiment, ${state.kept}/1000 of excess`}</strong>. Selected construction step: ${state.step + 1} of 4. The area measurements below describe the completed circle even if an earlier step is selected.</p><div class="plate">${circleDrawing(m, state.step, "saved-circle")}</div><p class="equation">Radius = ${number(state.side / 2)} + ${state.rule === "third" ? "1/3" : number(m.kept, 9)} × ${number(m.excess, 9)} = ${number(m.radius, 9)} mm.</p><p>Circle versus starting square: <strong>${signed(m.circleErrorPercent, 9)}%</strong>. Corners removed: ${number(m.lostArea, 6)} mm²; bulges added: ${number(m.gainedArea, 6)} mm².</p><h2>Return the circle to a square</h2><p>The ${state.returnRule} source rule retains ${asText(m.returnFactor)} of the circle’s diameter.</p><div class="plate return">${returnDrawing(m, "saved-return")}</div><p>Returned square versus starting square: <strong>${signed(m.returnErrorPercent, 9)}%</strong>. Returned square versus intermediate circle: <strong>${signed(m.returnErrorFromCirclePercent, 9)}%</strong>. A close return does not establish equal areas at each step.</p><p>The returned side differs by ${signed(m.sideError, 9)} mm. The following number line enlarges the error; the construction drawings retain equal axis scales.</p><div class="ruler">${errorDrawing(m.sideError, "mm", "saved-error")}</div>`
    : `<p>Selected stage ${state.stage + 1} of 4: ${DIAGONAL_STEPS[state.stage]?.title}.</p><p class="equation">${DIAGONAL_STEPS[state.stage]?.expression} = ${asText(d.ratio)}</p><div class="plate">${diagonalDrawing(d, "saved-diagonal")}</div><p>Numerical cord: ${number(d.diagonal, 9)} mm. Geometric diagonal: ${number(d.geometricDiagonal, 9)} mm. Difference: ${signed(d.lengthError, 9)} mm.</p><div class="ruler">${errorDrawing(d.lengthError, "mm", "saved-error")}</div><p>Excess of the square on the cord, divided by the original area: ${asText(d.areaError)}. Divided by the target double area: ${asText(d.relativeAreaError)}, or ${signed(d.areaErrorPpm, 9)} parts per million.</p><h2>The corner that remains</h2>${stripsDrawing("saved-strips")}<p>Thibaut’s pp. 14–15 propose trimming 1/34 from two sides of a 17 × 17 square to approach 288. The two strips overlap in a corner of area 1/1156. Divide the lengths by 12 to recover the final cord 577/408 and its square’s excess 1/166464. This explanation is not a derivation stated in the ancient rule; it illustrates the final stage, independently of the selected stage above.</p>`;
  const csv = csvText(state);
  const table = measurements(state)
    .map(
      (row) =>
        `<tr><th scope="row">${esc(`${row[0]} · ${row[1]}`)}</th><td>${esc(row[2])}</td><td>${esc(row[3])}</td><td>${esc(row[4])}</td></tr>`,
    )
    .join("");
  const readings = Object.values(PASSAGES)
    .map(
      (p) =>
        `<section class="reading-passage"><h3>${p.title}</h3><p class="small">${p.reference}</p><p class="sanskrit" lang="sa">${p.devanagari}</p><p class="iast" lang="sa-Latn">${p.iast}</p><p>${p.english}</p><p class="small">${p.note}</p></section>`,
    )
    .join("");
  const scans = SOURCE_PAGES.map(
    (p) =>
      `<figure class="source-page"><h3>Thibaut, printed p. ${p} · PDF page ${p + 6}</h3><img src="${data(`sources/thibaut-${String(p).padStart(2, "0")}.jpg`, "image/jpeg")}" alt="Complete source page ${p}" width="1430" height="2000"><figcaption>${SOURCE_NOTES[p]} George Thibaut, <cite>The Śulvasūtras</cite>, 1875. Oxford copy digitized by Google; Internet Archive ulvastras00ktgoog.</figcaption></figure>`,
  ).join("");
  const licenses = assets
    .filter((p) => p.endsWith("OFL.txt"))
    .map((p) => `<h3>${esc(p)}</h3><pre>${esc(new TextDecoder().decode(bytes.get(p)))}</pre>`)
    .join("");
  const url = new URL(import.meta.env.BASE_URL, location.origin);
  url.search = serializeState(state);
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; img-src data:; font-src data:; base-uri 'none'; form-action 'none'"><title>Rajju — ${title}</title><style>${fonts}${STUDY_CSS}</style></head><body><header><p>RAJJU · <span lang="sa">रज्जु</span> · geometry by the cord</p><h1>${title}</h1><p>Starting side: ${number(state.side)} mm, a chosen modern scale. Baudhāyana tradition, read through George Thibaut’s 1875 print.</p><p class="small">Edition ${esc(__RAJJU_EDITION__)}. <a href="${esc(url.href)}">Open this construction online</a>. This file needs no network to read or print.</p></header><main>${construction}<section><h2>Measurements and their references</h2><table><thead><tr><th>Quantity</th><th>Value</th><th>Unit</th><th>Reference</th></tr></thead><tbody>${table}</tbody></table><p class="download-link"><a download="rajju-${state.lesson}-measurements.csv" href="data:text/csv;charset=utf-8,${esc(encodeURIComponent(csv))}">Save these exact CSV bytes</a></p></section><section><h2>Read the instructions</h2>${readings}</section><section><h2>Sources and limits</h2><p>${LIMITATIONS}</p><p>The circle workshop uses the geometric diagonal. The numerical-diagonal lesson is separate. Exact rational expressions are distinct from rounded modern decimal comparisons.</p><p>The complete page images follow. <a href="${SOURCE_URL}">Complete 1875 volume</a>. The editor’s historical conjectures and judgments remain visible as source evidence, not as established findings. The nine JPEGs and all fonts were checked against the edition’s SHA-256 identities before this file was created.</p><p>Code, new drawings and English notes: MIT, Anton Soloviev, 2026. Historical source text and print images are public domain. Font licenses are retained below.</p></section>${scans}<details class="licenses"><summary>Embedded font licenses</summary>${licenses}</details></main></body></html>`;
  download(
    new Blob([html], { type: "text/html;charset=utf-8" }),
    `rajju-${state.lesson}-reading.html`,
  );
}
