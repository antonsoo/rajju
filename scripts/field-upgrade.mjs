import assert from "node:assert/strict";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium, firefox } from "playwright";

const root = fileURLToPath(new URL("../", import.meta.url));
if (!process.argv[2])
  throw new Error(
    "Usage: node scripts/field-upgrade.mjs <initial-edition-dist> [output-directory]",
  );
const old = path.resolve(process.argv[2]);
const output = path.resolve(process.argv[3] ?? "/tmp/rajju-upgrade");
await mkdir(output, { recursive: true });
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
const results = [];
for (const [engine, launcher] of [
  ["chromium", chromium],
  ["firefox", firefox],
]) {
  const browser = await launcher.launch();
  try {
    for (const scenario of ["slow", "substituted"]) {
      let current = old;
      let mode = "valid";
      let selectedRequests = 0;
      let release;
      const held = new Promise((resolve) => {
        release = resolve;
      });
      const server = createServer(async (req, res) => {
        try {
          const u = new URL(req.url, "http://local");
          if (!u.pathname.startsWith("/rajju/")) throw new Error("route");
          let name = decodeURIComponent(u.pathname.slice(7)) || "index.html";
          if (current !== old && name === "sources/thibaut-11.jpg") {
            selectedRequests++;
            if (mode === "slow") await held;
            if (mode === "substituted") name = "sources/thibaut-10.jpg";
          }
          const file = path.resolve(current, name);
          if (!file.startsWith(current + path.sep)) throw new Error("path");
          const body = await readFile(file);
          res.writeHead(200, {
            "Content-Type": mime[path.extname(file)] ?? "application/octet-stream",
            "Cache-Control": "no-store",
          });
          res.end(body);
        } catch {
          res.writeHead(404);
          res.end("Not found");
        }
      });
      await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
      const base = `http://127.0.0.1:${server.address().port}/rajju/`;
      const context = await browser.newContext({ acceptDownloads: true });
      const page = await context.newPage();
      const inspect = () =>
        page.evaluate(async () =>
          Object.fromEntries(
            await Promise.all(
              (await caches.keys()).map(async (k) => [
                k,
                (await caches.open(k).then((c) => c.keys())).map((r) => new URL(r.url).pathname),
              ]),
            ),
          ),
        );
      try {
        await page.goto(`${base}?lesson=diagonal&stage=3&side=1000`);
        await page.waitForFunction(() =>
          document.querySelector("#offline-status").textContent.includes("saved offline"),
        );
        const before = await inspect();
        const oldKey = Object.keys(before).find((k) => k.startsWith("rajju-"));
        assert.ok(oldKey);
        current = path.resolve(root, "dist");
        mode = scenario;
        await page.evaluate(async () => {
          await (await navigator.serviceWorker.getRegistration()).update();
        });
        await page.waitForFunction(
          () =>
            document.querySelector("#offline-status").textContent.includes("Downloading") ||
            document.querySelector("#offline-status").textContent.includes("saved offline"),
        );
        const field = await context.newPage();
        await field.goto(`${base}field.html?corner=en`);
        let refused;
        if (scenario === "slow") {
          await new Promise((resolve) => setTimeout(resolve, 5000));
          assert.ok(selectedRequests > 0);
          refused = await field.locator("#field-offline").textContent();
          assert.ok(!refused.includes("saved offline"));
          const mid = await inspect();
          assert.ok(mid[oldKey]?.length === before[oldKey].length);
          mode = "valid";
          release();
        } else {
          await field.waitForFunction(() =>
            /different offline edition|incomplete|unavailable/.test(
              document.querySelector("#field-offline").textContent,
            ),
          );
          refused = await field.locator("#field-offline").textContent();
          assert.ok(!refused.includes("saved offline"));
          const mid = await inspect();
          assert.ok(mid[oldKey]?.length === before[oldKey].length);
          mode = "valid";
          await field.evaluate(async () => {
            await (await navigator.serviceWorker.getRegistration()).update();
          });
        }
        await field.waitForFunction(
          () => document.querySelector("#field-offline").textContent.includes("saved offline"),
          null,
          { timeout: 30000 },
        );
        const oldPageStatus = await page.locator("#offline-status").textContent();
        assert.ok(!oldPageStatus.includes("saved offline"));
        const after = await inspect();
        assert.equal(Object.keys(after).length, 1);
        assert.ok(!after[oldKey]);
        const nextKey = Object.keys(after)[0];
        assert.ok(after[nextKey].includes("/rajju/field.html"));
        assert.ok(after[nextKey].includes("/rajju/sources/thibaut-11.jpg"));
        await page.reload();
        await page.waitForFunction(() =>
          document.querySelector("#offline-status").textContent.includes("saved offline"),
        );
        server.closeAllConnections();
        await new Promise((resolve) => server.close(resolve));
        await field.reload();
        await field.locator("#field-plan svg").waitFor();
        assert.match(await field.locator("#peg-error").textContent(), /Position \(36, 12\)/);
        await field.locator('[data-field-page="11"]').click();
        await field.locator("#field-source-image").evaluate((img) => img.decode());
        const pending = field.waitForEvent("download");
        await field.locator("#field-save").click();
        const d = await pending;
        await d.saveAs(path.join(output, `${engine}-${scenario}-field.html`));
        await page.reload();
        await page.locator("#lesson-title").waitFor();
        assert.match(await page.locator("#lesson-title").textContent(), /diagonal/);
        results.push({
          engine,
          scenario,
          oldCache: oldKey,
          oldFileCount: before[oldKey].length,
          pendingOrRefused: refused,
          oldPageAfterActivation: oldPageStatus,
          newCache: nextKey,
          newFileCount: after[nextKey].length,
          offline:
            "both rooms reload, new scan decodes, complete field reading downloads after origin closes",
        });
        console.log(`${engine} ${scenario}: first public edition upgraded to both rooms`);
        await field.close();
      } finally {
        release();
        await context.close();
        server.closeAllConnections();
        await new Promise((resolve) => server.close(resolve));
      }
    }
  } finally {
    await browser.close();
  }
}
await writeFile(path.join(output, "review.json"), `${JSON.stringify(results, null, 2)}\n`);
