# Contributing

For a source correction, identify the edition, printed page, exact phrase and
proposed reading. Distinguish a new translation, a printed error, a commentarial
interpretation and a conjecture about historical discovery. Preserve the complete
source images and their provenance.

For a geometry correction, supply the selected rule, dimensions, URL and reference
quantity. The returned square's relation to the original and to the intermediate
circle are different comparisons. Preserve exact rational arithmetic where the
rule is rational; don't infer tiny differences from line thickness in a screenshot.

Use Node.js 24 or later. Run `npm ci`, `npm run check`, and
`npm run verify:geometry`. Changes to controls, drawings, exports or offline
behavior also need the corresponding real browser journey. Keep sources local,
respect keyboard focus, inspect 375 px layouts and actual saved readings, and
avoid remote dependencies or tracking.

See [docs/model.md](docs/model.md) for the calculations and
[docs/design.md](docs/design.md) for the intended learning experience.
