# Source reading, saved work and boundary audit

Audited on 2026-11-02 against the actual browser workflows. The earlier
[cord-error review](cord-error-review.md) established the comparative model,
but its installation-failure tests did not establish that an already saved
edition could detect and repair damaged bytes. This review covers that gap,
displayed source identity, retained work and a separate enclosure error.

## Try the actual work

1. Open `field.html?corner=en&nearerr=10&farerr=0#cord-errors`. Compare the four
   procedures, move an error with the keyboard and keep a peg in the main plan.
2. Open a printed source page. The image stays hidden until the entire selected
   page passes its expected byte count and SHA-256. Its full-image link opens
   those same verified bytes, not a second unverified response.
3. Save an illustrated reading. Cancel if needed, change the construction, and
   retry. Saving retains the state captured at the click, rather than replacing
   it with subsequent changes.
4. Use **Check & repair offline edition** in the footer before disconnecting.
   This checks the actual cache bytes and can repair the existing edition;
   reloading is not treated as a repair.

## Reproduced failures

Both Chromium and Firefox reproduced these states in the pre-audit build
`e1b1ca6`, without altering repository source files:

| Mutation or response                                  | What the earlier build did                            |
| ----------------------------------------------------- | ----------------------------------------------------- |
| Replace cached p. 11 with the valid JPEG for p. 10    | Reported a complete saved edition                     |
| Select p. 11 after that replacement                   | Displayed p. 10 beneath the p. 11 caption             |
| Delete p. 11, then reload online twice                | Remained incomplete; neither reload repaired the file |
| Keep a second room open during that loss              | The second room kept its old saved-offline claim      |
| Keep a cached module's bytes but change its MIME type | A fresh field page could not render                   |

The [before receipt](audit/before.json) retains both engines' observations,
including the selected caption, actual wrong-image hash and stale status.
The source hash is that of the unmodified bundled p. 10 JPEG, not a fabricated
image or an OCR replacement. The old build is reproducible from the source
commit and `npm ci && npm run build`; the replay accepts that build directory:

```sh
node scripts/audit-reproduce.mjs /tmp/rajju-before <old-dist-directory>
```

## Corrected source and recovery behavior

The shared source viewer reads the whole selected page, bounds it by the
expected byte count, checks SHA-256 and verifies that it decodes before assigning
a blob URL to the visible image. Changing pages aborts the old read. A generation
check also prevents a late decode from replacing the newer page or its status.
Failed pages have no active full-image link. Loading and errors collapse the
empty image frame; on phones the retry action stays beside the caption.

The generated worker now has a readable source file,
[`src/worker-runtime.js`](../src/worker-runtime.js), with the complete build
inventory, byte counts and hashes prepended by Vite. A saved claim needs the
controlling edition and every cached file's correct bytes. Inspection does not
open missing cache names, so an obsolete inspection cannot recreate a removed
edition. The footer rechecks on load, focus, visibility and reconnection; reads
that detect loss also invalidate the other controlled rooms.

Repair replaces only missing or damaged files after verifying their complete
bodies. Failed replacements do not become trusted cached files. A whole-cache
loss is recoverable from an already open workshop. Repair and activation share
a Web Lock so replacement cannot remove an edition midway through its repair.
The reviewed engines support this path. A browser without that facility retains
online reading and portable studies but does not repair the cache in place.

Cached response MIME types are derived from their verified build paths when
served, and stale content-encoding headers are removed. A correct module body
with an unusable cached header can therefore load. Known navigation pages also
require a verified complete body: stale HTTP-200 entries with obsolete module
links, temporary 503s, stalled headers and stalled bodies use the verified saved
page. A two-second navigation window bounds waiting for that fallback; an
edition mismatch initiates an update check rather than mixing editions.

Exports have an explicit cancel action and release their pending reads. Source
and export reads use a twenty-second inactivity deadline which resets with
arriving chunks. They do not impose a twenty-second total limit on an active
body. Foreground source reads do not wait behind an entire background repair.
In the cold-read audit, the missing source and its repair both remained active
for about 29 seconds, and the exact source JPEG still displayed successfully.
This is a controlled network fixture, not a measurement of a user's connection.

## An area that was not an enclosure

These individually legal peg settings produce a boundary that doubles back:

```text
WN(-9,0) -> EN(45,0) -> ES(12,0) -> WS(0,-15) -> WN
             east       west
```

The earlier model reported area **157.5** because the shoelace sum was nonzero.
The EN-to-ES segment retraces part of WN-to-EN, so this is not a simple four-peg
enclosure. [Exact pre-fix coordinates](audit/overlap-before.json) are retained.
Open this case after starting the app:

```text
http://127.0.0.1:4392/rajju/field.html?placed=wn,one,900,grip;en,one,900,grip;es,345,2400,grip;ws,one,1500,mark#ground-heading
```

Inclusive opposite-edge intersection checks now reject crossings, touching and
overlap. The interface, CSV and illustrated reading withhold an area. The plan
draws invalid boundaries without filling a supposedly enclosed region. The
[model](field-model.md#when-a-boundary-doubles-back) records the numerical tolerance
and separates the modern coordinate test from the source's prescriptions.

## Operated verification

| Command or observation                        | Result                                                                                                                    |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `npm run check`                               | Lint, strict TypeScript, 25 tests and build pass                                                                          |
| `npm run test:audit`                          | Four readiness contexts and four source/export contexts, across Chromium/Firefox and desktop/375 px                       |
| Cache faults                                  | Missing file, same-size corruption, wrong replacement and whole-cache loss detected/repaired without losing the layout    |
| Peer state                                    | Another open room loses its stale ready claim and receives verified recovery                                              |
| Navigation faults                             | 503, stalled headers/body and a stale HTTP-200 module link fall back to the verified reading                              |
| Cold foreground read during repair            | Both engines display the exact source after approximately 29 seconds of continuous transfer                               |
| Export cancellation                           | No late reading download; save is usable again and keyboard focus returns to it                                           |
| Update from the earlier build                 | Delayed and substituted source responses preserve the old edition until a complete replacement succeeds, in both engines  |
| Repair/update overlap                         | Synthetic next edition waits for the active repair; only its cache remains after activation; work survives reload         |
| Deliberately injected obsolete-worker success | Ignored after controller replacement                                                                                      |
| Original learner journeys                     | Circle/diagonal: 44 measured constructions; field: 80; error comparison: 112 states / 448 displayed rows / 440 SVG points |
| Independent geometry                          | 120 circle cases, 16 numerical-diagonal cases, 544 field cases and 1,936 error cases agree                                |
| Source re-render                              | Twelve complete original pages reproduced; all 22 retained asset identities verified                                      |
| Fresh install                                 | Node 24.22.1 check passes; all 30 build files equal the reviewed Node 26.7.0 output                                       |

The [readiness observations](audit/readiness.json), [upgrade record](audit/upgrade.json),
[repair/update record](audit/rollout.json), [source receipt](audit/sources.json) and
[clean-build hashes](audit/build.json) keep these claims separate. The synthetic
next edition changes a source comment to obtain a new build identity; it is not
a second historical model or a separately published release. Its queued old
inspection may legitimately finish before takeover. A separate injected message
checks that an old worker's success cannot overwrite the post-takeover warning.

The reviewed audit states have no axe WCAG A/AA violations or page exceptions.
The tests open actual native downloads from disk, retain complete source image
bytes, and exercise operation after the origin closes. They do not establish
physical cord accuracy, printing accuracy or screen-reader user experience.
The source and modern numerical assumptions are unchanged.

```sh
npm run build
npm run test:audit -- /tmp/rajju-audit
node scripts/rollout-audit.mjs /tmp/rajju-rollout
node scripts/field-upgrade.mjs <old-dist-directory> /tmp/rajju-upgrade
npm run test:field -- /tmp/rajju-field
npm run test:cord-errors -- /tmp/rajju-cord
python3 scripts/cord-error-oracle.py /tmp/rajju-cord/receipt.json
python3 scripts/source-review.py
```

Do not rebuild `dist/` during a browser review. The rollout driver builds an
isolated synthetic next edition in its output directory. The ordinary browser
reviews use the installed Playwright Chromium and Firefox. Source re-rendering
also requires Poppler and the identified PDF or a connection to download it.

[Refused source on a phone](assets/source-refused-phone.png) ·
[Verified offline repair on a phone](assets/offline-repaired-phone.png).
The source-error frame, footer controls, desktop/phone comparison and printed
results were visually reviewed. The existing palette, source pages and fonts
were retained; no decorative media was added.

## Publication boundary

This document records local source, browser and clean-build evidence. Public
source synchronization, generated deployment and hosted-byte/browser verification
are recorded separately after publishing. Build command: **`npm run build`**;
complete output: **`dist/`**, base **`/rajju/`**. The earlier review remains a
record of its earlier build and artifacts, rather than proof for this edition.
