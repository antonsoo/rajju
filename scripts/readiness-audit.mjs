import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import AxeBuilder from "@axe-core/playwright";
import { chromium, firefox } from "playwright";

const root = fileURLToPath(new URL("../", import.meta.url));
const output = path.resolve(process.argv[2] ?? "/tmp/claude-1000/rajju-audit/readiness");
await mkdir(output, { recursive: true });
const mime = {
  ".html": "text/html",
  ".css": "text/css",
  ".js": "text/javascript",
  ".jpg": "image/jpeg",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".svg": "image/svg+xml",
};
const sha = (b) => createHash("sha256").update(b).digest("hex");
const receipt = { readiness: [], sources: [] };
async function fixture() {
  let mode = "valid";
  let selected = "sources/thibaut-12.jpg";
  let release = () => {};
  const timers = new Set();
  const server = createServer(async (req, res) => {
    try {
      const url = new URL(req.url, "http://local");
      if (!url.pathname.startsWith("/rajju/")) throw new Error("route");
      const name = url.pathname.slice(7) || "index.html";
      const file = path.resolve(root, "dist", name);
      if (!file.startsWith(path.join(root, "dist") + path.sep)) throw new Error("path");
      const bytes = await readFile(file);
      const headers = {
        "Content-Type": mime[path.extname(file)] ?? "text/plain",
        "Cache-Control": "no-cache",
      };
      if (name.endsWith(".html") && mode.startsWith("nav")) {
        if (mode === "navStale") {
          res
            .writeHead(200, headers)
            .end(bytes.toString().replace(/(?:main|field)-[\w-]+\.js/g, "stale-missing-module.js"));
          return;
        }
        if (mode === "nav503") {
          res.writeHead(503).end("Unavailable");
          return;
        }
        if (mode === "navBody") {
          res.writeHead(200, headers);
          res.write(bytes.subarray(0, 20));
        }
        return;
      }
      if (name === selected) {
        if (mode === "wrong") {
          const wrong = Buffer.from(bytes);
          wrong[wrong.length - 5] ^= 1;
          res.writeHead(200, headers).end(wrong);
          return;
        }
        if (mode === "hold") {
          res.writeHead(200, headers);
          res.write(bytes.subarray(0, 1024));
          release = () => {
            if (!res.destroyed) res.end(bytes.subarray(1024));
          };
          return;
        }
        if (mode === "slow") {
          res.writeHead(200, headers);
          let offset = 0;
          const send = () => {
            if (res.destroyed) return;
            const end = Math.min(bytes.length, offset + 8192);
            res.write(bytes.subarray(offset, end));
            offset = end;
            if (offset === bytes.length) {
              res.end();
              return;
            }
            const timer = setTimeout(() => {
              timers.delete(timer);
              send();
            }, 650);
            timers.add(timer);
          };
          send();
          return;
        }
      }
      res.writeHead(200, headers).end(bytes);
    } catch {
      res.writeHead(404).end();
    }
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  return {
    base: `http://127.0.0.1:${server.address().port}/rajju/`,
    mode: (next, file = selected) => {
      mode = next;
      selected = file;
    },
    release: () => release(),
    close: async () => {
      for (const t of timers) clearTimeout(t);
      server.closeAllConnections();
      await new Promise((resolve) => server.close(resolve));
    },
  };
}
const inspect = (page) =>
  page.evaluate(
    () =>
      new Promise((resolve) => {
        const channel = new MessageChannel();
        channel.port1.onmessage = (e) => {
          resolve(e.data);
          channel.port1.close();
        };
        navigator.serviceWorker.controller.postMessage({ type: "RAJJU_INSPECT" }, [channel.port2]);
      }),
  );
const ready = (page, id) =>
  page.waitForFunction(
    (selector) => document.querySelector(selector)?.textContent.includes("saved offline"),
    id,
  );
async function visibleImage(page, selector) {
  await page.locator(selector).waitFor({ state: "visible" });
  await page.locator(selector).evaluate((img) => img.decode());
}
async function imageHash(page, selector) {
  await visibleImage(page, selector);
  return page.locator(selector).evaluate(async (img) => {
    const bytes = await fetch(img.src).then((r) => r.arrayBuffer());
    const hash = await crypto.subtle.digest("SHA-256", bytes);
    return [...new Uint8Array(hash)].map((n) => n.toString(16).padStart(2, "0")).join("");
  });
}
async function native(page, selector, name) {
  const pending = page.waitForEvent("download");
  await page.locator(selector).click();
  const d = await pending;
  const destination = path.join(output, name);
  await d.saveAs(destination);
  return { path: destination, bytes: await readFile(destination) };
}
for (const [engine, launcher] of [
  ["chromium", chromium],
  ["firefox", firefox],
]) {
  const browser = await launcher.launch();
  try {
    for (const width of [1440, 375]) {
      const service = await fixture();
      const context = await browser.newContext({
        viewport: { width, height: 1000 },
        acceptDownloads: true,
      });
      const page = await context.newPage();
      const errors = [];
      page.on("pageerror", (e) => errors.push(e.message));
      let closed = false;
      try {
        await page.goto(`${service.base}field.html?nearerr=10&placed=wn,one,1500,mark`);
        await ready(page, "#field-offline");
        const state = new URL(page.url()).search;
        const module = await page.locator('script[type="module"]').getAttribute("src");
        await page.evaluate(async (module) => {
          const cache = await caches.open(
            (await caches.keys()).find((n) => n.startsWith("rajju-")),
          );
          const response = await cache.match(module);
          const headers = new Headers(response.headers);
          headers.set("Content-Type", "text/plain");
          headers.set("Content-Encoding", "gzip");
          await cache.put(module, new Response(await response.arrayBuffer(), { headers }));
        }, module);
        await page.reload();
        await page.locator("#field-plan svg").waitFor();
        const usableModuleHeaders = await page.evaluate(async (module) => {
          const response = await fetch(module);
          return {
            type: response.headers.get("Content-Type"),
            encoding: response.headers.get("Content-Encoding"),
          };
        }, module);
        assert.equal(usableModuleHeaders.type, "text/javascript");
        assert.equal(usableModuleHeaders.encoding, null);
        await ready(page, "#field-offline");
        const other = await context.newPage();
        await other.goto(service.base);
        await ready(other, "#offline-status");
        const bad = Buffer.from(await readFile(path.join(root, "public/sources/thibaut-11.jpg")));
        bad[bad.length - 5] ^= 1;
        await page.evaluate(
          async (bytes) => {
            const cache = await caches.open(
              (await caches.keys()).find((n) => n.startsWith("rajju-")),
            );
            await cache.put(
              "/rajju/sources/thibaut-11.jpg",
              new Response(new Uint8Array(bytes), { headers: { "Content-Type": "image/jpeg" } }),
            );
            await cache.delete("/rajju/sources/thibaut-12.jpg");
          },
          [...bad],
        );
        const broken = await inspect(page);
        assert.equal(broken.complete, false);
        assert.deepEqual(broken.damaged, ["/rajju/sources/thibaut-11.jpg"]);
        assert.deepEqual(broken.missing, ["/rajju/sources/thibaut-12.jpg"]);
        await other.waitForFunction(() =>
          document.querySelector("#offline-status").textContent.includes("1 damaged"),
        );
        service.mode("wrong", "sources/thibaut-11.jpg");
        await page.locator('[data-field-page="11"]').click();
        await page.waitForFunction(
          () => document.querySelector("#field-source-image").dataset.sourceState === "error",
        );
        assert.equal(await page.locator("#field-source-image").isVisible(), false);
        assert.equal(await page.locator("#field-open-scan").getAttribute("href"), null);
        await page
          .locator("#field-scan-title")
          .evaluate((e) => e.scrollIntoView({ block: "start" }));
        await page.screenshot({ path: path.join(output, `${engine}-${width}-refused-page.png`) });
        await page.getByRole("button", { name: "Check & repair offline edition" }).click();
        await page.waitForFunction(() => !document.querySelector("#field-offline button").disabled);
        assert.match(await page.locator("#field-offline").textContent(), /could not verify/i);
        assert.equal((await inspect(page)).complete, false);
        service.mode("valid");
        await page.getByRole("button", { name: "Check & repair offline edition" }).click();
        await ready(page, "#field-offline");
        await ready(other, "#offline-status");
        await page.locator("#field-source-retry").click();
        assert.equal(
          await imageHash(page, "#field-source-image"),
          sha(await readFile(path.join(root, "public/sources/thibaut-11.jpg"))),
        );
        assert.equal(new URL(page.url()).searchParams.get("nearerr"), "10");
        assert.match(new URL(page.url()).searchParams.get("placed"), /wn,one,1500,mark/);
        await page.evaluate(async () => {
          for (const key of await caches.keys())
            if (key.startsWith("rajju-")) await caches.delete(key);
        });
        assert.equal((await inspect(page)).complete, false);
        await page.getByRole("button", { name: "Check & repair offline edition" }).click();
        await ready(page, "#field-offline");
        await ready(other, "#offline-status");
        const navigations = [];
        for (const mode of ["nav503", "navHeaders", "navBody", "navStale"]) {
          service.mode(mode);
          const start = Date.now();
          await page.reload();
          await page.locator("#field-plan svg").waitFor();
          navigations.push({ mode, milliseconds: Date.now() - start });
          assert.ok(navigations.at(-1).milliseconds < 8000);
          assert.equal(new URL(page.url()).searchParams.get("nearerr"), "10");
        }
        service.mode("valid");
        await ready(page, "#field-offline");
        if (width === 1440) {
          await page.locator('[data-field-page="10"]').click();
          await visibleImage(page, "#field-source-image");
          // This active body takes over 28 seconds; per-chunk activity must keep
          // the repair and its visible progress alive beyond the idle deadline.
          await page.evaluate(async () => {
            const cache = await caches.open(
              (await caches.keys()).find((n) => n.startsWith("rajju-")),
            );
            await cache.delete("/rajju/sources/thibaut-11.jpg");
          });
          service.mode("slow", "sources/thibaut-11.jpg");
          const start = Date.now();
          await page.getByRole("button", { name: "Check & repair offline edition" }).click();
          await page.waitForFunction(() =>
            document.querySelector("#field-offline").textContent.includes("Repairing offline"),
          );
          await page.locator('[data-field-page="11"]').click();
          await page.waitForFunction(
            () => document.querySelector("#field-source-image").dataset.sourceState !== "loading",
            null,
            { timeout: 60000 },
          );
          const coldRead = {
            engine,
            state: await page.locator("#field-source-image").getAttribute("data-source-state"),
            status: await page.locator("#field-source-check").textContent(),
            milliseconds: Date.now() - start,
          };
          await writeFile(
            path.join(output, `${engine}-cold-read.json`),
            `${JSON.stringify(coldRead, null, 2)}\n`,
          );
          assert.equal(coldRead.state, "ready", JSON.stringify(coldRead));
          assert.equal(
            await imageHash(page, "#field-source-image"),
            sha(await readFile(path.join(root, "public/sources/thibaut-11.jpg"))),
          );
          await ready(page, "#field-offline");
          assert.ok(Date.now() - start > 20000);
          service.mode("valid");
          navigations.push({
            mode: "continuous slow repair with foreground source read",
            milliseconds: Date.now() - start,
          });
        }
        const axe = await new AxeBuilder({ page })
          .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
          .analyze();
        assert.deepEqual(
          axe.violations.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.target) })),
          [],
        );
        await page.locator("footer").scrollIntoViewIfNeeded();
        await page.screenshot({ path: path.join(output, `${engine}-${width}-repaired.png`) });
        await service.close();
        closed = true;
        await page.reload();
        await visibleImage(page, "#field-source-image");
        await ready(page, "#field-offline");
        const file = await native(page, "#field-save", `${engine}-${width}-offline.html`);
        assert.ok(file.bytes.includes(Buffer.from("Near-segment error +0.1")));
        await page.goto(
          `${service.base}field.html?placed=wn,one,900,grip;en,one,900,grip;es,345,2400,grip;ws,one,1500,mark`,
        );
        assert.match(await page.locator("#ground-result").textContent(), /overlaps/);
        const overlapCsv = await native(page, "#field-csv", `${engine}-${width}-overlap.csv`);
        assert.match(
          overlapCsv.bytes.toString(),
          /Area withheld: the boundary crosses, overlaps or collapses/,
        );
        assert.deepEqual(errors, []);
        receipt.readiness.push({
          engine,
          width,
          state,
          usableModuleHeaders,
          overlappingBoundaryAreaWithheld: true,
          broken,
          recovered: await inspect(page),
          navigations,
          axeViolations: axe.violations.length,
          offlineReadingSha256: sha(file.bytes),
          errors,
        });
        console.log(
          `${engine} ${width}: damaged bytes, peer invalidation, repair, full cache loss, navigation fallback and offline save pass`,
        );
      } finally {
        await context.close();
        if (!closed) await service.close();
      }
    }
    for (const [room, image, check, retry, save, cancel, status] of [
      [
        "field.html",
        "#field-source-image",
        "#field-source-check",
        "#field-source-retry",
        "#field-save",
        "#cancel-field-save",
        "#field-file-status",
      ],
      [
        "",
        "#source-image",
        "#source-check",
        "#source-retry",
        "#save",
        "#cancel-save",
        "#file-status",
      ],
    ]) {
      const service = await fixture();
      const context = await browser.newContext({ serviceWorkers: "block", acceptDownloads: true });
      const page = await context.newPage();
      const errors = [];
      page.on("pageerror", (e) => errors.push(e.message));
      const downloads = [];
      page.on("download", (d) => downloads.push(d));
      try {
        await page.goto(`${service.base}${room}`);
        await visibleImage(page, image);
        service.mode("wrong", "sources/thibaut-12.jpg");
        await page.locator(room ? '[data-field-page="12"]' : '[data-page="12"]').click();
        await page.waitForFunction(
          (selector) => document.querySelector(selector).dataset.sourceState === "error",
          image,
        );
        assert.equal(await page.locator(image).isVisible(), false);
        assert.match(await page.locator(check).textContent(), /could not verify/);
        service.mode("valid");
        await page.locator(retry).click();
        assert.equal(
          await imageHash(page, image),
          sha(await readFile(path.join(root, "public/sources/thibaut-12.jpg"))),
        );
        service.mode("hold", "sources/thibaut-10.jpg");
        await page.locator(room ? '[data-field-page="10"]' : '[data-page="26"]').click();
        if (room) {
          await page.locator('[data-field-page="11"]').click();
          await visibleImage(page, image);
          service.release();
          assert.equal(
            await imageHash(page, image),
            sha(await readFile(path.join(root, "public/sources/thibaut-11.jpg"))),
          );
        }
        service.mode("hold", "sources/thibaut-12.jpg");
        await page.locator(save).click();
        await page.locator(cancel).waitFor({ state: "visible" });
        await page.locator(cancel).click();
        await page.waitForFunction(
          (selector) => document.querySelector(selector).textContent.includes("cancelled"),
          status,
        );
        assert.equal(await page.locator(save).isEnabled(), true);
        assert.equal(await page.locator(save).evaluate((e) => document.activeElement === e), true);
        assert.equal(downloads.length, 0);
        service.release();
        service.mode("valid");
        const file = await native(
          page,
          save,
          `${engine}-${room ? "field" : "circle"}-recovered.html`,
        );
        assert.equal(downloads.length, 1);
        assert.ok(file.bytes.length > 1000000);
        assert.deepEqual(errors, []);
        receipt.sources.push({
          engine,
          room: room || "index.html",
          substitutedPageRefused: true,
          retryVerified: true,
          supersededPageCannotWin: Boolean(room),
          cancellationWithoutDownload: true,
          retryReadingSha256: sha(file.bytes),
          errors,
        });
        console.log(
          `${engine} ${room || "index"}: source refusal/retry, cancellation and native saved reading pass`,
        );
      } finally {
        await context.close();
        await service.close();
      }
    }
  } finally {
    await browser.close();
  }
}
await writeFile(path.join(output, "receipt.json"), `${JSON.stringify(receipt, null, 2)}\n`);
