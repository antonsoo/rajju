import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import AxeBuilder from "@axe-core/playwright";
import { chromium, firefox } from "playwright";

const root = fileURLToPath(new URL("../", import.meta.url));
const output = path.resolve(process.argv[2] ?? "/tmp/claude-1000/rajju-cord-errors");
await mkdir(output, { recursive: true });
const receipt = { cases: [], journeys: [] };
const methods = ["one", "345", "51213", "81517"];
const sha = (b) => createHash("sha256").update(b).digest("hex");
const mime = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".ttf": "font/ttf",
  ".woff2": "font/woff2",
  ".jpg": "image/jpeg",
  ".svg": "image/svg+xml",
};
async function serve() {
  const server = createServer(async (req, res) => {
    try {
      const url = new URL(req.url, "http://local");
      if (!url.pathname.startsWith("/rajju/")) throw new Error("route");
      const file = path.resolve(root, "dist", url.pathname.slice(7) || "index.html");
      if (!file.startsWith(path.join(root, "dist") + path.sep)) throw new Error("path");
      const body = await readFile(file);
      res.writeHead(200, {
        "Content-Type": mime[path.extname(file)] ?? "text/plain",
        "Cache-Control": "no-cache",
      });
      res.end(body);
    } catch {
      res.writeHead(404).end();
    }
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  return {
    base: `http://127.0.0.1:${server.address().port}/rajju/`,
    close: () =>
      new Promise((resolve) => {
        server.closeAllConnections();
        server.close(resolve);
      }),
  };
}
async function slider(page, id, value) {
  await page.locator(id).evaluate((e, v) => {
    e.value = String(v);
    e.dispatchEvent(new Event("input", { bubbles: true }));
  }, value);
}
async function capture(page, engine, width) {
  const data = await page.evaluate(() => {
    const svg = document.querySelector("#error-drawing svg");
    const scale = Number(svg.dataset.scale);
    const symbols = {};
    for (const g of svg.querySelectorAll("g[data-method]")) {
      const line = g
        .querySelector(".error-leader")
        .getAttribute("d")
        .match(/-?[\d.]+(?:e[+-]?\d+)?/gi)
        .map(Number);
      // Measure the actual rendered leader endpoint, not the model data-dx/dy.
      symbols[g.dataset.method] = { dx: (line[2] - 240) / scale, dy: (220 - line[3]) / scale };
    }
    const rows = [...document.querySelectorAll("#error-table tbody tr")].map((tr) => ({
      method: tr.dataset.errorMethod,
      cells: [...tr.cells].map((c) => c.textContent),
    }));
    return {
      corner: document.querySelector("#error-corner-select").value,
      nearError: Number(document.querySelector("#error-near").value),
      farError: Number(document.querySelector("#error-far").value),
      methods: rows.map((r) => r.method),
      rows,
      symbols,
    };
  });
  assert.deepEqual(data.methods, methods);
  receipt.cases.push({ engine, width, ...data });
}
async function download(page, selector, destination) {
  const pending = page.waitForEvent("download");
  await page.locator(selector).click();
  const file = await pending;
  await file.saveAs(destination);
  return readFile(destination);
}
for (const [engine, launcher] of [
  ["chromium", chromium],
  ["firefox", firefox],
]) {
  const browser = await launcher.launch();
  try {
    for (const width of [1440, 375]) {
      const server = await serve();
      const context = await browser.newContext({
        viewport: { width, height: 1100 },
        acceptDownloads: true,
      });
      const page = await context.newPage();
      const errors = [];
      const outside = [];
      page.on("pageerror", (e) => errors.push(e.message));
      page.on("request", (r) => {
        if (/^https?:/.test(r.url()) && !r.url().startsWith(server.base)) outside.push(r.url());
      });
      let stopped = false;
      try {
        await page.goto(`${server.base}field.html`);
        await page.locator("#cord-errors").waitFor();
        await page.locator('[data-corner="wn"]').click();
        await page.locator("#place-peg").click();
        await page.locator('[data-corner="en"]').click();
        await page.locator("#place-peg").click();
        const placed = new URL(page.url()).searchParams.get("placed");
        await page.locator("#field-grip").focus();
        await page.keyboard.press("ArrowRight");
        const proposal = await page.locator("#field-grip").inputValue();
        await page.locator('[data-errors="10,0"]').click();
        assert.equal(await page.locator("#field-grip").inputValue(), proposal);
        assert.equal(new URL(page.url()).searchParams.get("placed"), placed);
        await page.locator("#error-near").focus();
        await page.keyboard.press("ArrowRight");
        assert.equal(await page.locator("#error-near").inputValue(), "11");
        assert.equal(
          await page.locator("#error-near").evaluate((e) => document.activeElement === e),
          true,
        );
        await page.locator('[data-errors="10,0"]').click();
        await page.locator('[data-errors="10,-10"]').click();
        await page.goBack();
        assert.equal(await page.locator("#error-far").inputValue(), "0");
        await page.goForward();
        assert.equal(await page.locator("#error-far").inputValue(), "-10");
        for (const corner of ["wn", "ws", "en", "es"]) {
          await page.locator("#error-corner-select").selectOption(corner);
          for (const [near, far] of [
            [0, 0],
            [10, 0],
            [10, -10],
            [-300, 300],
            [300, -300],
            [0, 10],
            [-1, 1],
          ]) {
            await slider(page, "#error-near", near);
            await slider(page, "#error-far", far);
            await capture(page, engine, width);
          }
        }
        await page.locator("#error-corner-select").selectOption("en");
        await page.locator('[data-errors="10,0"]').click();
        await page.evaluate(() => document.fonts.ready);
        await page.locator("#cord-errors").evaluate((e) => e.scrollIntoView({ block: "start" }));
        await page.screenshot({ path: path.join(output, `${engine}-${width}-bench.png`) });
        if (width === 375) {
          await page.locator("#error-drawing").scrollIntoViewIfNeeded();
          await page.screenshot({ path: path.join(output, `${engine}-${width}-plot.png`) });
        }
        assert.equal(
          await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
          true,
        );
        const axe = await new AxeBuilder({ page })
          .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
          .analyze();
        assert.deepEqual(
          axe.violations.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.target) })),
          [],
        );
        // Every column remains reachable by keyboard on phone widths.
        const scroll = page.locator("#error-table");
        await scroll.focus();
        await page.keyboard.press("End");
        if (width === 375) {
          await page.keyboard.press("ArrowRight");
          await page.waitForFunction(() => document.querySelector("#error-table").scrollLeft > 0);
        }
        const csvPath = path.join(output, `${engine}-${width}-errors.csv`);
        const csv = await download(page, "#error-csv", csvPath);
        const shared = page.url();
        await page.reload();
        assert.equal(await page.locator("#error-near").inputValue(), "10");
        assert.equal(new URL(page.url()).searchParams.get("placed"), placed);
        await page.locator("#error-source-link").click();
        assert.match(await page.locator("#field-scan-title").textContent(), /11/);
        await page.locator("#field-source-image").evaluate((img) => img.decode());
        const scan = await page.locator("#field-source-image").evaluate(async (img) => {
          const bytes = await fetch(img.src).then((r) => r.arrayBuffer());
          const digest = await crypto.subtle.digest("SHA-256", bytes);
          return {
            width: img.naturalWidth,
            sha256: [...new Uint8Array(digest)]
              .map((n) => n.toString(16).padStart(2, "0"))
              .join(""),
          };
        });
        assert.equal(
          scan.sha256,
          sha(await readFile(path.join(root, "public/sources/thibaut-11.jpg"))),
        );
        const readingPath = path.join(output, `${engine}-${width}-reading.html`);
        const reading = await download(page, "#field-save", readingPath);
        assert.ok(reading.includes(Buffer.from("Same error. Different miss.")));
        assert.ok(!/<script\b/i.test(reading.toString()));
        const saved = await context.newPage();
        const savedRequests = [];
        saved.on("request", (r) => {
          if (/^https?:/.test(r.url())) savedRequests.push(r.url());
        });
        await saved.goto(`file://${readingPath}`);
        await saved.evaluate(() => document.fonts.ready);
        assert.equal(await saved.locator(".cord-error-study tbody tr").count(), 4);
        assert.equal(
          await saved.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
          true,
        );
        const savedCsvPath = path.join(output, `${engine}-${width}-saved-errors.csv`);
        const savedCsv = await download(saved, 'a[download="rajju-cord-errors.csv"]', savedCsvPath);
        assert.equal(sha(savedCsv), sha(csv));
        const savedScans = [
          ...reading.toString().matchAll(/src="data:image\/jpeg;base64,([^"]+)"/g),
        ];
        assert.equal(savedScans.length, 4);
        for (const [i, n] of [9, 10, 11, 12].entries())
          assert.equal(
            sha(Buffer.from(savedScans[i][1], "base64")),
            sha(
              await readFile(
                path.join(root, `public/sources/thibaut-${n.toString().padStart(2, "0")}.jpg`),
              ),
            ),
          );
        assert.deepEqual(savedRequests, []);
        if (engine === "chromium" && width === 1440)
          await saved.pdf({
            path: path.join(output, "reading.pdf"),
            printBackground: true,
            preferCSSPageSize: true,
            tagged: true,
            outline: true,
          });
        await saved.close();
        await page.waitForFunction(() =>
          document.querySelector("#field-offline").textContent.includes("saved offline"),
        );
        await server.close();
        stopped = true;
        await page.reload();
        assert.equal(await page.locator("#error-near").inputValue(), "10");
        await page.locator('[data-errors="-300,300"]').click();
        assert.match(
          await page.locator('[data-error-method="51213"]').textContent(),
          /Cannot reach/,
        );
        await page.locator('[data-errors="0,0"]').click();
        assert.match(
          await page.locator("#error-summary").textContent(),
          /all four procedures reach/,
        );
        const offlinePath = path.join(output, `${engine}-${width}-offline-reading.html`);
        await download(page, "#field-save", offlinePath);
        await page.goto(`${server.base}field.html?nearerr=301&placed=wn,one,1500,mark`);
        assert.equal(await page.locator("#field-issue").isVisible(), true);
        assert.equal(await page.locator("#error-near").inputValue(), "0");
        assert.match(await page.locator("#ground-result").textContent(), /0 of four/);
        assert.deepEqual(errors, []);
        assert.deepEqual(outside, []);
        receipt.journeys.push({
          engine,
          width,
          shared,
          csv: csvPath,
          savedCsv: savedCsvPath,
          reading: readingPath,
          readingSha256: sha(reading),
          sourcePage: scan,
          axeViolations: axe.violations.length,
          offline:
            "origin closed; reload, perturb, reset, save complete reading, reject malformed link",
          errors,
          outside,
          savedRequests,
        });
        console.log(
          `${engine} ${width}: comparison, retained state, native downloads, source, offline passed`,
        );
      } finally {
        await context.close();
        if (!stopped) await server.close();
      }
    }
  } finally {
    await browser.close();
  }
}
await writeFile(path.join(output, "receipt.json"), `${JSON.stringify(receipt, null, 2)}\n`);
console.log(
  `${receipt.cases.length} operated comparison states; receipt ${path.join(output, "receipt.json")}`,
);
