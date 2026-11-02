import { createHash } from "node:crypto";
import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { defineConfig } from "vite";

const base = "/rajju/";

async function filesIn(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map((entry) =>
      entry.isDirectory()
        ? filesIn(path.join(directory, entry.name))
        : Promise.resolve([path.join(directory, entry.name)]),
    ),
  );
  return nested.flat();
}

export default defineConfig(async ({ command }) => {
  const inputFiles = [
    ...(await filesIn("src")),
    ...(await filesIn("public")),
    "index.html",
    "field.html",
    "vite.config.ts",
    "tsconfig.json",
    "package.json",
    "package-lock.json",
  ].sort();
  const inputHash = createHash("sha256");
  for (const file of inputFiles) {
    inputHash.update(file);
    inputHash.update(await readFile(file));
  }
  const edition = command === "build" ? inputHash.digest("hex") : "development";
  return {
    base,
    build: {
      rolldownOptions: {
        input: { main: "index.html", field: "field.html" },
      },
    },
    define: {
      __RAJJU_EDITION__: JSON.stringify(edition),
      __ASSET_SIZES__: JSON.stringify(
        Object.fromEntries(
          await Promise.all(
            (await filesIn("public")).map(async (file) => [
              file.slice(7),
              (await readFile(file)).byteLength,
            ]),
          ),
        ),
      ),
      __ASSET_HASHES__: JSON.stringify(
        Object.fromEntries(
          await Promise.all(
            (await filesIn("public")).map(async (file) => [
              file.slice(7),
              createHash("sha256")
                .update(await readFile(file))
                .digest("hex"),
            ]),
          ),
        ),
      ),
    },
    plugins: [
      {
        name: "offline-workshop",
        apply: "build",
        async closeBundle() {
          const files = (await filesIn("dist")).filter((f) => !f.endsWith("sw.js")).sort();
          const urls = files.map(
            (file) => base + path.relative("dist", file).split(path.sep).join("/"),
          );
          const integrity = Object.fromEntries(
            await Promise.all(
              files.map(async (file, index) => [
                urls[index],
                `sha256-${createHash("sha256")
                  .update(await readFile(file))
                  .digest("base64")}`,
              ]),
            ),
          );
          await writeFile(
            "dist/sw.js",
            `/* Offline edition ${edition}. Generated from the complete build. */
const CACHE = "rajju-${edition}";
const EDITION = ${JSON.stringify(edition)};
const BASE = ${JSON.stringify(base)};
const FILES = ${JSON.stringify(urls)};
const INTEGRITY = ${JSON.stringify(integrity)};
const SIZES = ${JSON.stringify(Object.fromEntries(await Promise.all(files.map(async (file, index) => [urls[index], (await readFile(file)).byteLength]))))};
${await readFile("src/worker-runtime.js", "utf8")}
`,
          );
        },
      },
    ],
  };
});
