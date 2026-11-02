# Cord-error experiment: direct review

Reviewed locally on 2026-11-02. This adds a comparative experiment to Rajju's
existing field room; no new repository, external service, runtime dependency,
source-language transcription or historical performance claim is added.

## Try the actual work

With the development server running, open:

```text
http://127.0.0.1:4392/rajju/field.html?nearerr=10&farerr=0#cord-errors
```

At the northeast corner, predict a result before using **Near segment +0.10**.
The separate exact twelve mark keeps the first peg twelve units from E, while
the other procedures stake their altered grips. The 5–12–13 recipe's peg moves
about 0.260013 source units; the one-cord peg moves about 0.033223 under these
specific assumptions. Select **Same total, moved grip**, then **Large opposing
errors**. The latter cannot reach both anchors for the eastern 5–12–13 recipe.
Set near +3 and return -3 instead: this recipe is collinear and has no right
angle. Restore exact lengths to bring all four pegs together.

The [model](cord-error-model.md) gives every source length, chosen assumption,
reachability rule, coordinate convention and the worked numerical comparison.
The one-cord advantage is conditional on its separate twelve mark staying exact.
This is not a measurement of ancient precision or a ranking of historical methods.

## Source evidence and one repaired inconsistency

Printed pp. 10–11 were visually inspected as complete images. The existing
source reviewer downloaded the identified PDF, verified its SHA-256, reproduced
all twelve bundled page renderings with Poppler and checked all 21 retained
asset identities. [The source receipt](cord-error-sources.json) retains those
page hashes. No historical page, font or font license was changed.

The first audit failed at `notices.html`. Its hash still described the notice
before commit `0487734`, although that commit had changed the author and license.
The old notice's bytes exactly matched the stale digest. The inventory now names
the actual current notice, and the complete source check passes. The runtime's
build-derived asset verification was already using the current bytes.

## Independent geometry and operated behavior

| Check                           | Observed result                                                                                          |
| ------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `npm run check`                 | Lint, strict TypeScript, 24 tests and production build pass                                              |
| `npm run verify:cord-errors`    | 1,936 cases: 1,920 taut, 10 collinear, 6 unreachable                                                     |
| `npm run test:cord-errors`      | Chromium and Firefox, 1440 and 375 px; 112 operated states                                               |
| Python check of browser receipt | 448 visible result rows, 440 actual SVG endpoints and 32 downloaded CSV rows agree                       |
| Accessibility scan              | No WCAG 2 A/AA or 2.1 AA axe violations in the four reviewed comparison states                           |
| `npm run test:field`            | Original four-procedure/retained-peg journeys pass in both engines and widths; 80 rendered constructions |
| Existing field oracle           | 544 model cases and all 80 rendered constructions checked independently                                  |
| `npm run verify:geometry`       | Existing 120 circle cases and 16 numerical-diagonal cases pass                                           |
| `npm run test:offline`          | Both engines: held/substituted source refusal, verified recovery and origin-disabled use pass            |
| Development review              | Existing 12 journeys plus the new comparison in both engines and widths pass without a service worker    |
| Source re-render                | All twelve original pages reproduced; all 21 asset hashes verified                                       |

The new Python oracle imports no app code. Its literal source fixture contains
all eight west/east recipes. Instead of subtracting circle equations and using
Heron's product, it rotates the near segment and bisects its angle until the
free end has the prescribed distance to the other anchor. Integer side tests
separate tangent and unreachable cases. Tolerances apply to floating-point
coordinates and angles; this is not formal proof or physical measurement.

The browser driver measures the actual SVG leader endpoints and reads the
visible table values. It does not validate the plot by trusting its `data-dx`
metadata. Six-decimal interface readings and full-precision CSVs are checked
separately. Tiny engine-dependent floating-point differences are preserved in
the native per-engine CSVs, rather than silently normalizing their bytes.

The journeys also operate keyboard sliders without losing focus, scroll the
phone table with an arrow key, use browser back/forward, reload shared links,
retain previously placed pegs, open the cited full source page, and reject an
out-of-range error link without restoring a partial peg record. Errors do not
change the separately proposed grip or placed pegs. Selecting a corner is shared
with the main plan, as its label states.

After the actual local origin closes, each journey reloads, changes errors,
resets them, saves a complete illustrated reading and checks an invalid link.
Standalone readings open from disk without scripts or automatic HTTP requests.
Their four JPEGs match the retained source files byte for byte; their native CSV
downloads match the corresponding original download. [Machine-readable browser
observations](cord-error-browser.json) retain the plotted results. Only transient
URL/path metadata was replaced with the unchanged query and retained artifact
paths. Recheck them from the repository root:

```sh
python3 scripts/cord-error-oracle.py docs/cord-error-browser.json
```

To repeat the live production review after `npm run build`:

```sh
npm run test:cord-errors -- /tmp/rajju-cord-errors
python3 scripts/cord-error-oracle.py /tmp/rajju-cord-errors/receipt.json
npm run verify:cord-errors
npm run test:field -- /tmp/rajju-field
node --import tsx scripts/field-cases.ts | python3 scripts/field-oracle.py /tmp/rajju-field/review.json
python3 scripts/source-review.py
```

The browser scripts start isolated local servers. Do not rebuild `dist/` while
they are running. Existing installed Playwright Chromium and Firefox are required.
The Python geometry check uses only the standard library; the source re-render
also needs Poppler and a connection to the source PDF unless `--pdf` is supplied.

## Portable artifacts and visual review

- [Desktop screenshot](assets/cord-errors-desktop.png)
- [Phone plot and controls](assets/cord-errors-phone.png)
- [Actual native CSV](../examples/cord-errors.csv)
- [Complete illustrated reading, gzip](../examples/cord-errors-reading.html.gz)
- [Nine-page Chromium PDF](../examples/cord-errors-reading.pdf)

The saved reading is the original native download, compressed without altering
its HTML. Decompress it before opening. Its return-to-workshop link points to
the local test origin on which it was saved; it is not a public-deployment
receipt. The CSV and PDF are likewise actual browser downloads/output.

All six final screenshots from the new driver were visually inspected, along
with the PDF's comparison-table page. The controls, shape key and labelled
microscope are legible, with larger SVG labels on phones and no document-wide
horizontal overflow. The wide numeric table has its own keyboard-scrollable
region. The desktop screenshot places the first result at the viewport foot;
the remaining rows are below it. The PDF keeps the comparison table together
and includes the visible shape key. Text extraction recovers the four result
rows and chosen errors. Tagged output is not a PDF/UA certification. Physical
printing, screen-reader user testing and real cord measurement were not done.

## Clean build and publication boundary

A `git archive` of source commit `b9ca050` was extracted into an empty directory.
With Node 24.22.1, a fresh `npm ci`, `npm run check` and `npm run verify:cord-errors`
passed. All **29** build files, including `sw.js`, have identical names and bytes
to the browser-reviewed Node 26.7.0 build. [The build receipt](cord-error-build.json)
records every output hash. Subsequent changes in this review are documentation,
evidence artifacts and examples, outside the build input inventory.

Build with **`npm run build`**; complete static output is **`dist/`**, base
**`/rajju/`**. These are local source/build/browser receipts. No push, deployment,
remote CI execution, registry release or hosted-byte agreement is claimed.
The catalogue remains unchanged because this addition is not yet on the live demo.

Suggested repository description:
“Explore Indian cord geometry through Sanskrit, source scans, and experiments with areas, pegs and measurement errors.”

Suggested topics: `geometry`, `sulbasutra`, `sanskrit`, `history-of-mathematics`,
`education`, `web-app`, `offline-first`.

Implementation commits before this documentation record:

```text
b9ca050 test: verify rendered cord errors with an independent geometric oracle
8373168 fix: align notice identity with the current noncommercial license
05143d8 feat: add a portable four-procedure cord sensitivity bench
570ab8d feat: compare source cord recipes under independent segment errors
```
