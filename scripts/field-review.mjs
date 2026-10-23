import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import AxeBuilder from "@axe-core/playwright";
import { chromium, firefox } from "playwright";

const root = fileURLToPath(new URL("../", import.meta.url));
const output = path.resolve(process.argv[2] ?? "/tmp/rajju-field");
const external = process.argv[3];
await mkdir(output, { recursive: true });
const result = { base: external ?? "isolated build origins", constructions: [], journeys: [] };
const corners = ["wn", "ws", "en", "es"];
const mime = {
  ".html": "text/html",
  ".css": "text/css",
  ".js": "text/javascript",
  ".jpg": "image/jpeg",
  ".ttf": "font/ttf",
  ".woff2": "font/woff2",
  ".svg": "image/svg+xml",
  ".txt": "text/plain",
};

async function serve() {
  const server = createServer(async (req, res) => {
    try {
      const url = new URL(req.url, "http://local");
      if (!url.pathname.startsWith("/rajju/")) throw new Error("route");
      const file = path.resolve(
        root,
        "dist",
        decodeURIComponent(url.pathname.slice(7)) || "index.html",
      );
      if (!file.startsWith(path.resolve(root, "dist") + path.sep)) throw new Error("path");
      const body = await readFile(file);
      res.writeHead(200, {
        "Content-Type": mime[path.extname(file)] ?? "application/octet-stream",
        "Cache-Control": "no-cache",
      });
      res.end(body);
    } catch {
      res.writeHead(404);
      res.end("Not found");
    }
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  return {
    base: `http://127.0.0.1:${server.address().port}/rajju/`,
    close: async () => {
      server.closeAllConnections();
      await new Promise((resolve) => server.close(resolve));
    },
  };
}
const sha = (b) => createHash("sha256").update(b).digest("hex");
async function slider(page, id, value) {
  await page.locator(id).evaluate((element, v) => {
    element.value = String(v);
    element.dispatchEvent(new Event("input", { bubbles: true }));
  }, value);
}
async function capture(page, engine, width, name) {
  const data = await page.evaluate(() => {
    const svg = document.querySelector("#field-plan svg");
    const point = (selector) => {
      const c = svg.querySelector(selector);
      return {
        x: (Number(c.getAttribute("cx")) - Number(svg.dataset.originX)) / Number(svg.dataset.scale),
        y: (Number(svg.dataset.originY) - Number(c.getAttribute("cy"))) / Number(svg.dataset.scale),
      };
    };
    const cord = svg
      .querySelector('[data-shape="taut-cord"]')
      .getAttribute("d")
      .match(/-?[\d.]+(?:e[+-]?\d+)?/gi)
      .map(Number);
    return {
      search: location.search,
      method: document.querySelector("#field-method").value,
      corner: document.querySelector('[data-corner][aria-pressed="true"]').dataset.corner,
      grip: Number(document.querySelector("#field-grip").value) / 100,
      stake: document.querySelector('input[name="field-stake"]:checked').value,
      peg: point('[data-shape="proposed-peg"]'),
      held: point('[data-shape="grip"]'),
      cordPixels: cord,
      scale: Number(svg.dataset.scale),
      pegCopy: document.querySelector("#peg-error").textContent,
      groundCopy: document.querySelector("#ground-result").textContent,
    };
  });
  result.constructions.push({ engine, width, name, ...data });
  return data;
}
async function download(page, selector, filename) {
  const pending = page.waitForEvent("download");
  await page.locator(selector).click();
  const d = await pending;
  const dest = path.join(output, filename);
  await d.saveAs(dest);
  return { path: dest, bytes: await readFile(dest), suggested: d.suggestedFilename() };
}

for (const [engine, launcher] of [
  ["chromium", chromium],
  ["firefox", firefox],
]) {
  const browser = await launcher.launch();
  try {
    for (const width of [1440, 375]) {
      const service = external ? null : await serve();
      const base = external ?? service.base;
      const context = await browser.newContext({
        viewport: { width, height: 1000 },
        acceptDownloads: true,
      });
      const page = await context.newPage();
      const errors = [];
      page.on("pageerror", (e) => errors.push(e.message));
      try {
        await page.goto(`${base}field.html`);
        await page.evaluate(() => document.fonts.ready);
        await page.waitForFunction(() =>
          document.querySelector("#field-offline").textContent.includes("saved offline"),
        );
        assert.ok(
          await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
        );
        await page.keyboard.press("Tab");
        assert.equal(await page.locator(":focus").textContent(), "Skip to the cord");
        await page.keyboard.press("Enter");
        for (const method of ["one", "345", "51213", "81517"]) {
          await page.locator("#clear-pegs").click();
          await page.locator("#field-method").selectOption(method);
          for (const c of corners) {
            await page.locator(`[data-corner="${c}"]`).click();
            await page.locator("#restore-source").click();
            const data = await capture(page, engine, width, `${method}-${c}`);
            assert.ok(Math.abs(data.peg.x - (c[0] === "w" ? 0 : 36)) < 1e-9);
            assert.ok(
              Math.abs(data.peg.y - (c[0] === "w" ? 15 : 12) * (c[1] === "n" ? 1 : -1)) < 1e-9,
            );
            await page.locator("#place-peg").click();
          }
          assert.match(await page.locator("#ground-result").textContent(), /972 square/);
        }
        await page.locator('[data-corner="en"]').click();
        await page.locator("#field-method").selectOption("one");
        await slider(page, "#field-grip", 1200);
        await capture(page, engine, width, "hold-twelve");
        await page.locator("#restore-source").click();
        await page.locator('input[name="field-stake"][value="grip"]').check();
        await page.locator("#place-peg").click();
        await page.locator('[data-corner="es"]').click();
        await page.locator("#field-method").selectOption("one");
        await page.locator('input[name="field-stake"][value="grip"]').check();
        await page.locator("#place-peg").click();
        assert.match(await page.locator("#ground-result").textContent(), /1,080 square/);
        await page.locator('[data-corner="en"]').click();
        await slider(page, "#field-grip", 1300);
        assert.match(await page.locator("#ground-result").textContent(), /1,080 square/);
        await capture(page, engine, width, "retained-ground-new-proposal");
        const shared = page.url();
        await page.reload();
        assert.equal(page.url(), shared);
        assert.equal(await page.locator("#field-grip").inputValue(), "1300");
        assert.match(await page.locator("#ground-result").textContent(), /1,080 square/);
        const csv = await download(page, "#field-csv", `${engine}-${width}-pegs.csv`);
        assert.match(csv.bytes.toString(), /"proposed","en","one","13","13"/);
        assert.match(csv.bytes.toString(), /"placed","en","one","15","15"/);
        for (const p of [9, 10, 11, 12]) {
          await page.locator(`[data-field-page="${p}"]`).click();
          await page.locator("#field-source-image").evaluate((img) => img.decode());
          assert.match(
            await page.locator("#field-source-image").getAttribute("alt"),
            new RegExp(`page ${p},`),
          );
        }
        await page.locator('[data-field-page="10"]').click();
        await slider(page, "#field-zoom", 300);
        await page.locator("#field-source-pan").focus();
        await page.keyboard.press("ArrowRight");
        await page.waitForFunction(
          () => document.querySelector("#field-source-pan").scrollLeft > 0,
        );
        await slider(page, "#plan-zoom", 250);
        await page.locator("#field-plan").focus();
        await page.keyboard.press("ArrowRight");
        await page.waitForFunction(() => document.querySelector("#field-plan").scrollLeft > 0);
        await slider(page, "#plan-zoom", 100);
        await page.locator("#field-share").click();
        if (await page.locator("#field-share-fallback").isVisible())
          assert.equal(await page.locator("#field-share-url").inputValue(), page.url());
        const reading = await download(
          page,
          "#field-save",
          `${engine}-${width}-field-reading.html`,
        );
        const html = reading.bytes.toString();
        assert.ok(!/<script\b/i.test(html));
        assert.ok(!/src=["']https?:/i.test(html));
        const scans = [...html.matchAll(/src="data:image\/jpeg;base64,([^"]+)"/g)];
        assert.equal(scans.length, 4);
        for (const [i, p] of [9, 10, 11, 12].entries())
          assert.equal(
            sha(Buffer.from(scans[i][1], "base64")),
            sha(
              await readFile(
                path.join(root, `public/sources/thibaut-${String(p).padStart(2, "0")}.jpg`),
              ),
            ),
          );
        const template = await download(
          page,
          "#field-template",
          `${engine}-${width}-paper-cord.svg`,
        );
        assert.match(
          template.bytes.toString(),
          /width="186mm" height="180mm" viewBox="0 0 620 600"/,
        );
        assert.match(template.bytes.toString(), /Hold at 15; stake at 12/);
        assert.match(template.bytes.toString(), /M70,550H170/);
        const accessibility = await new AxeBuilder({ page })
          .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
          .analyze();
        assert.deepEqual(
          accessibility.violations.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.target) })),
          [],
        );
        await page
          .locator("#field-workshop")
          .evaluate((e) => e.scrollIntoView({ block: "start", behavior: "instant" }));
        await page.screenshot({ path: path.join(output, `${engine}-${width}-field.png`) });
        await page.locator("#field-reading").scrollIntoViewIfNeeded();
        await page.screenshot({ path: path.join(output, `${engine}-${width}-source.png`) });
        const saved = await context.newPage();
        const network = [];
        saved.on("request", (r) => {
          if (/^https?:/.test(r.url())) network.push(r.url());
        });
        await saved.goto(`file://${reading.path}`);
        await saved.evaluate(() => document.fonts.ready);
        assert.ok(
          await saved.evaluate(() =>
            [...document.images].every((i) => i.complete && i.naturalWidth > 1000),
          ),
        );
        assert.ok(
          await saved.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
        );
        assert.match(await saved.locator("main").textContent(), /1,080 square/);
        assert.deepEqual(network, []);
        assert.equal(
          await saved.locator(".field-cord").evaluate((e) => getComputedStyle(e).stroke),
          "rgb(23, 60, 81)",
        );
        if (engine === "chromium" && width === 1440)
          await saved.pdf({
            path: path.join(output, "field-reading.pdf"),
            printBackground: true,
            preferCSSPageSize: true,
          });
        await saved.close();
        for (const value of [900, 4500]) {
          await slider(page, "#field-grip", value);
          const c = await capture(page, engine, width, `collinear-${value}`);
          assert.match(c.pegCopy, /collinear; no right angle/);
        }
        await page.locator("#restore-source").click();
        await page.goto(`${base}field.html?placed=wn,one,1500,mark;en,one`);
        assert.equal(await page.locator("#field-issue").isVisible(), true);
        assert.match(await page.locator("#ground-result").textContent(), /0 of four/);
        await page.goto(
          `${base}field.html?corner=en&method=one&grip=1500&stake=mark&placed=wn,one,1500,mark;ws,345,1500,mark;en,51213,1200,mark;es,81517,1200,mark`,
        );
        assert.match(await page.locator("#ground-result").textContent(), /972 square/);
        await page.waitForFunction(() =>
          document.querySelector("#field-offline").textContent.includes("saved offline"),
        );
        const caches = await page.evaluate(async () =>
          Object.fromEntries(
            await Promise.all(
              (await window.caches.keys()).map(async (k) => [
                k,
                (await window.caches.open(k).then((c) => c.keys())).map(
                  (r) => new URL(r.url).pathname,
                ),
              ]),
            ),
          ),
        );
        if (service) await service.close();
        else await context.setOffline(true);
        await page.reload();
        assert.match(await page.locator("#ground-result").textContent(), /972 square/);
        await page.locator(".masthead nav a").filter({ hasText: "Circle & return" }).click();
        await page.locator("#lesson-title").waitFor();
        await page.locator(".masthead a").filter({ hasText: "Lay out a ground" }).click();
        await page.locator("#field-plan svg").waitFor();
        await page.locator('[data-field-page="11"]').click();
        await page.locator("#field-source-image").evaluate((img) => img.decode());
        const offlineReading = await download(
          page,
          "#field-save",
          `${engine}-${width}-offline-field.html`,
        );
        assert.ok(offlineReading.bytes.length > 1000000);
        assert.deepEqual(errors, []);
        result.journeys.push({
          engine,
          width,
          shared,
          sourceScans: 4,
          readingSha256: sha(reading.bytes),
          templateSha256: sha(template.bytes),
          csvSha256: sha(csv.bytes),
          axeViolations: accessibility.violations.length,
          caches,
          offline:
            "reload, both rooms, new source page and complete reading with local origin closed or external network offline",
          errors,
        });
        console.log(
          `${engine} ${width}: source procedures, retained pegs, downloads and offline rooms passed`,
        );
      } finally {
        await context.close();
        if (service?.base) {
          try {
            await service.close();
          } catch {}
        }
      }
    }
  } finally {
    await browser.close();
  }
}
await writeFile(path.join(output, "review.json"), `${JSON.stringify(result, null, 2)}\n`);
console.log(`Reviewed ${result.constructions.length} rendered constructions.`);
