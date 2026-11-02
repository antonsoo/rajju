import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const base = process.argv[2] ?? "https://antonsoo.github.io/rajju/";
const destination = path.resolve(process.argv[3] ?? "/tmp/claude-1000/rajju-audit/hosted.json");
const sha = (b) => createHash("sha256").update(b).digest("hex");
const inventory = JSON.parse(
  await readFile(new URL("../docs/audit/build.json", import.meta.url), "utf8"),
);
const files = Object.entries(inventory.files);
const results = [];
let next = 0;
await Promise.all(
  Array.from({ length: 4 }, async () => {
    while (next < files.length) {
      const [file, expected] = files[next++];
      const url = new URL(file, base).href;
      const response = await fetch(url, { cache: "no-cache", signal: AbortSignal.timeout(30000) });
      const bytes = Buffer.from(await response.arrayBuffer());
      results.push({
        file,
        url,
        status: response.status,
        bytes: bytes.length,
        sha256: sha(bytes),
        expected,
        matches: response.ok && sha(bytes) === expected,
      });
    }
  }),
);
results.sort((a, b) => a.file.localeCompare(b.file));
const entryResponse = await fetch(base, { cache: "no-cache", signal: AbortSignal.timeout(30000) });
const entryBytes = Buffer.from(await entryResponse.arrayBuffer());
const entry = {
  url: base,
  status: entryResponse.status,
  sha256: sha(entryBytes),
  matches: entryResponse.ok && sha(entryBytes) === inventory.files["index.html"],
};
await mkdir(path.dirname(destination), { recursive: true });
await writeFile(
  destination,
  `${JSON.stringify({ date: new Date().toISOString(), base, files: results, canonicalEntry: entry }, null, 2)}\n`,
);
assert.deepEqual(
  results.filter((r) => !r.matches),
  [],
  "Hosted files differ from the reviewed clean build",
);
assert.equal(entry.matches, true);
console.log(
  `${results.length} canonical hosted files and the canonical entry match the reviewed build.`,
);
