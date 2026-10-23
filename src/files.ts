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

function download(body: Blob, name: string): void {
  const url = URL.createObjectURL(body);
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 30000);
}

export function downloadCsv(state: State): void {
  download(
    new Blob([csvText(state)], { type: "text/csv;charset=utf-8" }),
    `rajju-${state.lesson}-measurements.csv`,
  );
}

async function verifiedAsset(path: string): Promise<Uint8Array<ArrayBuffer>> {
  const response = await fetch(`${import.meta.env.BASE_URL}${path}`);
  if (!response.ok) throw new Error(`Could not load ${path}. Reload online and save again.`);
  const bytes = new Uint8Array(await response.arrayBuffer());
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  const actual = Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join(
    "",
  );
  if (actual !== __ASSET_HASHES__[path]) {
    throw new Error(`The saved edition could not verify ${path}. Reload online and save again.`);
  }
  return bytes;
}

function base64(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i += 16384)
    binary += String.fromCharCode(...bytes.subarray(i, i + 16384));
  return btoa(binary);
}

const STUDY_CSS = `
*{box-sizing:border-box}body{font-family:Plex,sans-serif;background:#fbfcf9;color:#173c51;max-width:1000px;margin:auto;padding:35px;line-height:1.65}h1,h2{font-family:Newsreader,serif;font-weight:500;line-height:1.1}h1{font-size:46px}h2{font-size:30px}h3{font-size:18px}a{color:inherit}svg{width:100%;height:auto;display:block}svg text{font-family:Plex,sans-serif;font-size:16px;fill:#173c51}svg .caption{font-size:13px}svg .direction{font-size:12px}svg .axis{stroke:#97b0bf;stroke-width:1;stroke-dasharray:4 7;fill:none}svg .square-outline{stroke:#173c51;stroke-width:2;fill:none}svg .circle-outline{stroke:#226579;stroke-width:2;fill:none}svg .preview-circle{stroke:#226579;stroke-dasharray:4 6;fill:none}svg .diagonal-guide{stroke:#173c51;stroke-width:1.5;stroke-dasharray:5 5;fill:none}svg .active-cord{stroke:#173c51;stroke-width:5;stroke-linecap:round;fill:none}svg .cord-guide{stroke:#6b7d78;stroke-width:2;fill:none}svg .excess-cord{stroke:#a6462c;stroke-width:3;fill:none}svg .division,svg .dimension{stroke:#496c7e;stroke-width:1;fill:none}svg .swing{stroke:#4d7386;stroke-width:1;stroke-dasharray:4 5;fill:none}svg .peg{fill:#173c51;stroke:#d5e3e9;stroke-width:1.5}svg .returned-square{stroke:#226579;stroke-width:2;fill:#22657912}svg .original-reference{stroke:#173c51;stroke-width:2;stroke-dasharray:5 4;fill:none}svg .target-square{stroke:#173c51;stroke-width:2;stroke-dasharray:6 4;fill:#b9cfd930}svg .numerical-square{stroke:#a6462c;stroke-width:2;fill:#a6462c0c}svg .grid-line{stroke:#9cb3bf;stroke-width:.7;fill:none}svg .cut-line{stroke:#a6462c;stroke-width:1.2;fill:none}.plate{background:#d5e3e9;padding:15px;max-width:600px;margin:25px auto}.plate.return{max-width:350px}.ruler{max-width:650px;margin:20px auto}.sanskrit{font-family:Devanagari,serif;font-size:23px;line-height:2}.iast{font-family:Newsreader,serif;font-size:21px}section{margin-top:40px}table{width:100%;border-collapse:collapse;font-size:13px}td,th{text-align:left;vertical-align:top;padding:9px;border-bottom:1px solid #9cb3bf;overflow-wrap:anywhere}th{font-weight:600}td:nth-child(2){font-variant-numeric:tabular-nums}figure{margin:35px 0}figure img{display:block;max-width:100%;height:auto}figcaption{font-size:13px;margin-top:10px}.small{font-size:13px;overflow-wrap:anywhere}pre{white-space:pre-wrap;font-size:11px}.equation{font-size:18px;overflow-wrap:anywhere}@media(max-width:600px){body{padding:20px}h1{font-size:35px}table{font-size:10px}td,th{padding:6px}}@media print{h1,h2,h3{break-after:avoid}p{orphans:3;widows:3}@page{size:A4;margin:16mm}body{padding:0;max-width:none;font-size:10pt}h1{font-size:29pt}h2{font-size:21pt}.plate{max-width:140mm;break-inside:avoid}.ruler{break-inside:avoid}table{font-size:8pt}.source-page{break-before:page;margin:0}.source-page img{max-height:235mm;max-width:100%;object-fit:contain}.source-page h3{margin:0 0 4mm;font-size:12pt}.source-page figcaption{font-size:8pt}.licenses,.download-link{display:none}.reading-passage{break-inside:avoid}}`;

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
