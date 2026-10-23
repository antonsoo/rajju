import {
  CIRCLE_STEPS,
  DIAGONAL_STEPS,
  LIMITATIONS,
  PASSAGES,
  SOURCE_NOTES,
  SOURCE_URL,
  WORDS,
} from "./content";
import { asText } from "./core/fraction";
import { circleModel, diagonalModel } from "./core/geometry";
import { parseState, SOURCE_PAGES, type State, serializeState } from "./core/state";
import {
  circleDrawing,
  diagonalDrawing,
  errorDrawing,
  returnDrawing,
  stripsDrawing,
} from "./drawing";
import { downloadCsv, saveStudy } from "./files";
import { escapeHtml, number, signed } from "./format";
import { offlineStatus } from "./offline";
import "./style.css";

function element<T extends HTMLElement>(id: string): T {
  const found = document.getElementById(id);
  if (!found) throw new Error(`Missing ${id}`);
  return found as T;
}

let parsed = parseState(location.search);
let state = parsed.state;
let selectedWord = "third";

element("app").innerHTML = `
  <a class="skip-link" href="#workshop">Skip to the construction</a>
  <header class="masthead">
    <a class="brand" href="${import.meta.env.BASE_URL}" aria-label="Rajju, starting construction"><span lang="sa">रज्जु</span><span>RAJJU<small>geometry by the cord</small></span></a>
    <nav aria-label="Lessons"><button id="circle-tab" type="button">Circle & return</button><button id="diagonal-tab" type="button">The diagonal</button><a href="${import.meta.env.BASE_URL}field.html">Lay out a ground</a><a href="#reading">Read the source</a></nav>
  </header>
  <main>
    <p id="link-issue" class="notice" role="status" hidden></p>
    <section class="intro" aria-labelledby="lesson-title"><div><p class="eyebrow">Ancient India · Baudhāyana’s Śulbasūtra</p><h1 id="lesson-title"></h1></div><div id="intro-copy"></div></section>
    <section id="workshop" class="workshop" aria-label="Cord construction">
      <div class="instruction-rail">
        <h2 id="rail-title">Follow the cord</h2>
        <ol id="circle-steps" class="steps">${CIRCLE_STEPS.map((s, i) => `<li><button type="button" data-step="${i}"><span>${i + 1}</span>${s.title}</button></li>`).join("")}</ol>
        <ol id="diagonal-steps" class="steps" hidden>${DIAGONAL_STEPS.map((s, i) => `<li><button type="button" data-stage="${i}"><span>${i + 1}</span>${s.title}</button></li>`).join("")}</ol>
        <p id="step-copy" class="step-copy"></p>
        <div class="measure-controls"><label class="side-label" for="side">Starting square side <span>modern scale</span></label>
        <div class="side-input"><input id="side" type="number" min="100" max="10000" step="1" inputmode="numeric" aria-describedby="side-help side-error"><span>mm</span></div>
        <p id="side-help" class="small">100–10,000 mm. Changing the size keeps the ratios.</p><p id="side-error" class="error" role="status"></p>
        <fieldset id="circle-controls"><legend>How much of the excess?</legend>
          <label><input type="radio" name="radius-rule" value="third"> A third <span class="tag">source rule</span></label>
          <label><input type="radio" name="radius-rule" value="equal"> Equal-area radius <span class="tag">modern</span></label>
          <label><input type="radio" name="radius-rule" value="custom"> Choose a fraction <span class="tag">experiment</span></label>
          <div id="custom-control" hidden><label for="kept">Fraction of the excess <output id="kept-value" for="kept"></output></label><input id="kept" type="range" min="0" max="1000" step="1"></div>
        </fieldset>
        <p id="rule-note" class="small"></p></div>
      </div>
      <div class="drawing-board"><div class="board-caption"><span id="board-label">Plan · square to circle</span><span id="board-mode"></span></div><div id="main-drawing"></div><div id="drawing-key" class="drawing-key"></div></div>
    </section>
    <section id="circle-results" class="circle-results" aria-labelledby="balance-title">
      <div class="balance"><p class="eyebrow">Check the area</p><h2 id="balance-title">What was cut away? What was added?</h2><p id="balance-intro">The colored regions above are the actual corners and bulges. They share the drawing’s scale.</p>
        <div class="area-comparison"><div><span class="lost-key">Corners removed</span><strong id="lost-value"></strong><div class="area-track"><span id="lost-bar" class="lost-bar"></span></div></div><div><span class="gained-key">Bulges added</span><strong id="gained-value"></strong><div class="area-track"><span id="gained-bar" class="gained-bar"></span></div></div></div>
        <p class="small">Both bars use 60% of the starting square’s area as their full width. Percentages refer to that starting area.</p>
        <p id="circle-verdict" class="verdict" aria-live="polite"></p><p id="radius-equation" class="equation"></p>
      </div>
      <div class="return-panel"><p class="eyebrow">Now go back</p><h2>Can the circle give the square back?</h2>
        <label for="return-rule">Circle-to-square instruction</label><select id="return-rule"><option value="detailed">Detailed rule · 9785/11136 of the diameter</option><option value="simple">Shorter rule · 13/15 of the diameter</option></select>
        <div class="return-layout"><div id="return-drawing"></div><div><p id="return-equation" class="equation"></p><p id="return-verdict"></p><p id="return-circle-gap" class="small"></p><button id="read-return" type="button" class="text-button">Read this return rule ↓</button></div></div>
      </div>
    </section>
    <section id="diagonal-results" class="diagonal-results" aria-labelledby="diagonal-result-title" hidden>
      <div><p class="eyebrow">Measure the approximation</p><h2 id="diagonal-result-title">A good cord. A tiny excess.</h2><p id="diagonal-expression" class="equation"></p><dl id="diagonal-numbers" class="measurements"></dl><p id="diagonal-verdict" class="verdict" aria-live="polite"></p></div>
      <div class="strips"><h3>Where can a remainder hide?</h3><div id="strips-drawing">${stripsDrawing()}</div><p>Start from 17² = 289 and aim for 2 × 12² = 288. Trim a depth of 1/34 from two sides. The two long strips would total one square unit, but they overlap at a tiny corner. The actual remainder is (1/34)².</p><p class="small">This illustrates Thibaut’s proposed explanation on pp. 14–15. It is not a derivation stated in the ancient rule. Divide the lengths by 12 to recover 577/408 and the area remainder 1/166464.</p></div>
    </section>
    <section class="error-section" aria-labelledby="error-title"><div><p class="eyebrow">Look closer</p><h2 id="error-title"></h2><p id="error-copy"></p></div><div id="error-drawing" class="error-ruler"></div></section>
    <section class="numbers-section" aria-labelledby="numbers-title"><details><summary id="numbers-title">Keep the numerical evidence</summary><div class="table-scroll"><table><caption id="table-caption"></caption><thead><tr><th scope="col">Quantity</th><th scope="col">Value</th><th scope="col">What it compares</th></tr></thead><tbody id="numbers-body"></tbody></table></div></details>
      <div class="actions"><button id="share" type="button">Copy this construction’s link</button><button id="csv" type="button">Download measurements</button><button id="save" type="button" class="primary">Save illustrated reading</button></div><p id="file-status" role="status" class="small"></p><p id="share-fallback" hidden><label for="share-url">Copy this link</label><input id="share-url" type="text" readonly></p>
    </section>
    <section id="reading" class="reading-section" aria-labelledby="reading-title"><div class="section-opening"><div><p class="eyebrow">Read the instruction</p><h2 id="reading-title">The words that move the cord.</h2></div><p>The Sanskrit is a normalized reading of the 1875 print, with IAST transliteration and a new English translation. Select a word for its work in the sentence. No Sanskrit is assumed.</p></div>
      <div class="reader"><div class="passage-column"><label for="passage">Passage</label><select id="passage">${Object.entries(
        PASSAGES,
      )
        .map(([key, p]) => `<option value="${key}">${p.title}</option>`)
        .join(
          "",
        )}</select><div id="passage-text"></div><div id="word-buttons" class="word-buttons" aria-label="Word notes"></div><div id="word-note" class="word-note" aria-live="polite"></div></div>
      <div class="source-column"><div class="source-heading"><h3 id="scan-title"></h3><a id="open-scan" target="_blank" rel="noreferrer">Open full image ↗</a></div><div class="page-buttons" aria-label="Printed source pages">${SOURCE_PAGES.map((p) => `<button type="button" data-page="${p}">p. ${p}</button>`).join("")}</div><label class="zoom-label" for="zoom">Enlarge page <input id="zoom" type="range" min="100" max="300" step="25" value="100"></label><div id="source-pan" class="source-pan" tabindex="0" role="region" aria-label="Source page; scroll or use arrow keys to pan"><img id="source-image" alt="" width="1430" height="2000"></div><p id="source-note" class="small"></p><p class="small">George Thibaut, <cite>The Śulvasūtras</cite> (1875), Oxford copy digitized by Google. <a href="${SOURCE_URL}" target="_blank" rel="noreferrer">Complete volume and provenance ↗</a>. The full pages retain the editor’s arguments and dated judgments; those are not adopted as historical findings here.</p></div></div>
    </section>
    <section class="context-section"><h2>Geometry for a ritual ground.</h2><div><p>The Śulbasūtras give rules for laying out ritual grounds and fire altars with cords. Preserving an area while changing its shape gives these instructions a concrete purpose. This exhibit follows a small group of rules transmitted under Baudhāyana’s name; it does not model a complete altar.</p><p>${LIMITATIONS}</p><p>The circle construction uses the geometric diagonal, √2 times the side. The separate numerical-diagonal lesson uses 577/408. They are kept distinct so that a small diagonal error cannot be mistaken for the much larger circle-area error.</p><p>Try another practical distinction in <a href="${import.meta.env.BASE_URL}field.html">Āpastamba’s ground layout: hold fifteen, stake twelve</a>. Keep four pegs, compare four cord procedures and print a small physical exercise.</p><p>Continue with <a href="https://antonsoo.github.io/seked/">Egyptian pyramid slopes</a>, <a href="https://antonsoo.github.io/stoicheia/">Euclid in Greek and Latin</a>, or <a href="https://antonsoo.github.io/gonia/">measured Greek architecture</a>.</p></div></section>
  </main><footer><span>Rajju · <span lang="sa">रज्जु</span> · cord</span><p id="offline-status" role="status">Preparing offline reading…</p><a href="https://github.com/antonsoo/rajju">Source & methods</a><span>Code & new drawings: MIT · <a href="${import.meta.env.BASE_URL}notices.html">Source & font notices</a></span></footer>
`;

function updateHistory(push = false): void {
  const url = new URL(location.href);
  const known = new URLSearchParams(serializeState(state));
  for (const [key, value] of known) url.searchParams.set(key, value);
  history[push ? "pushState" : "replaceState"](null, "", url);
}

function renderPassage(): void {
  const p = PASSAGES[state.passage];
  element("passage-text").innerHTML =
    `<p class="source-reference">${p.reference}</p><p class="sanskrit" lang="sa">${p.devanagari}</p><p class="iast" lang="sa-Latn">${p.iast}</p><p class="translation">${p.english}</p><p class="small">${p.note}</p>`;
  element("word-buttons").innerHTML = p.words
    .map((id) => {
      const word = WORDS.find((w) => w.id === id);
      return word
        ? `<button type="button" data-word="${id}" aria-pressed="false"><span lang="sa">${word.devanagari}</span><span lang="sa-Latn">${word.iast}</span></button>`
        : "";
    })
    .join("");
  if (!(p.words as readonly string[]).includes(selectedWord)) selectedWord = p.words[0];
  renderWord();
}

function renderWord(): void {
  const word = WORDS.find((w) => w.id === selectedWord);
  if (!word) return;
  for (const button of document.querySelectorAll<HTMLButtonElement>("[data-word]")) {
    button.setAttribute("aria-pressed", String(button.dataset.word === selectedWord));
  }
  element("word-note").innerHTML =
    `<h3><span lang="sa-Latn">${word.iast}</span> <span>— ${word.meaning}</span></h3><p>${word.note}</p>`;
  element("main-drawing").dataset.highlight = word.highlight;
}

function renderSource(): void {
  const url = `${import.meta.env.BASE_URL}sources/thibaut-${String(state.page).padStart(2, "0")}.jpg`;
  element("scan-title").textContent = `Thibaut · printed page ${state.page}`;
  const img = element<HTMLImageElement>("source-image");
  if (img.getAttribute("src") !== url) {
    img.src = url;
    img.alt = `Complete printed page ${state.page} of George Thibaut’s The Śulvasūtras, 1875. ${SOURCE_NOTES[state.page]}`;
    element<HTMLInputElement>("zoom").value = "100";
    img.style.width = "100%";
    element("source-pan").scrollTo(0, 0);
  }
  element<HTMLAnchorElement>("open-scan").href = url;
  element("source-note").textContent = SOURCE_NOTES[state.page] ?? "";
  for (const b of document.querySelectorAll<HTMLButtonElement>("[data-page]"))
    b.setAttribute("aria-pressed", String(Number(b.dataset.page) === state.page));
}

function tableRows(rows: [string, string, string][]): string {
  return rows
    .map(
      (r) =>
        `<tr>${r.map((v, i) => `<${i === 0 ? 'th scope="row"' : "td"}>${escapeHtml(v)}</${i === 0 ? "th" : "td"}>`).join("")}</tr>`,
    )
    .join("");
}

function render(): void {
  const circle = state.lesson === "circle";
  const m = circleModel(state.side, state.rule, state.kept, state.returnRule);
  const d = diagonalModel(state.side, state.stage);
  element("lesson-title").innerHTML = circle
    ? "A circle too large.<br>A return almost perfect."
    : "A diagonal hidden<br>in four instructions.";
  element("intro-copy").innerHTML = circle
    ? '<p>A cord can turn a square into a circle, then a circle back into a square. The second square almost matches the first. That does not mean the areas stayed equal.</p><p class="small">Try the ancient rule. Compare what it removes and what it adds. Then read the words and the printed evidence.</p>'
    : '<p>Lengthen a side by a third, a fourth of that third, then remove a thirty-fourth of the last addition. How close does the cord come to a square’s diagonal?</p><p class="small">Build the nested fractions. Inspect the square on the cord, then enlarge the error that an ordinary drawing cannot show.</p>';
  for (const lesson of ["circle", "diagonal"])
    element(`${lesson}-tab`).setAttribute(
      "aria-current",
      lesson === state.lesson ? "page" : "false",
    );
  for (const id of ["circle-steps", "circle-controls", "circle-results"])
    element(id).hidden = !circle;
  for (const id of ["diagonal-steps", "diagonal-results"]) element(id).hidden = circle;
  element("rail-title").textContent = circle ? "Follow the cord" : "Build the measure";
  element("step-copy").textContent = circle
    ? (CIRCLE_STEPS[state.step]?.text ?? "")
    : (DIAGONAL_STEPS[state.stage]?.text ?? "");
  for (const b of document.querySelectorAll<HTMLButtonElement>("[data-step]"))
    b.setAttribute("aria-pressed", String(Number(b.dataset.step) === state.step));
  for (const b of document.querySelectorAll<HTMLButtonElement>("[data-stage]"))
    b.setAttribute("aria-pressed", String(Number(b.dataset.stage) === state.stage));
  element<HTMLInputElement>("side").value = String(state.side);
  for (const input of document.querySelectorAll<HTMLInputElement>('input[name="radius-rule"]'))
    input.checked = input.value === state.rule;
  element("custom-control").hidden = state.rule !== "custom";
  element<HTMLInputElement>("kept").value = String(state.kept);
  element("kept-value").textContent = `${state.kept}/1000`;
  element<HTMLSelectElement>("return-rule").value = state.returnRule;
  element<HTMLSelectElement>("passage").value = state.passage;
  element("rule-note").textContent = !circle
    ? "The fraction arithmetic is exact. Diagram coordinates and the comparison with √2 are rounded."
    : state.rule === "third"
      ? "The rule keeps exactly 1/3. It is not rounded to 333/1000."
      : state.rule === "equal"
        ? "Modern comparison: r = side / √π. This is a numerical area match, not an ancient cord construction."
        : "Your alteration of the rule. The numbered instructions describe the original third; this drawing uses your chosen fraction.";
  element("board-label").textContent = circle
    ? "Plan · square to circle"
    : "Area · a square on the cord";
  element("board-mode").textContent =
    circle && state.rule !== "third" ? "Modern comparison" : "Source rule, modern drawing";
  element("main-drawing").innerHTML = circle ? circleDrawing(m, state.step) : diagonalDrawing(d);
  element("drawing-key").innerHTML = circle
    ? '<span class="lost-key">Corners removed</span><span class="gained-key">Bulges added</span><span>Solid line: retained cord</span>'
    : "<span>Dashed: geometric diagonal</span><span>Solid: numerical approximation</span>";
  element("balance-intro").textContent =
    state.step === 3
      ? "The colored regions above are the actual corners and bulges. They share the drawing’s scale."
      : "These measurements describe the completed circle. Choose ‘Draw, then compare’ to show the removed and added regions.";
  element("lost-value").textContent = `${number(m.lostRatio * 100, 6)}%`;
  element("gained-value").textContent = `${number(m.gainedRatio * 100, 6)}%`;
  element("lost-bar").style.width = `${(m.lostRatio / 0.6) * 100}%`;
  element("gained-bar").style.width = `${(m.gainedRatio / 0.6) * 100}%`;
  element("circle-verdict").textContent =
    Math.abs(m.circleErrorPercent) < 1e-10
      ? "Equal areas, to numerical precision. This radius uses the modern value of π."
      : `The circle is ${number(Math.abs(m.circleErrorPercent), 6)}% ${m.circleErrorPercent > 0 ? "larger" : "smaller"} than the square.`;
  element("radius-equation").textContent =
    `r = ${number(state.side / 2)} + ${state.rule === "third" ? "1/3" : number(m.kept, 9)} × ${number(m.excess, 6)} = ${number(m.radius, 6)} mm`;
  element("return-drawing").innerHTML = returnDrawing(m);
  element("return-equation").textContent =
    `Returned side = ${asText(m.returnFactor)} × ${number(m.diameter, 6)} mm`;
  element("return-verdict").textContent =
    `The new square’s area differs from the starting square by ${signed(m.returnErrorPercent, 9)}%.`;
  element("return-circle-gap").textContent =
    `It differs from the intermediate circle by ${signed(m.returnErrorFromCirclePercent, 6)}%. Compare each transformation, not just the endpoints.`;
  element("diagonal-expression").textContent =
    `${DIAGONAL_STEPS[state.stage]?.expression} = ${asText(d.ratio)}`;
  element("diagonal-numbers").innerHTML =
    `<div><dt>Numerical cord</dt><dd>${number(d.diagonal, 9)} mm</dd></div><div><dt>Geometric diagonal</dt><dd>${number(d.geometricDiagonal, 9)} mm</dd></div><div><dt>Square area / original area</dt><dd>${asText(d.area)}</dd></div><div><dt>Excess / original area</dt><dd>${asText(d.areaError)}</dd></div>`;
  element("diagonal-verdict").textContent =
    `The square on the cord differs from the desired double area by ${signed(d.areaErrorPpm, 6)} parts per million.`;
  element("error-title").textContent = circle
    ? "The return edge, under a lens."
    : "The numerical cord, under a lens.";
  element("error-copy").textContent = circle
    ? `The returned side differs by ${signed(m.sideError, 9)} mm. The two edges can overlap on screen while the circle’s area error remains. The ruler enlarges the difference; the plan above stays proportional.`
    : `The numerical cord differs from the geometric diagonal by ${signed(d.lengthError, 9)} mm at this chosen size. The ruler enlarges that difference. A line drawn a pixel wider would not be evidence of the actual error.`;
  element("error-drawing").innerHTML = errorDrawing(
    circle ? m.sideError : d.lengthError,
    "mm",
    "error",
  );
  element("table-caption").textContent = circle
    ? "Every area compared with its own reference"
    : "The numerical cord and the geometric target";
  element("numbers-body").innerHTML = tableRows(
    circle
      ? [
          ["Starting square", `${number(m.originalArea, 6)} mm²`, "The reference area"],
          [
            "Constructed circle",
            `${number(m.circleArea, 6)} mm²`,
            `${signed(m.circleErrorPercent, 9)}% of starting square`,
          ],
          ["Corners removed", `${number(m.lostArea, 6)} mm²`, "Square outside the circle"],
          ["Bulges added", `${number(m.gainedArea, 6)} mm²`, "Circle outside the square"],
          [
            "Returned square",
            `${number(m.returnedArea, 6)} mm²`,
            `${signed(m.returnErrorPercent, 9)}% of starting square`,
          ],
          [
            "Return versus circle",
            `${signed(m.returnErrorFromCirclePercent, 9)}%`,
            "Intermediate circle is the reference",
          ],
        ]
      : [
          ["Cord / side", asText(d.ratio), "Exact rational value"],
          ["Numerical cord", `${number(d.diagonal, 9)} mm`, "Chosen modern length"],
          ["Geometric diagonal", `${number(d.geometricDiagonal, 9)} mm`, "√2 × starting side"],
          ["Square on cord", `${number(d.producedArea, 6)} mm²`, "Numerical cord squared"],
          ["Target double area", `${number(d.targetArea, 6)} mm²`, "Twice the starting square"],
          [
            "Relative error",
            asText(d.relativeAreaError),
            "Error divided by the target double area",
          ],
        ],
  );
  element("link-issue").hidden = parsed.issue === null;
  element("link-issue").textContent = parsed.issue ?? "";
  renderWord();
}

function change(patch: Partial<State>, push = true): void {
  state = { ...state, ...patch };
  parsed = { state, issue: null };
  updateHistory(push);
  render();
}

for (const lesson of ["circle", "diagonal"] as const) {
  element(`${lesson}-tab`).addEventListener("click", () => {
    change({ lesson, passage: lesson, page: PASSAGES[lesson].page });
    renderPassage();
    renderSource();
  });
}
for (const b of document.querySelectorAll<HTMLButtonElement>("[data-step]"))
  b.addEventListener("click", () => change({ step: Number(b.dataset.step) }));
for (const b of document.querySelectorAll<HTMLButtonElement>("[data-stage]"))
  b.addEventListener("click", () => change({ stage: Number(b.dataset.stage) }));
for (const input of document.querySelectorAll<HTMLInputElement>('input[name="radius-rule"]'))
  input.addEventListener("change", () => change({ rule: input.value as State["rule"], step: 3 }));
element<HTMLInputElement>("kept").addEventListener("input", (event) =>
  change(
    { kept: Number((event.target as HTMLInputElement).value), rule: "custom", step: 3 },
    false,
  ),
);
element<HTMLInputElement>("side").addEventListener("change", (event) => {
  const input = event.target as HTMLInputElement;
  const value = input.valueAsNumber;
  const valid = input.value !== "" && Number.isInteger(value) && value >= 100 && value <= 10000;
  input.setAttribute("aria-invalid", String(!valid));
  element("side-error").textContent = valid
    ? ""
    : "Use a whole number from 100 to 10,000 mm. The last valid drawing remains.";
  if (valid) change({ side: value });
});
element<HTMLSelectElement>("return-rule").addEventListener("change", (e) =>
  change({ returnRule: (e.target as HTMLSelectElement).value as State["returnRule"] }),
);
element("read-return").addEventListener("click", () => {
  const passage = state.returnRule === "detailed" ? "return" : "simple";
  change({ passage, page: PASSAGES[passage].page });
  renderPassage();
  renderSource();
  element<HTMLSelectElement>("passage").focus();
  element("reading").scrollIntoView({ block: "start" });
});
element<HTMLSelectElement>("passage").addEventListener("change", (e) => {
  const passage = (e.target as HTMLSelectElement).value as State["passage"];
  change({ passage, page: PASSAGES[passage].page });
  renderPassage();
  renderSource();
});
element("word-buttons").addEventListener("click", (e) => {
  const b = (e.target as HTMLElement).closest<HTMLButtonElement>("[data-word]");
  if (!b?.dataset.word) return;
  selectedWord = b.dataset.word;
  renderWord();
});
for (const b of document.querySelectorAll<HTMLButtonElement>("[data-page]"))
  b.addEventListener("click", () => {
    change({ page: Number(b.dataset.page) });
    renderSource();
  });
element<HTMLInputElement>("zoom").addEventListener("input", (e) => {
  element<HTMLImageElement>("source-image").style.width =
    `${(e.target as HTMLInputElement).value}%`;
});
element("csv").addEventListener("click", () => {
  downloadCsv(state);
  element("file-status").textContent =
    "Measurements downloaded. The CSV names each reference area and the chosen rule.";
});
element("save").addEventListener("click", async () => {
  const button = element<HTMLButtonElement>("save");
  button.disabled = true;
  const snapshot = { ...state };
  element("file-status").textContent =
    "Preparing the reading with verified source pages and local fonts…";
  try {
    await saveStudy(snapshot);
    element("file-status").textContent =
      "Illustrated reading downloaded. It includes this construction, all nine source pages, fonts and measurements, and opens offline.";
  } catch (error) {
    element("file-status").textContent =
      error instanceof Error
        ? error.message
        : "Reading could not be saved. Reload online and try again.";
  } finally {
    button.disabled = false;
  }
});
element("share").addEventListener("click", async () => {
  updateHistory();
  const url = location.href;
  try {
    await navigator.clipboard.writeText(url);
    element("file-status").textContent = "Construction link copied.";
  } catch {
    element("share-fallback").hidden = false;
    const input = element<HTMLInputElement>("share-url");
    input.value = url;
    input.focus();
    input.select();
    element("file-status").textContent =
      "Copy the selected link. This browser did not grant clipboard access.";
  }
});
window.addEventListener("popstate", () => {
  parsed = parseState(location.search);
  state = parsed.state;
  element("side-error").textContent = "";
  element("side").removeAttribute("aria-invalid");
  render();
  renderPassage();
  renderSource();
});

render();
renderPassage();
renderSource();
void offlineStatus(element("offline-status"));
