# Hold fifteen. Stake twelve.

This room follows Āpastamba's ground-layout instructions as excerpted and
explained in George Thibaut's _The Śulvasūtras_ (1875), printed pp. 9–12.
It uses a fixed, already oriented centre line. It does not reconstruct the
preceding astronomical orientation or a complete ritual.

## One right angle, two distances

Use W = (0, 0), E = (36, 0), positive x east and positive y north.
The prescribed western width is 30; the eastern width is 24.

```text
WN (0,15)  +-------------------------+ H (36,15) = grip
           |  prescribed top slopes | :
           |                        + EN (36,12) = stake
W (0,0)    +-------------------------+ E (36,0)
           |                        + ES (36,-12)
WS (0,-15) +-------------------------+

schematic only; the interactive SVG uses equal axis scales
```

The 54-unit cord, fixed at W and E and held 15 from one end, has pieces 15
and 39. Since `15² + 36² = 39²`, its taut grip is perpendicular to the
baseline at that end. At W this is also the required corner. Reverse the
ends and repeat at E: the grip is 15 from E, but the corner is at the **12**
mark, three units nearer E. The same triangle supplies orientation and a
different mark supplies the corner's distance.

All four procedures supply the same ground. The table transcribes the
lengths from pp. 9–11; auxiliary coordinates follow from their stated inward
distances. A single bent cord stands for the two radii in each displayed
operation. The alternative methods use different cord lengths at the two ends.

| Source procedure           | End | Other fixed peg x | Baseline | Bent cord | Source grip | Stake mark |
| -------------------------- | --- | ----------------: | -------: | --------: | ----------: | ---------: |
| One cord                   | W   |                36 |       36 |        54 |          15 |         15 |
| One cord, ends reversed    | E   |                 0 |       36 |        54 |          15 |         12 |
| 3–4–5 enlarged fivefold    | W   |                20 |       20 |        40 |          15 |         15 |
| 3–4–5 enlarged fourfold    | E   |                20 |       16 |        32 |          12 |         12 |
| 5–12–13 enlarged threefold | W   |                36 |       36 |        54 |          15 |         15 |
| 5–12–13                    | E   |                31 |        5 |        25 |          12 |         12 |
| 8–15–17                    | W   |                 8 |        8 |        32 |          15 |         15 |
| 12–35–37                   | E   |                 1 |       35 |        49 |          12 |         12 |

The source treats an increase “three times” as adding three copies to the
original: fourfold total. The interface names the resulting enlarged triples,
and the table gives actual lengths to avoid that verbal ambiguity.

## Modern intersection model

Let the fixed endpoints be A and B, baseline distance `c`, total cord length
`L`, and grip mark `a`. The return piece is `b = L-a`. Both must reach:
`(L-c)/2 <= a <= (L+c)/2`. The UI stores `a` in hundredths of the chosen
source unit. This is a modern exploratory resolution, not a historical precision.

Measured inward along the baseline from A, the grip's abscissa is

```text
u = (c² + a² - b²) / (2c)
h = sqrt[(a+b+c)(-a+b+c)(a-b+c)(a+b-c)] / (2c)
```

The sign of h selects north or south; east-end operations reverse the x
direction. Heron's product avoids the worst cancellation near collinearity.
At either reachable endpoint, h is zero and the angle is not presented as
a right angle. Otherwise `atan2(h,u)` measures the grip-to-baseline angle
at the selected centre-line end. It is **not** an interior angle of the
trapezoid at a corner.

The stake mark is either the user's grip or the source's measured half-width.
It is located by walking the piecewise cord, including the return leg if the
user moves the grip before that mark. The modern elliptical locus has semiaxes
`L/2` and `sqrt((L/2)²-(c/2)²)`; it is optional and explicitly attributed to
modern analysis.

Each placed peg retains a method, grip and stake choice independently.
Its coordinates are recomputed from that record. Changing the proposed grip
does not move retained pegs. URL input never supplies trusted coordinates;
malformed, duplicate, unreachable or truncated records reset the entire layout
with an explanation. Four pegs are needed for an area. A crossed or collapsed
boundary has no simple enclosed-ground area assigned.

## What can be learned

| Operation                | Grip at E | Eastern peg           |                    East width |                     Area |
| ------------------------ | --------: | --------------------- | ----------------------------: | -----------------------: |
| Follow the source mark   |        15 | (36, ±12)             |                            24 |                      972 |
| Stake both eastern grips |        15 | (36, ±15)             |                            30 |                     1080 |
| Hold at twelve instead   |        12 | (40.5, ±sqrt(123.75)) | Off the prescribed cross-line | Depends on all four pegs |

The first two both make a right angle at E. An angle check alone cannot
establish the prescribed ground. The correct area is
`36 × (30+24) / 2 = 972`; the all-grips rectangle is `36 × 30 = 1080`,
one ninth larger. These are square source units, not square metres.

## Reading decisions and limits

The four Sanskrit excerpts retain the printed word order and normalize
Unicode, spacing and punctuation. The final anusvāra in the marks excerpt
is retained. English brackets supply a copula or contextual reference;
IAST is a reading aid, not a pronunciation reconstruction or critical edition.
The two named alternative measures are not converted into a common ancient
physical length.

Printed p. 10 calls the first pair southwest and southeast, while describing
south/north operations at the western end. The modern plan labels those
positions southwest and northwest. That direction discrepancy is stated next
to the full scan and retained in saved readings, rather than silently repaired
in the evidence. The terms śroṇī and aṃsa name haunches and shoulders, respectively.

The paper template always restores the selected source procedure, independently
of a deliberately altered proposal. Its chosen paper unit is 3 mm:
`186mm / 620 SVG units × 10 SVG units = 3mm`. The centre line is 108 mm,
the 54-unit cord 162 mm, and the 100-SVG-unit calibration bar 30 mm.
The user must print at 100% and measure the bar; no physical printer or
historical-unit accuracy is inferred from the file.

Ideal cords, point pegs, a flat plane and a known east line are assumptions.
No archaeological survey, physical tolerance, invention priority, ancient
derivation, or full ritual reconstruction follows from the numerical model.
