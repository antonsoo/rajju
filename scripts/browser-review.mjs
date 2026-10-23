import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import AxeBuilder from "@axe-core/playwright";
import { chromium, firefox } from "playwright";

const root = fileURLToPath(new URL("../", import.meta.url));
const output = path.resolve(process.argv[2] ?? "/tmp/rajju-browser");
const external = process.argv[3];
await mkdir(output, { recursive: true });
const result = {
  base: external ?? "isolated local build origins",
  constructions: [],
  journeys: [],
  saved: [],
};

const mime = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".jpg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ttf": "font/ttf",
  ".woff2": "font/woff2",
  ".txt": "text/plain",
};
async function serve() {
  const server = createServer(async (req, res) => {
    try {
      const url = new URL(req.url ?? "/", "http://local");
      if (!url.pathname.startsWith("/rajju/")) throw new Error("route");
      const name = decodeURIComponent(url.pathname.slice(7)) || "index.html";
      const file = path.resolve(root, "dist", name);
      if (!file.startsWith(path.resolve(root, "dist") + path.sep)) throw new Error("path");
      const bytes = await readFile(file);
      res.writeHead(200, {
        "Content-Type": mime[path.extname(file)] ?? "application/octet-stream",
        "Cache-Control": "no-cache",
      });
      res.end(bytes);
    } catch {
      res.writeHead(404);
      res.end("Not found");
    }
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const base = `http://127.0.0.1:${server.address().port}/rajju/`;
  return {
    base,
    close: async () => {
      server.closeAllConnections();
      await new Promise((resolve) => server.close(resolve));
    },
  };
}

function csvRows(text) {
  const rows = [];
  let row = [],
    field = "",
    quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"') {
      if (quoted && text[i + 1] === '"') {
        field += '"';
        i++;
      } else quoted = !quoted;
    } else if (c === "," && !quoted) {
      row.push(field);
      field = "";
    } else if (c === "\n" && !quoted) {
      row.push(field.replace(/\r$/, ""));
      rows.push(row);
      row = [];
      field = "";
    } else if (c !== "\r" || quoted) field += c;
  }
  assert.equal(quoted, false);
  const header = rows.shift();
  return rows.map((r) => Object.fromEntries(header.map((key, i) => [key, r[i]])));
}

async function captureConstruction(page, engine, width, name) {
  const state = await page.evaluate(() => ({
    lesson:
      document.querySelector("#diagonal-tab").getAttribute("aria-current") === "page"
        ? "diagonal"
        : "circle",
    side: Number(document.querySelector("#side").value),
    rule: document.querySelector('input[name="radius-rule"]:checked').value,
    kept: Number(document.querySelector("#kept").value),
    returnRule: document.querySelector("#return-rule").value,
    stage: Number(document.querySelector('[data-stage][aria-pressed="true"]').dataset.stage),
  }));
  const svg = await page.evaluate((lesson) => {
    const drawing = document.querySelector(`#main-drawing svg`);
    if (lesson === "circle") {
      const back = document.querySelector("#return-drawing svg");
      return {
        scale: Number(drawing.dataset.scale),
        radius: Number(
          drawing.querySelector('[data-shape="constructed-circle"]').getAttribute("r"),
        ),
        squareWidth: Number(
          drawing.querySelector('[data-shape="original-square"]').getAttribute("width"),
        ),
        returnScale: Number(back.dataset.scale),
        returnedWidth: Number(
          back.querySelector('[data-shape="returned-square"]').getAttribute("width"),
        ),
      };
    }
    const points = drawing
      .querySelector('[data-shape="numerical-square"]')
      .getAttribute("points")
      .trim()
      .split(/\s+/)
      .map((p) => p.split(",").map(Number));
    return { scale: Number(drawing.dataset.scale), points };
  }, state.lesson);
  const pending = page.waitForEvent("download");
  await page.locator("#csv").click();
  const download = await pending;
  const filename = path.join(output, `${engine}-${width}-${name}.csv`);
  await download.saveAs(filename);
  const csv = csvRows(await readFile(filename, "utf8"));
  result.constructions.push({ engine, width, name, state, svg, csv });
}

async function saveAndInspect(page, context, engine, width, lesson) {
  const pending = page.waitForEvent("download");
  await page.locator("#save").click();
  const download = await pending;
  const filename = path.join(output, `${engine}-${width}-${lesson}-reading.html`);
  await download.saveAs(filename);
  await page
    .locator("#file-status")
    .filter({ hasText: "Illustrated reading downloaded" })
    .waitFor();
  const html = await readFile(filename, "utf8");
  assert.ok(!/<script\b/i.test(html));
  assert.ok(!/src=["']https?:/i.test(html));
  const sources = [...html.matchAll(/src="data:image\/jpeg;base64,([^"]+)"/g)];
  assert.equal(sources.length, 9);
  const expectedPages = [6, 7, 12, 13, 14, 15, 26, 27, 28];
  for (let i = 0; i < sources.length; i++) {
    const actual = Buffer.from(sources[i][1], "base64");
    const expected = await readFile(
      path.join(root, "public/sources", `thibaut-${String(expectedPages[i]).padStart(2, "0")}.jpg`),
    );
    assert.equal(
      createHash("sha256").update(actual).digest("hex"),
      createHash("sha256").update(expected).digest("hex"),
    );
  }
  const saved = await context.newPage();
  const network = [];
  saved.on("request", (r) => {
    if (/^https?:/.test(r.url())) network.push(r.url());
  });
  await saved.goto(`file://${filename}`);
  await saved.evaluate(() => document.fonts.ready);
  assert.equal(await saved.locator("figure img").count(), 9);
  assert.ok(
    await saved.evaluate(() =>
      [...document.images].every((img) => img.complete && img.naturalWidth > 1000),
    ),
  );
  assert.ok(await saved.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
  assert.deepEqual(network, []);
  const css = await saved
    .locator(".plate svg .active-cord")
    .first()
    .evaluate((el) => ({
      stroke: getComputedStyle(el).stroke,
      width: getComputedStyle(el).strokeWidth,
    }));
  assert.equal(css.width, "5px");
  assert.notEqual(css.stroke, "none");
  const embeddedCsv = await saved.locator("a[download]").getAttribute("href");
  assert.ok(
    decodeURIComponent(embeddedCsv.split(",").slice(1).join(",")).includes(`"lesson","${lesson}"`),
  );
  if (engine === "chromium" && width === 1440) {
    await saved.pdf({
      path: path.join(output, `${lesson}-reading.pdf`),
      format: "A4",
      printBackground: true,
      preferCSSPageSize: true,
    });
    await saved.screenshot({ path: path.join(output, `${lesson}-saved-reading.png`) });
  }
  await saved.close();
  result.saved.push({
    engine,
    width,
    lesson,
    bytes: Buffer.byteLength(html),
    completeSourcePages: 9,
    verifiedSourceHashes: 9,
    independentFileOpened: true,
    externalRequests: network.length,
  });
}

for (const [engine, launcher] of [
  ["chromium", chromium],
  ["firefox", firefox],
]) {
  const browser = await launcher.launch({ headless: true });
  try {
    for (const width of [1440, 375]) {
      const origin = external ? null : await serve();
      const base = external ?? origin.base;
      const context = await browser.newContext({
        viewport: { width, height: width === 375 ? 900 : 1050 },
        acceptDownloads: true,
        reducedMotion: "reduce",
      });
      const page = await context.newPage();
      const errors = [];
      const externalRequests = [];
      page.on("pageerror", (e) => errors.push(e.message));
      page.on("request", (r) => {
        if (/^https?:/.test(r.url()) && !r.url().startsWith(new URL(base).origin))
          externalRequests.push(r.url());
      });
      try {
        await page.goto(`${base}?utm_source=review`);
        await page.evaluate(() => document.fonts.ready);
        await page.waitForFunction(
          () => document.querySelector("#offline-status").textContent.includes("saved offline"),
          null,
          { timeout: 45000 },
        );
        assert.ok(
          await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
        );
        assert.ok(await page.evaluate(() => document.fonts.check("24px Devanagari")));
        await captureConstruction(page, engine, width, "source-third");
        await page.evaluate(() => window.scrollTo(0, 0));
        await page.mouse.move(0, 0);
        await page.screenshot({ path: path.join(output, `${engine}-${width}-circle.png`) });
        await page
          .locator("#main-drawing")
          .screenshot({ path: path.join(output, `${engine}-${width}-plan.png`) });
        const circleAxe = await new AxeBuilder({ page })
          .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
          .analyze();
        assert.deepEqual(
          circleAxe.violations,
          [],
          JSON.stringify(
            circleAxe.violations.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.target) })),
          ),
        );
        await page.locator('[data-step="0"]').focus();
        await page.keyboard.press("Enter");
        assert.equal(await page.locator('[data-step="0"]').getAttribute("aria-pressed"), "true");
        assert.equal(await page.evaluate(() => document.activeElement?.dataset.step), "0");
        for (const step of [1, 2, 3]) await page.locator(`[data-step="${step}"]`).click();
        await page.locator("#side").fill("99");
        await page.locator("#side").press("Tab");
        assert.match(await page.locator("#side-error").textContent(), /whole number/);
        assert.equal(await page.locator("#main-drawing svg").getAttribute("data-side-mm"), "1000");
        await page.locator("#side").fill("7333");
        await page.locator("#side").press("Tab");
        await captureConstruction(page, engine, width, "rescaled-source");
        await page.locator('input[value="equal"]').check();
        await captureConstruction(page, engine, width, "equal-area");
        await page.locator('input[value="custom"]').check();
        await page.locator("#kept").focus();
        await page.keyboard.press("Home");
        await captureConstruction(page, engine, width, "inscribed");
        await page.locator("#kept").focus();
        await page.keyboard.press("End");
        await captureConstruction(page, engine, width, "circumscribed");
        await page.locator("#kept").fill("333");
        await captureConstruction(page, engine, width, "custom-third");
        await page.locator("#return-rule").selectOption("simple");
        await captureConstruction(page, engine, width, "short-return");
        await page.locator("#read-return").click();
        assert.equal(await page.locator("#passage").inputValue(), "simple");
        assert.match(await page.locator("#scan-title").textContent(), /28/);
        await page.locator("#passage").selectOption("circle");
        await page.locator('[data-word="east"]').focus();
        await page.keyboard.press("Enter");
        assert.match(await page.locator("#word-note").textContent(), /eastward line/);
        assert.equal(await page.locator("#main-drawing").getAttribute("data-highlight"), "east");
        assert.equal(await page.evaluate(() => document.activeElement?.dataset.word), "east");
        await page.locator("#zoom").focus();
        await page.keyboard.press("End");
        assert.equal(
          await page.locator("#source-image").evaluate((img) => img.style.width),
          "300%",
        );
        await page.locator("#source-pan").focus();
        await page.keyboard.press("ArrowRight");
        await page.waitForFunction(() => document.querySelector("#source-pan").scrollLeft > 0);
        await page.locator("#zoom").fill("100");
        await page
          .locator("#reading")
          .screenshot({ path: path.join(output, `${engine}-${width}-reading.png`) });
        await page.locator("#side").fill("1000");
        await page.locator("#side").press("Tab");
        await page.locator('input[value="third"]').check();
        await page.locator("#return-rule").selectOption("detailed");
        await saveAndInspect(page, context, engine, width, "circle");
        // Force the genuine clipboard-denied path and inspect the copyable URL.
        await page.evaluate(() => {
          Object.defineProperty(navigator, "clipboard", {
            configurable: true,
            value: {
              writeText: async () => {
                throw new Error("Denied for review");
              },
            },
          });
        });
        await page.locator("#share").click();
        const shared = new URL(await page.locator("#share-url").inputValue());
        assert.equal(shared.searchParams.get("utm_source"), "review");
        assert.equal(shared.searchParams.get("side"), "1000");
        assert.equal(
          await page
            .locator("#share-url")
            .evaluate((el) => el.selectionStart === 0 && el.selectionEnd === el.value.length),
          true,
        );
        await page.locator("#diagonal-tab").click();
        assert.equal(await page.locator("#passage").inputValue(), "diagonal");
        for (const stage of [0, 1, 2, 3]) {
          await page.locator(`[data-stage="${stage}"]`).focus();
          await page.keyboard.press("Enter");
          await captureConstruction(page, engine, width, `diagonal-${stage}`);
        }
        await page.evaluate(() => window.scrollTo(0, 0));
        await page.mouse.move(0, 0);
        await page.screenshot({ path: path.join(output, `${engine}-${width}-diagonal.png`) });
        await page
          .locator("#main-drawing")
          .screenshot({ path: path.join(output, `${engine}-${width}-diagonal-plan.png`) });
        const diagonalAxe = await new AxeBuilder({ page })
          .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
          .analyze();
        assert.deepEqual(diagonalAxe.violations, []);
        await page.goBack();
        assert.equal(await page.locator('[data-stage="2"]').getAttribute("aria-pressed"), "true");
        await page.goForward();
        assert.equal(await page.locator('[data-stage="3"]').getAttribute("aria-pressed"), "true");
        await saveAndInspect(page, context, engine, width, "diagonal");
        await page.goto(`${base}?side=2000&side=3000&lesson=diagonal`);
        assert.match(await page.locator("#link-issue").textContent(), /conflicting or invalid/);
        assert.equal(await page.locator("#side").inputValue(), "1000");
        assert.equal(await page.locator("#circle-tab").getAttribute("aria-current"), "page");
        await page.goto(shared.href);
        await page.waitForFunction(() =>
          document.querySelector("#offline-status").textContent.includes("saved offline"),
        );
        if (origin) await origin.close();
        await context.setOffline(true);
        await page.reload();
        await page.waitForFunction(() =>
          document.querySelector("#offline-status").textContent.includes("saved offline"),
        );
        await page.locator("#diagonal-tab").click();
        await page.locator('[data-page="15"]').click();
        await page.waitForFunction(
          () =>
            document.querySelector("#source-image").complete &&
            document.querySelector("#source-image").naturalWidth > 1000,
        );
        await saveAndInspect(page, context, engine, width, "diagonal");
        await page.screenshot({ path: path.join(output, `${engine}-${width}-offline.png`) });
        assert.deepEqual(errors, []);
        assert.deepEqual(externalRequests, []);
        result.journeys.push({
          engine,
          width,
          circleAxeViolations: circleAxe.violations.length,
          diagonalAxeViolations: diagonalAxe.violations.length,
          keyboard: true,
          sourceZoomAndPan: true,
          clipboardFallback: true,
          history: true,
          invalidLinkReset: true,
          offlineReload: true,
          originClosed: Boolean(origin),
          sourcePageOffline: 15,
          offlineReadingDownload: true,
          pageErrors: errors,
          externalRequests,
        });
        process.stdout.write(
          `${engine} ${width}: construction, readings, downloads, keyboard and offline journey passed\n`,
        );
      } finally {
        await context.close();
        if (origin?.base) await origin.close().catch(() => {});
      }
    }
  } finally {
    await browser.close();
  }
}
await writeFile(path.join(output, "browser.json"), `${JSON.stringify(result, null, 2)}\n`);
process.stdout.write(
  `${result.constructions.length} measured constructions; receipt ${path.join(output, "browser.json")}\n`,
);
