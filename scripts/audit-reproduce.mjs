import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium, firefox } from "playwright";

const root = fileURLToPath(new URL("../", import.meta.url));
const output = path.resolve(process.argv[2] ?? "/tmp/claude-1000/rajju-audit/before");
await mkdir(output, { recursive: true });
const sha = (b) => createHash("sha256").update(b).digest("hex");
const mime = {
  ".html": "text/html",
  ".css": "text/css",
  ".js": "text/javascript",
  ".jpg": "image/jpeg",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".svg": "image/svg+xml",
};
const build = path.resolve(process.argv[3] ?? path.join(root, "dist"));
const findings = [];
for (const [engine, launcher] of [
  ["chromium", chromium],
  ["firefox", firefox],
]) {
  const server = createServer(async (req, res) => {
    try {
      const u = new URL(req.url, "http://local");
      if (!u.pathname.startsWith("/rajju/")) throw Error("route");
      const name = u.pathname.slice(7) || "index.html";
      const f = path.resolve(build, name);
      if (!f.startsWith(build + path.sep)) throw Error("path");
      const b = await readFile(f);
      res
        .writeHead(200, {
          "Content-Type": mime[path.extname(f)] ?? "text/plain",
          "Cache-Control": "no-cache",
        })
        .end(b);
    } catch {
      res.writeHead(404).end();
    }
  });
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  const base = `http://127.0.0.1:${server.address().port}/rajju/`;
  const browser = await launcher.launch();
  const context = await browser.newContext();
  try {
    const a = await context.newPage();
    await a.goto(`${base}field.html`);
    await a.waitForFunction(() =>
      document.querySelector("#field-offline").textContent.includes("saved offline"),
    );
    const b = await context.newPage();
    await b.goto(`${base}field.html`);
    await b.waitForFunction(() =>
      document.querySelector("#field-offline").textContent.includes("saved offline"),
    );
    const wrong = await readFile(path.join(root, "public/sources/thibaut-10.jpg"));
    await a.evaluate(
      async (bytes) => {
        const name = (await caches.keys()).find((n) => n.startsWith("rajju-"));
        const c = await caches.open(name);
        await c.put(
          "/rajju/sources/thibaut-11.jpg",
          new Response(new Uint8Array(bytes), { headers: { "Content-Type": "image/jpeg" } }),
        );
      },
      [...wrong],
    );
    const inspect = () =>
      a.evaluate(
        () =>
          new Promise((resolve) => {
            const ch = new MessageChannel();
            ch.port1.onmessage = (e) => {
              resolve(e.data);
              ch.port1.close();
            };
            navigator.serviceWorker.controller.postMessage({ type: "RAJJU_INSPECT" }, [ch.port2]);
          }),
      );
    const corrupted = await inspect();
    await a.locator('[data-field-page="11"]').click();
    await a.locator("#field-source-image").evaluate((img) => img.decode());
    const displayed = await a.locator("#field-source-image").evaluate(async (img) => {
      const bytes = await fetch(img.src).then((r) => r.arrayBuffer());
      const h = await crypto.subtle.digest("SHA-256", bytes);
      return {
        src: img.getAttribute("src"),
        caption: document.querySelector("#field-scan-title").textContent,
        width: img.naturalWidth,
        sha256: [...new Uint8Array(h)].map((n) => n.toString(16).padStart(2, "0")).join(""),
      };
    });
    await a.evaluate(async () => {
      const name = (await caches.keys()).find((n) => n.startsWith("rajju-"));
      await (await caches.open(name)).delete("/rajju/sources/thibaut-11.jpg");
    });
    await a.reload();
    await a.waitForFunction(
      () => !document.querySelector("#field-offline").textContent.includes("Preparing"),
    );
    const missing = await inspect();
    const statusAfterReload = await a.locator("#field-offline").textContent();
    const otherTabStatus = await b.locator("#field-offline").textContent();
    await a.reload();
    const secondReload = await inspect();
    const finding = {
      engine,
      corruptedInspection: corrupted,
      wrongSourceDisplayed: displayed.sha256 === sha(wrong),
      displayed,
      missingInspection: missing,
      statusAfterReload,
      otherTabStatus,
      secondReload,
      repairControls: await a.getByRole("button", { name: /repair|check offline/i }).count(),
    };
    assert.equal(finding.corruptedInspection.complete, true);
    assert.equal(finding.wrongSourceDisplayed, true);
    assert.equal(finding.secondReload.complete, false);
    assert.match(finding.otherTabStatus, /saved offline/);
    await a.evaluate(async () => {
      const name = (await caches.keys()).find((n) => n.startsWith("rajju-"));
      const cache = await caches.open(name);
      const request = (await cache.keys()).find((r) => /assets\/field-.*\.js$/.test(r.url));
      const response = await cache.match(request);
      const headers = new Headers(response.headers);
      headers.set("Content-Type", "text/plain");
      await cache.put(request, new Response(await response.arrayBuffer(), { headers }));
    });
    const fresh = await context.newPage();
    await fresh.goto(`${base}field.html`);
    finding.byteCorrectModuleWithWrongMimeRendered =
      (await fresh.locator("#field-plan svg").count()) > 0;
    assert.equal(finding.byteCorrectModuleWithWrongMimeRendered, false);
    findings.push(finding);
    console.log(
      `${engine}: corrupt bytes accepted as complete, wrong source shown, reload did not repair, other tab stayed ready`,
    );
  } finally {
    await context.close();
    await browser.close();
    server.closeAllConnections();
    await new Promise((r) => server.close(r));
  }
}
await writeFile(path.join(output, "receipt.json"), `${JSON.stringify(findings, null, 2)}\n`);
