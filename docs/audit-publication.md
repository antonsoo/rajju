# Public cord experiment and repaired reading edition

Reviewed on 2026-11-02. The live experiment is
[Same error. Different miss.](https://antonsoo.github.io/rajju/field.html?corner=en&nearerr=10&farerr=0#cord-errors).
It compares four source cord procedures under two independently chosen length
errors. The historical lengths and modern assumptions are explained in the
[model review](cord-error-model.md). This does not establish ancient precision
or a historically preferred procedure.

## Published bytes

Source `cf3126955c2c61179a13700c48326856f136e274` was pushed to `main` and its
generated build to `gh-pages` commit
`13882da2af2082ca0fed2f588586bb64bf0f4fa0` without rewriting branch history.
The reviewed runtime is `6e95251`; the following source commit adds audit
records. A fresh Node 24.22.1 install/build produced the same 30 files as the
Node 26.7.0 working build. [Build inventory](audit/build.json).

After the public browser journeys, all 30 canonical hosted files and the
canonical directory entry matched that inventory byte for byte.
[Hosted receipt](audit/hosted.json). Recheck with:

```sh
node scripts/hosted-audit.mjs https://antonsoo.github.io/rajju/ /tmp/rajju-hosted.json
```

This compares against the retained reviewed inventory; it does not silently
replace it with a newly built edition. No remote CI run was observed in the
separate Actions query. Local validation and deployed-byte equality are the
available evidence, not a claim of successful remote CI.

## Operated public edition

Chromium and Firefox each operated the public site at 1440 and 375 pixels:

| Workflow | Operated observations |
| --- | --- |
| Circle and diagonal rooms | 44 constructions, checked against the independent geometry oracle |
| Field workshop | 80 constructions, with the separate 544-case field oracle |
| Cord-error bench | 112 states, 448 visible result rows, 440 actual SVG endpoints and 32 downloaded CSV rows checked by the independent Python oracle |

Each driver checked keyboard operation, source-page identity, real native
file downloads and operation after service-worker control with the context
network disabled. The saved HTML was opened from disk; its illustrated reading
made no HTTP requests. This is distinct from merely inspecting an HTTP 200 or
an online screenshot. The [main-room receipt](audit/public-main.json), [field receipt](audit/public-field.json)
and [public cord receipt](audit/public-cord.json) retains
the operated values and actual CSV paths. It can be independently checked with:

```sh
python3 scripts/cord-error-oracle.py docs/audit/public-cord.json
npm run test:cord-errors -- /tmp/rajju-public https://antonsoo.github.io/rajju/
```

The [current CSV](../examples/audit/cord-errors.csv),
[gzipped saved HTML](../examples/audit/field-reading.html.gz) and
[ten-page tagged PDF](../examples/audit/field-reading.pdf) were downloaded or
printed from the public edition. Decompress the HTML before opening it. Its
return link points to the canonical public workshop and its code/font license
terms and Required Notice travel with the file. The PDF's final notice page
was visually inspected; this does not establish physical-printer behaviour.

The earlier example files and reviews remain historical local-build records.
Their local return links are not evidence of current public operation.

## Audit boundaries

The [failure and recovery review](readiness-audit.md) records independently
reproduced wrong-page display, false offline readiness, missing-cache recovery,
MIME damage, stalled transfers, stale navigation HTML, worker takeover, cancelled
exports and overlapping peg boundaries. Those deliberately mutated/offline
origin-server scenarios were operated locally against production builds, not
injected into the public site. The public drivers verify the shipped normal
journeys and offline reloads; they do not claim to mutate a public server.

The source review independently rendered the identified Thibaut PDF and checked
all 22 retained source/font/notice assets. The source pages remain full printed
pages; modern model labels do not claim a reconstruction of ancient work.
