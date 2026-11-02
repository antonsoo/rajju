# Same error. Different miss.

A modern sensitivity experiment inside `field.html`. The question is narrower
than a claim about historical precision: if the stated segment lengths are
altered by the same two absolute amounts, do the four ideal procedures still
put their pegs together?

## Source boundary

The input lengths are from George Thibaut's 1875 _The Śulvasūtras_, printed
pp. 10–11, in the [Oxford scan retained by Internet Archive](https://archive.org/details/ulvastras00ktgoog).
Both complete bundled pages were visually inspected for this change. Page 10
separates the eastern fifteen grip and twelve stake and describes the enlarged
3–4–5 procedure. Page 11 continues that procedure and supplies the other triples.
The existing [field model](field-model.md) preserves the complete lengths and
the source's direction discrepancy. No new ancient-language text is introduced.

| Procedure      | End  | Baseline | Near segment | Return segment | Stake                |
| -------------- | ---- | -------: | -----------: | -------------: | -------------------- |
| One cord       | West |       36 |           15 |             39 | Grip                 |
| One cord       | East |       36 |           15 |             39 | Separate twelve mark |
| Enlarged 3–4–5 | West |       20 |           15 |             25 | Grip                 |
| Enlarged 3–4–5 | East |       16 |           12 |             20 | Grip                 |
| 5–12–13        | West |       36 |           15 |             39 | Grip                 |
| 5–12–13        | East |        5 |           12 |             13 | Grip                 |
| Paired triples | West |        8 |           15 |             17 | Grip                 |
| Paired triples | East |       35 |           12 |             37 | Grip                 |

Only these lengths and the distinct twelve mark are source claims. Perturbing
them, comparing sensitivity and plotting the displacements are modern analysis.
We do not know real error distributions, cord properties, knot sizes, peg
thicknesses, correlations between measurements or choices made by practitioners.

## Two independent changes

The experiment adds `nearError/100` and `farError/100` source units to the two
prescribed segment lengths. Each error is an integer between -300 and 300.
Positive means longer. Both anchors and their separation stay fixed.
- Altering one segment changes the total length.
- Adding to one and subtracting from the other keeps total length fixed, as
  moving a grip along an ideal bent cord would do.
- Altering both equally is neither of those single-segment changes.

For each recipe, let the actual near and return lengths be `a` and `b`, with
baseline `c`. Integer hundredths decide `a+b < c` or `|a-b| > c` before any
floating-point calculation. These cases cannot reach both anchors and receive
no coordinate. Equality gives a collinear cord, with no reported right angle.
Otherwise, two circle intersections exist; the selected corner chooses the side.
The coordinates use the same circle-subtraction and Heron-product geometry
as the ideal field, with independently altered radii.

Stake the actual grip for every operation except the eastern one-cord procedure.
In that operation keep its distinct twelve mark exact. Multiplying the grip
vector from E by `12/a` locates the peg. The bound `15 - 3 >= 12` keeps the mark
on the near leg in every allowed case. This deliberately asymmetric assumption
must accompany any comparison: the apparent advantage of this procedure is
conditional on the separate mark staying exact.

The four recipes are always reset to their prescribed lengths before applying
the errors. The main proposal's altered grip is not an additional hidden error;
previously placed pegs are independent records. Selecting a different corner is
shared with the main plan; changing either error does not change those records.

## A worked eastern comparison

With near error +0.10 and return error zero, numerical evaluation gives:

| Procedure                            | East offset | North offset | Distance from prescribed peg |
| ------------------------------------ | ----------: | -----------: | ---------------------------: |
| One cord, separate exact twelve mark |   -0.033223 |    -0.000046 |                     0.033223 |
| Enlarged 3–4–5                       |   -0.075313 |    +0.099766 |                     0.125001 |
| 5–12–13                              |   -0.241000 |    +0.097600 |                     0.260013 |
| 12–35–37                             |   -0.034429 |    +0.099951 |                     0.105714 |

All entries are source units, rounded to six decimals. They are not a ranking
of historical methods. Change the error pattern and the comparison changes.
The one-cord peg remains twelve from E; the other three are 12.1 from E.
The western one-cord and enlarged 5–12–13 recipes coincide because they use
identical geometry and stake assumptions.

For the eastern 5–12–13 recipe, errors -3 and +3 give lengths 9 and 16 with
baseline 5: their circles do not meet. Reversing the errors gives 15 and 10;
the circles are internally tangent and the cord is collinear. A fixed total
length alone does not guarantee reachability or a right angle.

## What the drawing means

The plot shows displacement from the prescribed peg, with east right and north
up. Both axes share one scale. Its automatically selected extent is written
on the plot and described immediately below it. The outline is a magnification
guide, not the boundary of an ancient ground or a tolerance envelope. The scale
can change between settings; compare the numbers when comparing snapshots.
Unreachable recipes have no symbol. Coincident symbols can overlap, so the
results table retains every procedure and outcome. Shapes as well as colours
identify the four recipes.

The saved HTML includes the same results, diagram, shape key, assumptions,
source pages and an embedded native CSV download. Its link restores the complete
field state including both errors; older links default both errors to zero.
Malformed, duplicate or out-of-range error parameters reset the whole record,
with a visible explanation. CSV coordinates are floating-point results; the
interface's six decimals are rounded, not exact rational quantities.

## Design decisions

Extend the existing cord plan's palette: ink `#173c51`, board `#d5e3e9`, chalk
`#fbfcf9`, rust `#a6462c`, river `#226579`; distinguish the fourth symbol with
`#684d82`. Keep Newsreader for the question and Plex for the controls and numeric
results. Add no new font, dependency, artwork or moving decoration.

```text
question                     prediction and source link
corner + two segment errors  common-target displacement plot
four named result rows, including impossible/collinear cases
assumptions and a portable record
```

The characteristic visual is the four displaced pegs around one target, rather
than four interchangeable cards. On phones the controls precede the plot and
only the results table scrolls horizontally; its container accepts keyboard
focus. Source scans and the full ground plan remain separate, preserving their
own scales and meanings.
