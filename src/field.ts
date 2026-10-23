import {
  CORNER_NAMES,
  CORNERS,
  type Corner,
  FIELD_PAGES,
  type FieldState,
  fieldGround,
  fieldModel,
  METHOD_NAMES,
  METHODS,
  type Method,
  type PegSetting,
  parseField,
  serializeField,
  sourcePeg,
} from "./core/field";
import { FIELD_LIMITS, FIELD_READINGS, FIELD_SOURCE_NOTES } from "./field-content";
import { cordRuler, fieldDrawing } from "./field-drawing";
import { fieldCsvDownload, fieldStudyDownload, fieldTemplateDownload } from "./field-files";
import { escapeHtml, number, signed } from "./format";
import { offlineStatus } from "./offline";
import "./style.css";
import "./field.css";
import "./field-ink.css";

function el<T extends HTMLElement>(id: string): T {
  const found = document.getElementById(id);
  if (!found) throw new Error(`Missing ${id}`);
  return found as T;
}
let parsed = parseField(location.search);
let state = parsed.state;

el("app").innerHTML = `<a class="skip-link" href="#field-workshop">Skip to the cord</a>
<header class="masthead"><a class="brand" href="${import.meta.env.BASE_URL}"><span lang="sa">रज्जु</span><span>RAJJU<small>geometry by the cord</small></span></a><nav aria-label="Lessons"><a href="${import.meta.env.BASE_URL}">Circle & return</a><a href="${import.meta.env.BASE_URL}?lesson=diagonal&passage=diagonal&page=12">The diagonal</a><a href="${import.meta.env.BASE_URL}field.html" aria-current="page">Lay out a ground</a></nav></header>
<main><p id="field-issue" class="notice" role="status" hidden></p>
<section class="intro field-intro"><div><p class="eyebrow">Ancient India · Āpastamba’s layout rules</p><h1>Hold fifteen.<br>Stake twelve.</h1></div><div><p>A marked cord can establish a right angle and measure a different distance at the same time. The point in your hand need not be the place for the peg.</p><p class="small">Lay out a ground 36 units long, 30 wide at the west and 24 at the east. Follow the one-cord rule, then compare three alternatives from the same source.</p></div></section>
<section id="field-workshop" class="field-workshop" aria-label="Taut cord and ground layout"><div class="field-board"><div class="board-caption"><span>Plan · north above, east to the right</span><span>Equal scales · source units</span></div><label class="zoom-label" for="plan-zoom">Enlarge plan <input id="plan-zoom" type="range" min="100" max="250" step="25" value="100"></label><div id="field-plan" tabindex="0" role="region" aria-label="Cord plan; enlarge and scroll or use arrow keys to pan"></div><div class="field-key"><span>Solid cord: taut</span><span>Dark dot: grip</span><span>Rust ring: proposed peg</span><span>Blue dots: placed pegs</span></div></div>
<div class="field-controls"><label for="field-method">Choose a source procedure</label><select id="field-method">${METHODS.map((m) => `<option value="${m}">${METHOD_NAMES[m]}</option>`).join("")}</select><h2>Choose a corner</h2><div class="corner-buttons">${CORNERS.map((c) => `<button type="button" data-corner="${c}" aria-pressed="false">${CORNER_NAMES[c]}</button>`).join("")}</div><p id="corner-words" class="small"></p><p id="recipe-copy" class="recipe-copy"></p>
<label for="field-grip">Hold the cord at <output id="grip-value" for="field-grip"></output></label><input id="field-grip" type="range" min="900" max="4500" value="1500" step="1"><p id="grip-range-note" class="small"></p>
<fieldset><legend>Where will the peg go?</legend><label><input type="radio" name="field-stake" value="mark"> At the source’s measured mark</label><label><input type="radio" name="field-stake" value="grip"> Where I am holding the cord</label></fieldset>
<button id="restore-source" type="button">Restore the source grip & mark</button><label class="locus-label"><input id="field-locus" type="checkbox"> Show every taut grip position <span class="tag">modern analysis</span></label>
<div class="peg-reading"><h3 id="peg-heading"></h3><p id="peg-result" aria-live="polite"></p><p id="peg-error" class="small"></p><button id="place-peg" type="button" class="primary">Place this peg</button><p id="placed-status" class="small" role="status"></p></div></div></section>
<section class="cord-unbent"><div><p class="eyebrow">The same cord, unbent</p><h2>Two marks. Two jobs.</h2><p id="cord-explanation"></p></div><div id="cord-ruler"></div></section>
<section class="ground-section" aria-labelledby="ground-heading"><div><p class="eyebrow">Keep the four pegs</p><h2 id="ground-heading">What ground did you make?</h2><p>Changing the grip moves the proposed peg. A placed peg keeps the method and mark choices used when you placed it. Select a corner and place again to replace it.</p><p id="ground-result" class="verdict" aria-live="polite"></p><button id="clear-pegs" type="button">Clear placed pegs</button></div><div class="table-scroll" tabindex="0" role="region" aria-label="Placed peg measurements; use arrow keys to scroll"><table><caption>Placed positions, in source units</caption><thead><tr><th scope="col">Corner</th><th scope="col">Method & grip</th><th scope="col">Peg position</th><th scope="col">Distance from target</th></tr></thead><tbody id="peg-table"></tbody></table></div></section>
<details class="field-math"><summary>How does a taut cord locate one point?</summary><p>The fixed pegs are the centres of two circles. The two pieces of the cord give their radii. Their intersections lie on opposite sides of the centre line; the chosen corner selects one. A different grip mark changes both radii and can move the intersection off the perpendicular.</p><p id="triangle-equation" class="equation"></p><p>The right angle is measured at the end of the centre line, not at a sloping corner of the final trapezoid. If the three points become collinear, no right angle is shown. Four placed pegs are required for an area; a crossed or collapsed boundary does not receive a simple enclosed-ground area.</p></details>
<section class="field-actions"><div class="actions"><button id="field-share" type="button">Copy this layout’s link</button><button id="field-csv" type="button">Download peg measurements</button><button id="field-save" type="button" class="primary">Save illustrated field reading</button><button id="field-template" type="button">Download a paper cord template</button></div><p id="field-file-status" class="small" role="status"></p><p id="field-share-fallback" hidden><label for="field-share-url">Copy this link</label><input id="field-share-url" type="text" readonly></p></section>
<section id="field-reading" class="reading-section"><div class="section-opening"><div><p class="eyebrow">Read the instructions</p><h2>The ground has shoulders.</h2></div><p>The source calls the western corners <span lang="sa-Latn">śroṇī</span>, haunches, and the eastern corners <span lang="sa-Latn">aṃsa</span>, shoulders. These body terms name different ends of the ground. The short readings below come from printed p. 9.</p></div><div class="reader"><div>${FIELD_READINGS.map((p) => `<div class="field-phrase"><p class="sanskrit" lang="sa">${p.devanagari}</p><p class="iast" lang="sa-Latn">${p.iast}</p><p class="translation">${p.english}</p><p class="small">${p.note}</p></div>`).join("")}<p class="small">These are excerpts, with normalized Unicode, spacing and punctuation. Brackets show supplied English. The complete paragraph and Thibaut’s translation remain in the scan. Transliteration is a reading aid; no pronunciation reconstruction is supplied.</p></div><div><div class="source-heading"><h3 id="field-scan-title"></h3><a id="field-open-scan" target="_blank" rel="noreferrer">Open full image ↗</a></div><div class="page-buttons">${FIELD_PAGES.map((p) => `<button type="button" data-field-page="${p}">p. ${p}</button>`).join("")}</div><label class="zoom-label" for="field-zoom">Enlarge page <input id="field-zoom" type="range" min="100" max="300" step="25" value="100"></label><div id="field-source-pan" class="source-pan" tabindex="0" role="region" aria-label="Source page; scroll or use arrow keys to pan"><img id="field-source-image" alt="" width="1430" height="2000"></div><p id="field-source-note" class="small"></p><p class="small">George Thibaut, <cite>The Śulvasūtras</cite> (1875), pp. 9–12. <a href="https://archive.org/details/ulvastras00ktgoog">Complete source volume ↗</a>. The model follows the stated lengths. The page note keeps the printed direction discrepancy on p. 10 visible.</p></div></div></section>
<section class="context-section"><h2>From a line to a ground.</h2><div><p>${FIELD_LIMITS}</p><p>The widths are full cross-lines: each western half is 15, each eastern half 12. The source allows padas or prakramas; no common modern length is inferred. The correct trapezoid’s area is 36 × (30 + 24) / 2 = 972 of the chosen unit squared. A right angle to the baseline alone cannot establish those widths.</p><p>The optional paper template restores the selected source method and uses a chosen 3 mm paper unit. This makes a small reproducible exercise; it is not an ancient-unit conversion. Print at actual size and check its calibration bar.</p></div></section></main>
<footer><span>Rajju · <span lang="sa">रज्जु</span> · cord</span><p id="field-offline" role="status">Preparing offline reading…</p><a href="https://github.com/antonsoo/rajju">Source & methods</a><span>New drawings & English: MIT · <a href="${import.meta.env.BASE_URL}notices.html">Source & font notices</a></span></footer>`;

function url(push = false): void {
  const next = new URL(location.href);
  for (const [k, v] of new URLSearchParams(serializeField(state))) next.searchParams.set(k, v);
  history[push ? "pushState" : "replaceState"](null, "", next);
}
function sourceView(): void {
  const image = el<HTMLImageElement>("field-source-image");
  const src = `${import.meta.env.BASE_URL}sources/thibaut-${String(state.page).padStart(2, "0")}.jpg`;
  if (image.getAttribute("src") !== src) {
    image.src = src;
    image.alt = `Complete printed page ${state.page}, Thibaut 1875. ${FIELD_SOURCE_NOTES[state.page]}`;
    image.style.width = "100%";
    el<HTMLInputElement>("field-zoom").value = "100";
    el("field-source-pan").scrollTo(0, 0);
  }
  el("field-scan-title").textContent = `Thibaut · printed page ${state.page}`;
  el<HTMLAnchorElement>("field-open-scan").href = src;
  el("field-source-note").textContent = FIELD_SOURCE_NOTES[state.page] ?? "";
  for (const b of document.querySelectorAll<HTMLButtonElement>("[data-field-page]"))
    b.setAttribute("aria-pressed", String(Number(b.dataset.fieldPage) === state.page));
}
function zoomPlan(value: string): void {
  const drawing = el("field-plan").querySelector<SVGSVGElement>("svg");
  if (drawing) drawing.style.width = `${value}%`;
}
function render(): void {
  const m = fieldModel(state, state.corner);
  const ground = fieldGround(state.placed);
  el("field-issue").hidden = parsed.issue === null;
  el("field-issue").textContent = parsed.issue ?? "";
  el<HTMLSelectElement>("field-method").value = state.method;
  for (const b of document.querySelectorAll<HTMLButtonElement>("[data-corner]"))
    b.setAttribute("aria-pressed", String(b.dataset.corner === state.corner));
  el("corner-words").textContent = m.west
    ? "Western haunches · śroṇī. Measure 15 on either side of the centre line."
    : "Eastern shoulders · aṃsa. Measure 12 on either side of the centre line.";
  el("recipe-copy").textContent =
    `Fix one end at ${m.west ? "W" : "E"} and the other ${m.baseline} units inward along the centre line${m.auxiliary === 0 || m.auxiliary === 36 ? ", at the opposite end" : ", at auxiliary peg P"}. Use a cord ${m.loop} units long. The source grip is at ${m.sourceGrip}.`;
  const range = el<HTMLInputElement>("field-grip");
  range.min = String(m.minGrip);
  range.max = String(m.maxGrip);
  range.value = String(state.grip);
  el("grip-value").textContent = `${number(m.first, 2)} units`;
  el("grip-range-note").textContent =
    `Taut reach: ${number(m.minGrip / 100)}–${number(m.maxGrip / 100)}. The end positions are collinear.`;
  for (const radio of document.querySelectorAll<HTMLInputElement>('input[name="field-stake"]'))
    radio.checked = radio.value === state.stake;
  el<HTMLInputElement>("field-locus").checked = state.locus;
  el("field-plan").innerHTML = fieldDrawing(state);
  zoomPlan(el<HTMLInputElement>("plan-zoom").value);
  el("cord-ruler").innerHTML = cordRuler(state);
  el("peg-heading").textContent = `Proposed ${CORNER_NAMES[state.corner].toLowerCase()} peg`;
  el("peg-result").textContent = m.atTarget
    ? "The proposed peg meets the prescribed corner."
    : `The proposed peg misses the prescribed corner by ${number(m.error, 6)} source units.`;
  el("peg-error").textContent =
    `Position (${number(m.peg.x, 6)}, ${number(m.peg.y, 6)}). Along-line offset ${signed(m.alongError, 6)}; northward offset ${signed(m.acrossError, 6)}. Grip-to-baseline angle: ${m.angle === null ? "collinear; no right angle" : `${number(m.angle, 6)}°`}.`;
  el("place-peg").textContent = state.placed[state.corner] ? "Replace this peg" : "Place this peg";
  el("cord-explanation").textContent =
    state.method === "one" && !m.west
      ? "The 54-unit cord has a mark at twelve and another at fifteen. With the source grip at fifteen, the twelve mark lies three units nearer E. Stake that mark to make the full eastern width twenty-four. Staking your grip instead gives thirty, even though the angle is still right."
      : `The selected source procedure holds at ${m.sourceGrip} and stakes at ${m.targetHalfWidth} from the selected end. Those marks coincide in this operation. The two taut pieces of the cord are ${number(m.first, 2)} and ${number(m.second, 2)} units long.`;
  el("triangle-equation").textContent =
    `${m.baseline}² + ${number(m.first, 2)}² − ${number(m.second, 2)}² = ${number(m.baseline ** 2 + m.first ** 2 - m.second ** 2, 6)}. Zero puts the grip on the perpendicular.`;
  el("ground-result").textContent = !ground.complete
    ? `${ground.count} of four pegs placed. Place all four to measure the resulting boundary.`
    : ground.area === null
      ? "The placed boundary crosses or collapses. It is not assigned a simple enclosed-ground area."
      : `Enclosed area: ${number(ground.area, 6)} square source units, ${signed((ground.area / 972 - 1) * 100, 6)}% against the prescribed 972. West width ${number(ground.westWidth, 6)}; east width ${number(ground.eastWidth, 6)}.`;
  el("peg-table").innerHTML = CORNERS.map((c) => {
    const s = state.placed[c];
    const p = s ? fieldModel(s, c) : null;
    return `<tr><th scope="row">${CORNER_NAMES[c]}</th><td>${s && p ? `${escapeHtml(METHOD_NAMES[s.method])}<br>Hold ${number(p.first, 2)}; stake ${number(p.mark, 2)}` : "Not placed"}</td><td>${p ? `(${number(p.peg.x, 6)}, ${number(p.peg.y, 6)})` : "—"}</td><td>${p ? number(p.error, 6) : "—"}</td></tr>`;
  }).join("");
  sourceView();
}
function change(patch: Partial<FieldState>, push = true): void {
  state = { ...state, ...patch };
  parsed = { state, issue: null };
  url(push);
  render();
}

el<HTMLSelectElement>("field-method").addEventListener("change", (event) => {
  const method = (event.target as HTMLSelectElement).value as Method;
  change(sourcePeg(method, state.corner));
});
for (const b of document.querySelectorAll<HTMLButtonElement>("[data-corner]"))
  b.addEventListener("click", () => {
    const corner = b.dataset.corner as Corner;
    const setting = state.placed[corner] ?? sourcePeg(state.method, corner);
    change({ ...setting, corner });
  });
el<HTMLInputElement>("field-grip").addEventListener("input", (event) =>
  change({ grip: Number((event.target as HTMLInputElement).value) }, false),
);
for (const radio of document.querySelectorAll<HTMLInputElement>('input[name="field-stake"]'))
  radio.addEventListener("change", () => change({ stake: radio.value as FieldState["stake"] }));
el("restore-source").addEventListener("click", () => change(sourcePeg(state.method, state.corner)));
el<HTMLInputElement>("field-locus").addEventListener("change", (event) =>
  change({ locus: (event.target as HTMLInputElement).checked }),
);
el("place-peg").addEventListener("click", () => {
  const setting: PegSetting = { method: state.method, grip: state.grip, stake: state.stake };
  change({ placed: { ...state.placed, [state.corner]: setting } });
  el("placed-status").textContent =
    `${CORNER_NAMES[state.corner]} peg placed. Its choices are retained until you replace or clear it.`;
});
el("clear-pegs").addEventListener("click", () => {
  change({ placed: {} });
  el("placed-status").textContent = "Placed pegs cleared.";
});
for (const b of document.querySelectorAll<HTMLButtonElement>("[data-field-page]"))
  b.addEventListener("click", () => change({ page: Number(b.dataset.fieldPage) }));
el<HTMLInputElement>("field-zoom").addEventListener("input", (event) => {
  el<HTMLImageElement>("field-source-image").style.width =
    `${(event.target as HTMLInputElement).value}%`;
});
el("field-csv").addEventListener("click", () => {
  fieldCsvDownload(state);
  el("field-file-status").textContent =
    "Peg measurements downloaded. Placed and proposed pegs have separate records.";
});
el("field-template").addEventListener("click", () => {
  fieldTemplateDownload(state);
  el("field-file-status").textContent =
    "Paper template downloaded. It restores the selected source procedure and uses a 3 mm paper unit. Print at 100% and check the 30 mm bar.";
});
el("field-save").addEventListener("click", async () => {
  const button = el<HTMLButtonElement>("field-save");
  button.disabled = true;
  el("field-file-status").textContent =
    "Preparing the field reading with verified source pages and fonts…";
  try {
    await fieldStudyDownload(structuredClone(state));
    el("field-file-status").textContent =
      "Illustrated field reading downloaded, including all four source pages and the retained peg choices. It opens offline.";
  } catch (error) {
    el("field-file-status").textContent =
      error instanceof Error
        ? error.message
        : "Reading could not be saved. Reload online and try again.";
  } finally {
    button.disabled = false;
  }
});
el("field-share").addEventListener("click", async () => {
  url();
  const link = location.href;
  try {
    await navigator.clipboard.writeText(link);
    el("field-file-status").textContent =
      "Layout link copied, including each placed peg’s choices.";
  } catch {
    el("field-share-fallback").hidden = false;
    const input = el<HTMLInputElement>("field-share-url");
    input.value = link;
    input.focus();
    input.select();
    el("field-file-status").textContent =
      "Copy the selected link. This browser did not grant clipboard access.";
  }
});
window.addEventListener("popstate", () => {
  parsed = parseField(location.search);
  state = parsed.state;
  render();
});
el<HTMLInputElement>("plan-zoom").addEventListener("input", (event) => {
  zoomPlan((event.target as HTMLInputElement).value);
});
render();
void offlineStatus(el("field-offline"));
