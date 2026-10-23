# Reviewed local edition

This review concerns the source checkout, built files, actual local browsers and
saved artifacts. It makes no claim about a public repository, GitHub Pages,
registry package or executed hosted CI. Build with `npm run build`; publishable
static output is `dist/` with the `/rajju/` base path.

## The learning result

The square-to-circle workshop makes three different comparisons explicit:

```text
original square          intermediate circle          returned square
area / original = 1  -->  1.0172524353936727       -->  1.0000047717861482

The endpoints almost match. The intermediate area does not.
```

The geometric diagonal is kept separate from the rational-diagonal lesson.
The latter evaluates 577/408 exactly, including the area remainder of
1/166464 of the original square, or 1/332928 of the target double square.

Four source-language excerpts and eleven word notes connect the operations to
the printed instructions. Nine complete source pages, visible error references,
and downloadable evidence keep the mathematical interpretation inspectable.

## Independent calculation and actual browser geometry

The following commands completed successfully:

```sh
npm run check
npm run verify:geometry
npm run test:browser -- /tmp/rajju/review
python3 scripts/geometry-oracle.py --rendered < /tmp/rajju/review/browser.json
python3 scripts/source-review.py --pdf /tmp/rajju/ulvastras00ktgoog.pdf
npm run test:offline -- /tmp/rajju/offline
```

| Evidence                                                 | Result                                                       | Receipt                                                                                    |
| -------------------------------------------------------- | ------------------------------------------------------------ | ------------------------------------------------------------------------------------------ |
| Exact construction contracts and invalid state           | 10 checks passed                                             | `tests/constructions.test.ts`                                                              |
| Independent source arithmetic and polar area integration | 120 circle cases and 16 diagonal cases                       | [geometry-review.json](geometry-review.json)                                               |
| Actual drawn coordinates and downloaded CSV              | 44 constructions checked independently                       | [rendered-review.json](rendered-review.json), [browser-review.json](browser-review.json)   |
| Historical PDF and rendered page identities              | 9 complete page renderings reproduced; bundled bytes checked | [source-review.json](source-review.json), [source-identities.json](source-identities.json) |
| Held and substituted sources, then recovery              | Both scenarios passed in both browser engines                | [offline-review.json](offline-review.json)                                                 |
| Complete build bytes                                     | Local file inventory and SHA-256 identities retained         | [build-review.json](build-review.json)                                                     |

The initial environment used Node 26.7.0, Python 3.12, Playwright 1.63.0,
Chromium 153.0.8010.12 and Firefox 155.0 on WSL2 Linux. The source rendering
uses the Poppler version named in the source identity manifest.

A fresh local Git clone then installed with Node **24.22.0** and npm **11.19.1**.
`npm ci`, the full check, independent geometry check, both browser engines,
all four production journeys, all four source-delay/substitution scenarios and
eight development lesson/width journeys completed successfully. All **22** built
files match the reviewed original build byte for byte, including the worker.
The final static build is **5,251,026 bytes**. [clean-review.json](clean-review.json)
records the application source commit and log identities;
[development-review.json](development-review.json) records the actual documented
development command's rendered drawings, keyboard controls and native downloads.

The independent checker imports no application code. It transcribes the source
fractions and integrates each protruding region in polar coordinates with
Simpson's rule; the app uses a circular-segment closed form. For the browser
receipt it reads actual SVG circle radii, return-square widths, numerical-square
polygon coordinates and the real downloaded CSV. Agreement concerns the model
and rendering, not historical authorial intent or physical construction.

## Real reading journeys

Chromium and Firefox each ran at 1440 and 375 px. The review exercised source
third, a rescaled square, modern equal-area radius, inscribed and circumscribed
endpoints, custom 333/1000, shorter return and all four diagonal stages.

Each of the four journeys also used real keyboard activation, invalid dimensions
with the last valid drawing retained, word selection without focus loss, source
zoom and horizontal pan, browser back/forward, clipboard-denied link selection,
duplicate-parameter rejection, native CSV and HTML downloads, and offline reload.
The local origin's open sockets closed before offline reload and source-page
navigation. The offline saved-reading download still completed.

The completed review retained 12 independent saved-file openings and downloads,
each with nine source-image hashes checked against the actual bundled JPEGs.
The saved files contain no scripts and made no HTTP requests when opened.
Both lesson states in all four browser/width combinations had zero findings
under the selected axe WCAG 2 A/AA and 2.1 AA tags. There were no page errors
or external runtime requests in the reviewed main-page journeys. This is a
bounded automated accessibility review, not comprehensive certification.

The review found and fixed a phone overflow in the exported edition identifier.
The source third also remains distinct from a custom 333/1000; only the former
uses exactly one third. The phone layout puts construction steps and the plan
ahead of optional scale and comparison controls.
At the two radius limits, coincident points share the labels `R = E` or `R = H`.
This fixes the overlapping endpoint letters found in the final phone inspection.

## Slow and incorrect source responses

For each browser, a fresh installation held printed page 12 beyond nine seconds.
The footer remained pending and the illustrated reading waited; neither claimed
complete offline availability or produced a premature download. Restoring the
source completed both operations.

In another fresh installation, the same URL returned the valid JPEG for p. 13
with HTTP 200. The worker's integrity-checked installation failed and the saved
reading refused the wrong bytes. After the server restored p. 12 and the page
reloaded, the current edition installed and a verified reading downloaded. The
receipt records the worker's edition and complete inventory response.

This does not establish every storage-eviction or worker-upgrade scenario.
No older published Rajju edition exists in this review.

## Saved and printed artifacts

- [Circle reading HTML](../examples/circle-reading.html.gz): actual native download,
  all nine page images, source-language excerpts, measurements, fonts and licenses.
- [Circle reading PDF](../examples/circle-reading.pdf): actual Chromium A4 print,
  15 pages, including each complete source page.
- [Circle CSV](../examples/circle-measurements.csv) and
  [diagonal CSV](../examples/diagonal-measurements.csv): actual native downloads.

The PDF's first two pages and a complete source-page leaf were rendered back to
images and inspected. The return heading stays with its following text. The
saved HTML was opened independently at desktop and phone widths; the edition
identifier wraps, diagrams retain their strokes, images load, and tables remain
inside the viewport. The illustrative error ruler states its changing scale.

The example retains the local build's original-session link. That is not a
hosted publication link; the document's contents work independently of it.

## Screenshots and assessment

- [Circle, desktop](assets/circle-desktop.png) and [phone plan](assets/circle-phone.png)
- [Diagonal, desktop](assets/diagonal-desktop.png) and [phone plan](assets/diagonal-phone.png)
- [Reading, desktop](assets/reading-desktop.png) and [phone](assets/reading-phone.png)
- [Circumscribed endpoint, phone](assets/circle-endpoint-phone.png)

The blue drawing ground and the cut/gained hatching make the comparison legible
without pretending to reconstruct an altar's appearance. The two near-identical
return outlines intentionally coincide at normal scale; the separate ruler
provides the small difference. All retained screenshots were inspected. The
page remains a substantial reading exercise on a phone; no claim of usability
testing with learners or expert review of the Sanskrit is made.

## Handoff

Suggested repository description: **Indian cord geometry: a square, an oversized circle, a near-perfect return, and the diagonal 577/408.**

Suggested topics: `sulbasutra`, `sanskrit`, `geometry`, `history-of-mathematics`,
`education`, `typescript`, `offline`.

Publication remains unperformed, as required by the showcase house standards.
No GitHub repository was created, and no source, tag or built site was pushed.
