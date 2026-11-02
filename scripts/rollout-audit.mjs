import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { cp, mkdir, mkdtemp, readFile, symlink, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium, firefox } from "playwright";

const root = fileURLToPath(new URL("../", import.meta.url));
const output = path.resolve(process.argv[2] ?? "/tmp/claude-1000/rajju-audit/rollout");
await mkdir(output, { recursive: true });
const fixture = await mkdtemp(path.join(output, "next-edition-"));
for (const name of [
  "src",
  "public",
  "index.html",
  "field.html",
  "vite.config.ts",
  "tsconfig.json",
  "package.json",
  "package-lock.json",
])
  await cp(path.join(root, name), path.join(fixture, name), { recursive: true });
await symlink(path.join(root, "node_modules"), path.join(fixture, "node_modules"), "dir").catch(
  (e) => {
    if (e.code !== "EEXIST") throw e;
  },
);
const format = path.join(fixture, "src/format.ts");
await writeFile(
  format,
  `${await readFile(format, "utf8")}\n// Synthetic edition marker for the update audit; no model change.\n`,
);
execFileSync(process.execPath, [path.join(root, "node_modules/vite/bin/vite.js"), "build"], {
  cwd: fixture,
  stdio: "pipe",
});
const oldBuild = path.join(root, "dist"),
  nextBuild = path.join(fixture, "dist");
const edition = async (build) =>
  JSON.parse(
    (await readFile(path.join(build, "sw.js"), "utf8")).match(/const EDITION = ("[a-f0-9]+")/)[1],
  );
const before = await edition(oldBuild),
  after = await edition(nextBuild);
assert.notEqual(before, after);
const mime = {
  ".html": "text/html",
  ".css": "text/css",
  ".js": "text/javascript",
  ".jpg": "image/jpeg",
  ".ttf": "font/ttf",
  ".woff2": "font/woff2",
  ".svg": "image/svg+xml",
};
const rows = [];
for (const [engine, launcher] of [
  ["chromium", chromium],
  ["firefox", firefox],
]) {
  let current = oldBuild,
    hold = false,
    release = () => {};
  const server = createServer(async (req, res) => {
    try {
      const url = new URL(req.url, "http://local");
      if (!url.pathname.startsWith("/rajju/")) throw new Error("route");
      const name = url.pathname.slice(7) || "index.html";
      const file = path.resolve(current, name);
      if (!file.startsWith(current + path.sep)) throw new Error("path");
      const bytes = await readFile(file);
      res.writeHead(200, {
        "Content-Type": mime[path.extname(file)] ?? "text/plain",
        "Cache-Control": "no-store",
      });
      if (hold && name === "sources/thibaut-11.jpg") {
        res.write(bytes.subarray(0, 1024));
        release = () => {
          if (!res.destroyed) res.end(bytes.subarray(1024));
        };
        return;
      }
      res.end(bytes);
    } catch {
      res.writeHead(404).end();
    }
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const base = `http://127.0.0.1:${server.address().port}/rajju/`;
  const browser = await launcher.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  try {
    await page.goto(`${base}field.html?nearerr=10&placed=wn,one,1500,mark`);
    await page.waitForFunction(() =>
      document.querySelector("#field-offline").textContent.includes("saved offline"),
    );
    const retained = page.url();
    await page.evaluate(async () => {
      window.oldController = navigator.serviceWorker.controller;
      const cache = await caches.open(
        (await caches.keys()).find((key) => key.startsWith("rajju-")),
      );
      await cache.delete("/rajju/sources/thibaut-11.jpg");
    });
    hold = true;
    await page.getByRole("button", { name: "Check & repair offline edition" }).click();
    await page.waitForFunction(() =>
      document.querySelector("#field-offline").textContent.includes("Repairing offline"),
    );
    await page.evaluate(() => {
      window.oldInspection = new Promise((resolve) => {
        const channel = new MessageChannel();
        channel.port1.onmessage = (e) => {
          resolve(e.data);
          channel.port1.close();
        };
        window.oldController.postMessage({ type: "RAJJU_INSPECT" }, [channel.port2]);
      });
    });
    current = nextBuild;
    hold = false;
    await page.evaluate(async () => (await navigator.serviceWorker.getRegistration()).update());
    await page.waitForFunction(async () => {
      const registration = await navigator.serviceWorker.getRegistration();
      return (
        registration.active?.state === "activating" || registration.waiting?.state === "installed"
      );
    });
    assert.equal(
      await page.evaluate(() => navigator.serviceWorker.controller === window.oldController),
      true,
    );
    const during = await page.evaluate(() => caches.keys());
    assert.ok(during.includes(`rajju-${before}`));
    assert.equal(page.url(), retained);
    release();
    await page.waitForFunction(() => navigator.serviceWorker.controller !== window.oldController);
    await page.waitForFunction(() =>
      document.querySelector("#field-offline").textContent.includes("different offline edition"),
    );
    const late = await page.evaluate(() => window.oldInspection);
    const keys = await page.evaluate(() => caches.keys());
    assert.deepEqual(keys, [`rajju-${after}`]);
    assert.equal(page.url(), retained);
    assert.equal(await page.locator("#error-near").inputValue(), "10");
    assert.match(await page.locator("#ground-result").textContent(), /1 of four/);
    const handoffStatus = await page.locator("#field-offline").textContent();
    await page.evaluate((edition) => {
      navigator.serviceWorker.dispatchEvent(
        new MessageEvent("message", {
          source: window.oldController,
          data: { type: "RAJJU_EDITION", edition, complete: true },
        }),
      );
    }, before);
    assert.equal(await page.locator("#field-offline").textContent(), handoffStatus);
    await page.reload();
    await page.waitForFunction(() =>
      document.querySelector("#field-offline").textContent.includes("saved offline"),
    );
    assert.equal(page.url(), retained);
    assert.equal(await page.locator("#error-near").inputValue(), "10");
    assert.deepEqual(await page.evaluate(() => caches.keys()), [`rajju-${after}`]);
    assert.deepEqual(errors, []);
    rows.push({
      engine,
      oldEdition: before,
      syntheticNextEdition: after,
      duringRepairCaches: during,
      lateInspection: late,
      finalCaches: keys,
      handoffStatus,
      syntheticOldWorkerSuccessIgnored: true,
      queryPreserved: true,
      workPreserved: true,
      errors,
    });
    console.log(
      `${engine}: update waited for repair; late inspection did not recreate the old edition; work survived reload`,
    );
  } finally {
    release();
    await context.close();
    await browser.close();
    server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
  }
}
await writeFile(
  path.join(output, "receipt.json"),
  `${JSON.stringify({ scope: "Synthetic next-edition marker; same geometry and UI, different build identity", rows }, null, 2)}\n`,
);
