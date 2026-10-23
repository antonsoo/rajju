# A circle, its return, and a different diagonal

For the separate marked-cord ground layout, see [the field model](field-model.md).

The circle workshop follows the geometric instruction with a true square
diagonal. The diagonal workshop evaluates a separate rational approximation.
Substituting the latter into the former would conflate two quite different errors.

Let the starting square side be `s`, the half-side `a = s/2`, and the geometric
half-diagonal `h = s/sqrt(2)`. Swing the cord of length `h` east from the centre.
The projecting part is `h - a`. The source instruction keeps one third of it:

```text
corner A
       /              C--------E---R------H   east
      /               | inside | retained | remainder
     C                C-E = a; E-H = h-a; E-R = (h-a)/3

r = a + (h-a)/3 = s (2 + sqrt(2))/6
```

`C` remains fixed. The code uses one scale on both axes. It is a modern plan,
not a tracing of a historical diagram or a proposed physical instrument.

For a chosen fraction `f`, the normalized radius is
`rho = r/s = 1/2 + f (sqrt(2)-1)/2`. The range `0 <= f <= 1` runs from
the inscribed circle to the circumscribed circle. The modern equal-area comparison
sets `rho = 1/sqrt(pi)`. It is numerical; no claim of an exact ancient cord
construction is made.

The four bulges outside the square are disjoint over this radius range. Their
combined area, divided by `s^2`, is

```text
G = 4 [rho^2 acos(1/(2 rho)) - (1/2) sqrt(rho^2 - 1/4)]
L = 1 - pi rho^2 + G
```

`L` is the total area of the removed corners, with the same normalization.
Consequently `G - L = pi rho^2 - 1`. Cancellation at the two endpoints can
produce a tiny negative floating-point residue; the nonnegative region areas
are clamped at zero there. The independent checker integrates the protruding
regions in polar coordinates with Simpson's rule, rather than reusing this
closed form.

The detailed return instruction removes `28/29` of one eighth of the diameter,
then a sixth of the retained twenty-ninth, diminished by its own eighth. Thus

```text
k = 1 - 28/(8*29) - [1/(8*29*6) - 1/(8*29*6*8)]
  = 7/8 + 1/232 - 1/1392 + 1/11136
  = 9785/11136

returned side / s = 2 rho k
returned area / s^2 = (2 rho k)^2
```

The alternative returns `13/15` of the diameter. These are source instructions;
their rational factors are exact, while their geometric area claims are not.

At the source third, with the geometric diagonal, the circle area ratio is
`1.0172524353936727`. The detailed return area ratio is
`1.0000047717861482`. The returned square is about `1.695515%` smaller than
the intermediate circle. Each percentage names its own reference; the similar
endpoint squares do not establish an area-preserving path.

## The numerical diagonal

The four selectable totals are exact `BigInt` fractions:

| Stage                                | Cord / original side | Square on cord / original square |
| ------------------------------------ | -------------------- | -------------------------------- |
| Start                                | 1                    | 1                                |
| Add a third                          | 4/3                  | 16/9                             |
| Add a fourth of that third           | 17/12                | 289/144                          |
| Remove a thirty-fourth of the fourth | 577/408              | 332929/166464                    |

Since `577^2 - 2*408^2 = 1`, the final square's excess is exactly
`1/166464` of the original square, or `1/332928` of the target double area.
The latter is `3.003652441...` parts per million. These different denominators
are explicit in the app, table, CSV and saved reading.

At a chosen side of 1000 mm the final cord is about 0.002123901 mm longer
than the geometric diagonal. The ruler below the plan rescales the signed
numerical difference; it does not distort the main construction.

Thibaut's pp. 14–15 propose an explanation using a 17-by-17 square and two
strips of depth 1/34. Their summed areas are one, but their overlap was counted
twice. The remaining area is `288 + 1/1156`. Dividing lengths by 12 gives
the same final cord and the excess `1/166464`. This is an illustration of his
explanation, not evidence that the rule's ancient author used that derivation.

## Inputs, readings and saved evidence

The chosen physical scale is an integer side from 100 to 10000 mm. The source
third stays exactly a third; a custom 333/1000 is a different setting. The main
plan does not change its normalized drawing scale when the physical side changes.

Shared URLs retain both lessons' controls and the independent selected source
page. Invalid or conflicting known fields reset the whole selection with an
explanation; unrelated campaign parameters are preserved when sharing. Browser
history restores the full selection. No account, local progress score or
personal measurement is inferred.

The CSV names each reference area. A saved reading captures the selection at
click time, verifies source pages and fonts against the current edition's hashes,
and embeds their original bytes. It uses no scripts or runtime network requests.
Sources are full pages, rather than reconstructed OCR text. Offline readiness
requires the current edition identity and a complete cached inventory.

Finite pixel coordinates, decimal displays and JavaScript square roots are
modern numerical approximations. They verify the rendered models, not the
historical dating, physical cord accuracy, linguistic authority or authorial intent.
