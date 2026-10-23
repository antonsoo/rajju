# Initial public edition

[Public source](https://github.com/antonsoo/rajju) ·
[Live workshop](https://antonsoo.github.io/rajju/).

The first public source revision is `fc32d79`. The prepared site was pushed to
the `gh-pages` branch and enabled as the branch-served Pages site. No package
registry release was made; this is a static browser application.

The [canonical byte receipt](publication-initial/hosted-bytes.json) verifies
all 22 files against the reviewed build, including the root entry, explicit
`index.html`, JavaScript, CSS, all nine source scans, fonts and worker. The root
was checked again after the file pass. This establishes the observed public
bytes during that pass, separately from the Git push.

The [hosted browser journeys](publication-initial/browser.json) exercised
Chromium and Firefox at 1440 and 375 px. All 44 SVG/CSV constructions agree
with the [independent checker](publication-initial/rendered.json). Keyboard
controls, source zoom/pan, word selection, browser history, invalid input and
URLs, clipboard fallback, native downloads, standalone saved-file opening and
offline reload all completed. Hosted offline checks disable browser networking;
the earlier local checks additionally closed the origin's sockets.

The example [compressed reading](../examples/circle-reading.html.gz) and
[15-page PDF](../examples/circle-reading.pdf) were refreshed from the actual
public-browser download. Decompress the HTML before opening it. Its nine page
images were checked against the original bundled JPEG bytes, and it opens
without runtime HTTP requests. Its construction link now names the canonical
public workshop.

Before first publication, generic temporary paths replaced machine-specific
review paths in the unpublished history, and the large saved HTML was archived
with gzip. The source pages, fonts and decompressed native reading bytes were
verified through that preparation. The earlier local source commit identities
in historical receipts predate this normalization; they are not presented as
public Git revisions.

The [initial local review](review.md) records the mathematical model, source
boundaries, clean installation, build, print and offline integrity experiments.
The public repository state is retained in
[repository.json](publication-initial/repository.json). CI configuration is
present; this record does not claim a hosted CI execution.

## Ground-layout edition

The 0.2.0 ground room was introduced in `12e1ddf3b0b53ca65f48c0f39a0cb2439fbcf02e`; current application source is `3b2c66b`, including paper-label spacing.
All 29 canonical production files match its reviewed build, including `field.html`
and the new source pages. The [field review](field-review.md) retains the hosted
80-construction browser journeys, independent coordinate checks and initial-edition
upgrade evidence. The field examples were downloaded from the canonical public
site, and their embedded online links refer to that site. Documentation-only
commits after this application source do not alter the generated edition.
