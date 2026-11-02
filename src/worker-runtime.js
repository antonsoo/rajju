/* Prepended at build time: CACHE, EDITION, BASE, FILES, INTEGRITY and SIZES. */
let operations = Promise.resolve();
let repairing = false;
let revision = 0;
const enqueue = (work) => {
  const next = operations.then(work, work);
  operations = next.catch(() => {});
  return next;
};
async function broadcast(data, expectedRevision = revision) {
  const clients = await self.clients.matchAll({ type: "window" });
  if (expectedRevision !== revision) return;
  for (const client of clients)
    if (new URL(client.url).pathname.startsWith(BASE)) client.postMessage(data);
}
async function matches(response, url) {
  if (!response?.ok) return false;
  const bytes = await response.arrayBuffer();
  if (bytes.byteLength !== SIZES[url]) return false;
  const hash = new Uint8Array(await crypto.subtle.digest("SHA-256", bytes));
  return `sha256-${btoa(String.fromCharCode(...hash))}` === INTEGRITY[url];
}
async function inspect() {
  const missing = [];
  const damaged = [];
  // CacheStorage.match never recreates an old cache after a replacement worker
  // deletes it. A stale worker's late inspection cannot resurrect its edition.
  for (const file of FILES) {
    const response = await caches.match(file, { cacheName: CACHE });
    if (!response) missing.push(file);
    else if (!(await matches(response, file))) damaged.push(file);
  }
  return {
    type: "RAJJU_EDITION",
    edition: EDITION,
    complete: !missing.length && !damaged.length,
    missing,
    damaged,
  };
}
async function announce() {
  const result = await inspect();
  await broadcast(result);
  return result;
}
async function streamedFile(url, notify = false, signal) {
  const controller = new AbortController();
  const abort = () => controller.abort(signal?.reason);
  if (signal?.aborted) abort();
  signal?.addEventListener("abort", abort, { once: true });
  let timer;
  const finish = () => {
    clearTimeout(timer);
    signal?.removeEventListener("abort", abort);
  };
  const reset = () => {
    clearTimeout(timer);
    timer = setTimeout(
      () => controller.abort(new Error("A saved file stopped arriving. Retry online.")),
      20000,
    );
  };
  reset();
  let response;
  try {
    response = await fetch(new Request(url, { cache: "reload", signal: controller.signal }));
    if (!response.ok || !response.body)
      throw new Error("A saved file could not be downloaded. Retry online.");
  } catch (error) {
    finish();
    controller.abort();
    throw error;
  }
  reset();
  const reader = response.body.getReader();
  const bytes = new Uint8Array(SIZES[url]);
  let length = 0;
  const headers = new Headers(response.headers);
  headers.delete("Content-Encoding");
  headers.delete("Content-Length");
  const stream = new ReadableStream({
    async pull(output) {
      try {
        const { done, value } = await reader.read();
        if (done) {
          finish();
          if (length !== bytes.byteLength || !(await matches(new Response(bytes), url)))
            throw new Error(
              "A downloaded file differs from this edition. Reload online to update it.",
            );
          output.close();
          return;
        }
        reset();
        if (length + value.byteLength > bytes.byteLength)
          throw new Error(
            "A downloaded file differs from this edition. Reload online to update it.",
          );
        bytes.set(value, length);
        length += value.byteLength;
        output.enqueue(value);
        if (notify)
          await broadcast({
            type: "RAJJU_REPAIR_PROGRESS",
            edition: EDITION,
            path: url,
            received: length,
            expected: bytes.byteLength,
          });
      } catch (error) {
        finish();
        controller.abort();
        output.error(error);
      }
    },
    async cancel(reason) {
      finish();
      controller.abort();
      await reader.cancel(reason);
    },
  });
  // Consumers see ongoing bytes, but a bad digest errors the stream rather than
  // closing it. A script loader cannot execute an incomplete, failed response.
  return new Response(stream, { status: 200, headers });
}
async function freshFile(url) {
  try {
    const response = await streamedFile(url, true);
    return new Response(await response.arrayBuffer(), { status: 200, headers: response.headers });
  } catch {
    throw new Error(`Could not verify ${url}. Check the connection and retry the offline repair.`);
  }
}
async function repair() {
  if (!self.navigator.locks)
    throw new Error(
      "This browser cannot repair saved files in place. Stay online or keep an illustrated reading.",
    );
  return self.navigator.locks.request("rajju-edition-cache", async () => {
    const keys = await caches.keys();
    if (!keys.includes(CACHE) && keys.some((key) => key.startsWith("rajju-")))
      throw new Error("A different edition is being saved. Keep your link, then reload online.");
    const initial = await announce();
    const cache = await caches.open(CACHE);
    for (const file of [...initial.missing, ...initial.damaged]) {
      await cache.put(file, await freshFile(file));
      revision++;
      await broadcast({ type: "RAJJU_REPAIR_PROGRESS", edition: EDITION, path: file });
    }
    return announce();
  });
}
function typed(response, url) {
  const types = {
    html: "text/html",
    js: "text/javascript",
    css: "text/css",
    jpg: "image/jpeg",
    svg: "image/svg+xml",
    ttf: "font/ttf",
    woff2: "font/woff2",
    txt: "text/plain",
  };
  const type = types[url.split(".").pop()];
  const headers = new Headers(response.headers);
  if (type) headers.set("Content-Type", type);
  headers.delete("Content-Encoding");
  headers.delete("Content-Length");
  return new Response(response.body, { status: response.status, headers });
}
async function savedFile(url) {
  const observedRevision = revision;
  const response = await caches.match(url, { cacheName: CACHE });
  if (response && (await matches(response.clone(), url))) return typed(response, url);
  // A foreground read must not wait behind a potentially long repair. Announce
  // its observed loss immediately; a completed repair supersedes this message.
  await broadcast(
    {
      type: "RAJJU_EDITION",
      edition: EDITION,
      complete: false,
      error: "A saved file is missing or damaged. Reconnect and use Check & repair.",
    },
    observedRevision,
  );
  return null;
}
async function navigation(page, event) {
  const controller = new AbortController();
  let timer;
  const network = (async () => {
    const response = await streamedFile(page, false, controller.signal);
    return typed(new Response(await response.arrayBuffer(), { headers: response.headers }), page);
  })();
  try {
    return await Promise.race([
      network,
      new Promise((_, reject) => {
        timer = setTimeout(() => reject(new Error("Use the verified saved page.")), 2000);
      }),
    ]);
  } catch {
    controller.abort();
    // A stale HTTP-200 entry must not mix its obsolete module links with this
    // edition. Keep the verified page while checking for a complete replacement.
    event.waitUntil(self.registration.update().catch(() => {}));
    return (
      (await savedFile(page)) ??
      new Response(
        "The saved reading is missing or damaged. Reconnect and use the offline repair in an open workshop.",
        { status: 503, headers: { "Content-Type": "text/plain" } },
      )
    );
  } finally {
    clearTimeout(timer);
  }
}
self.addEventListener("install", (event) => {
  // SRI prevents an HTTP-200 substituted entry page or source from installing.
  const requests = FILES.map(
    (url) => new Request(url, { cache: "reload", integrity: INTEGRITY[url] }),
  );
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(requests))
      .then(() => self.skipWaiting()),
  );
});
self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const activate = () =>
        caches
          .keys()
          .then((keys) =>
            Promise.all(
              keys
                .filter((key) => key.startsWith("rajju-") && key !== CACHE)
                .map((key) => caches.delete(key)),
            ),
          );
      if (self.navigator.locks) await self.navigator.locks.request("rajju-edition-cache", activate);
      else await activate();
      await self.clients.claim();
    })(),
  );
});
self.addEventListener("message", (event) => {
  if (event.data?.type === "RAJJU_ACTIVATE") {
    event.waitUntil(self.skipWaiting());
    return;
  }
  if (event.data?.type !== "RAJJU_INSPECT" && event.data?.type !== "RAJJU_REPAIR") return;
  const port = event.ports[0];
  if (!port) return;
  const wantsRepair = event.data.type === "RAJJU_REPAIR";
  if (wantsRepair && (event.data.edition !== EDITION || repairing)) {
    port.postMessage({
      type: "RAJJU_EDITION",
      edition: EDITION,
      complete: false,
      error: repairing
        ? "An offline repair is already running."
        : "A different edition controls this page. Keep your link, then reload online.",
    });
    return;
  }
  if (wantsRepair) repairing = true;
  event.waitUntil(
    enqueue(async () => {
      try {
        port.postMessage(await (wantsRepair ? repair() : announce()));
      } catch (error) {
        const result = {
          type: "RAJJU_EDITION",
          edition: EDITION,
          complete: false,
          error:
            error instanceof Error ? error.message : "Offline verification failed. Retry online.",
        };
        port.postMessage(result);
        await broadcast(result);
      } finally {
        if (wantsRepair) repairing = false;
        port.close();
      }
    }),
  );
});
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (
    event.request.method !== "GET" ||
    url.origin !== self.location.origin ||
    !url.pathname.startsWith(BASE)
  )
    return;
  if (event.request.mode === "navigate") {
    const page =
      url.pathname === BASE || url.pathname === `${BASE}index.html`
        ? `${BASE}index.html`
        : url.pathname;
    if (FILES.includes(page)) event.respondWith(navigation(page, event));
  } else if (FILES.includes(url.pathname)) {
    event.respondWith(
      (async () => {
        const cached = await savedFile(url.pathname);
        if (cached) return cached;
        try {
          return typed(await streamedFile(url.pathname, false, event.request.signal), url.pathname);
        } catch {
          return new Response(
            "This edition could not verify the requested file. Reconnect and repair the saved reading.",
            { status: 503, headers: { "Content-Type": "text/plain" } },
          );
        }
      })(),
    );
  }
});
