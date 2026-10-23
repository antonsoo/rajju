import assert from "node:assert/strict";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { chromium, firefox } from "playwright";

const base = process.argv[2] ?? "http://127.0.0.1:4392/rajju/";
const output = path.resolve(process.argv[3] ?? "/tmp/rajju-development");
await mkdir(output, { recursive: true });
const result = [];
for (const [engine, launcher] of [
  ["chromium", chromium],
  ["firefox", firefox],
]) {
  const browser = await launcher.launch();
  try {
    for (const width of [1440, 375]) {
      const context = await browser.newContext({
        viewport: { width, height: 1000 },
        acceptDownloads: true,
      });
      const page = await context.newPage();
      const errors = [];
      page.on("pageerror", (error) => errors.push(error.message));
      await page.goto(base);
      await page.evaluate(() => document.fonts.ready);
      assert.equal(await page.locator("#offline-status").textContent(), "Development preview");
      assert.equal(
        await page.evaluate(async () => (await navigator.serviceWorker.getRegistrations()).length),
        0,
      );
      for (const lesson of ["circle", "diagonal"]) {
        await page.locator(`#${lesson}-tab`).click();
        const drawing = await page
          .locator("#main-drawing .active-cord")
          .first()
          .evaluate((el) => ({
            stroke: getComputedStyle(el).stroke,
            width: getComputedStyle(el).strokeWidth,
          }));
        assert.notEqual(drawing.stroke, "none");
        assert.ok(Number.parseFloat(drawing.width) >= 5);
        assert.ok(
          await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
        );
        const step = lesson === "circle" ? "step" : "stage";
        await page.locator(`[data-${step}="2"]`).focus();
        await page.keyboard.press("Enter");
        assert.equal(await page.locator(`[data-${step}="2"]`).getAttribute("aria-pressed"), "true");
        await page.locator(`[data-${step}="3"]`).click();
        const pending = page.waitForEvent("download");
        await page.locator("#save").click();
        const download = await pending;
        const filename = path.join(output, `${engine}-${width}-${lesson}.html`);
        await download.saveAs(filename);
        const html = await readFile(filename, "utf8");
        assert.equal([...html.matchAll(/src="data:image\/jpeg/g)].length, 9);
        assert.ok(!/<script\b/.test(html));
        await page.evaluate(() => window.scrollTo(0, 0));
        await page.mouse.move(0, 0);
        await page.screenshot({ path: path.join(output, `${engine}-${width}-${lesson}.png`) });
        result.push({
          engine,
          width,
          lesson,
          drawing,
          sourcePagesEmbedded: 9,
          serviceWorkerRegistrations: 0,
          standaloneDownload: true,
        });
      }
      assert.deepEqual(errors, []);
      await context.close();
    }
  } finally {
    await browser.close();
  }
}
await writeFile(path.join(output, "development.json"), `${JSON.stringify(result, null, 2)}\n`);
process.stdout.write(
  `${result.length} development journeys: rendered drawings, keyboard and real illustrated downloads checked\n`,
);
