import assert from "node:assert/strict";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium, firefox } from "playwright";

const root = fileURLToPath(new URL("../", import.meta.url));
const output = path.resolve(process.argv[2] ?? "/tmp/rajju-offline");
await mkdir(output, { recursive: true });
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
const result = [];

for (const [engine, launcher] of [
  ["chromium", chromium],
  ["firefox", firefox],
]) {
  const browser = await launcher.launch();
  try {
    for (const scenario of ["slow", "substituted"]) {
      let mode = scenario;
      let release;
      const held = new Promise((resolve) => {
        release = resolve;
      });
      let selectedRequests = 0;
      const server = createServer(async (req, res) => {
        try {
          const url = new URL(req.url ?? "/", "http://local");
          if (!url.pathname.startsWith("/rajju/")) throw new Error("route");
          let name = decodeURIComponent(url.pathname.slice(7)) || "index.html";
          if (name === "sources/thibaut-12.jpg") {
            selectedRequests++;
            if (mode === "slow") await held;
            if (mode === "substituted") name = "sources/thibaut-13.jpg";
          }
          const file = path.resolve(root, "dist", name);
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
      const base = `http://127.0.0.1:${server.address().port}/rajju/`;
      const context = await browser.newContext({ acceptDownloads: true });
      const page = await context.newPage();
      const downloads = [];
      page.on("download", (d) => downloads.push(d));
      try {
        await page.goto(base);
        await page.waitForFunction(() =>
          document.querySelector("#lesson-title")?.textContent.includes("circle"),
        );
        let pendingStatus = "";
        if (scenario === "slow") {
          await new Promise((resolve) => setTimeout(resolve, 9000));
          assert.ok(selectedRequests > 0);
          pendingStatus = await page.locator("#offline-status").textContent();
          assert.match(pendingStatus, /Downloading/);
          assert.ok(!pendingStatus.includes("saved offline"));
          await page.locator("#save").click();
          assert.equal(await page.locator("#save").isDisabled(), true);
          assert.equal(downloads.length, 0);
          mode = "valid";
          release();
        } else {
          await page.waitForFunction(
            () => document.querySelector("#offline-status").textContent.includes("unavailable"),
            null,
            { timeout: 30000 },
          );
          pendingStatus = await page.locator("#offline-status").textContent();
          await page.locator("#save").click();
          await page.waitForFunction(() =>
            document.querySelector("#file-status").textContent.includes("could not verify"),
          );
          assert.equal(downloads.length, 0);
          assert.match(await page.locator("#file-status").textContent(), /thibaut-12.jpg/);
          mode = "valid";
          await page.reload();
        }
        await page.waitForFunction(
          () => document.querySelector("#offline-status").textContent.includes("saved offline"),
          null,
          { timeout: 45000 },
        );
        if (scenario === "slow") {
          await page.waitForFunction(() =>
            document
              .querySelector("#file-status")
              .textContent.includes("Illustrated reading downloaded"),
          );
        } else {
          const pending = page.waitForEvent("download");
          await page.locator("#save").click();
          await pending;
        }
        assert.equal(downloads.length, 1);
        await downloads[0].saveAs(path.join(output, `${engine}-${scenario}-recovered.html`));
        // Readiness must name the current build and a complete inventory.
        const inspected = await page.evaluate(
          () =>
            new Promise((resolve) => {
              const channel = new MessageChannel();
              channel.port1.onmessage = (e) => {
                resolve(e.data);
                channel.port1.close();
              };
              navigator.serviceWorker.controller.postMessage({ type: "RAJJU_INSPECT" }, [
                channel.port2,
              ]);
            }),
        );
        assert.equal(inspected.complete, true);
        assert.match(inspected.edition, /^[a-f0-9]{64}$/);
        await page.screenshot({ path: path.join(output, `${engine}-${scenario}-recovered.png`) });
        result.push({
          engine,
          scenario,
          heldMilliseconds: scenario === "slow" ? 9000 : 0,
          pendingStatus,
          prematureDownloads: 0,
          substitutedPageRejected: scenario === "substituted",
          recoveredReadingDownloads: downloads.length,
          inspected,
        });
        process.stdout.write(`${engine} ${scenario}: pending/refusal and recovery checked\n`);
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
await writeFile(path.join(output, "offline.json"), `${JSON.stringify(result, null, 2)}\n`);
