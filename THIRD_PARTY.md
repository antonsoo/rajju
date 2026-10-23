# Source pages, transcription and fonts

The primary printed source is George Thibaut, _The Śulvasūtras_, Calcutta,
Printed by C. B. Lewis, Baptist Mission Press, 1875, reprinted from the
_Journal of the Asiatic Society of Bengal_, part I. This is an explanatory
study with Sanskrit extracts and English translations, not a newly constituted
critical text of the entire Baudhāyana Śulbasūtra.
- [Internet Archive item and metadata](https://archive.org/details/ulvastras00ktgoog)
- [Exact PDF](https://archive.org/download/ulvastras00ktgoog/ulvastras00ktgoog.pdf)
- PDF SHA-256: `a756f929ed82c18f59e336067fa6f2bbb555885a06ad0818dd2c5042094b3048`
- Copy: Oxford University, digitized by Google; Internet Archive item
  `ulvastras00ktgoog`, metadata marked `NOT_IN_COPYRIGHT`.

The historical Sanskrit, 1875 English and complete page renderings are public
domain. The app's new English translations, grammar notes and diagrams are MIT.
No modern photograph or modern critical edition is redistributed.

| Printed page | PDF page, one-based | What the app uses                                                           |
| ------------ | ------------------- | --------------------------------------------------------------------------- |
| 6            | 12                  | Context of ritual area transformations; the editor's account of motivations |
| 7            | 13                  | Cord/diagonal and double area; terminology including _rajju_                |
| 9            | 15                  | Āpastamba: ground dimensions and the one-cord rule                          |
| 10           | 16                  | Holding fifteen, staking twelve; direction discrepancy and 3–4–5            |
| 11           | 17                  | Alternative enlarged triples and the paired 8–15–17 / 12–35–37              |
| 12           | 18                  | Baudhāyana's numerical diagonal rule, at the bottom                         |
| 13           | 19                  | Translation, nested fractions, beginning of the editor's conjecture         |
| 14           | 20                  | The 17-by-17 square and overlapping strips                                  |
| 15           | 21                  | Remainder and integer calculation; further editorial hypotheses             |
| 26           | 32                  | Baudhāyana's square-to-circle rule and Āpastamba's alternative wording      |
| 27           | 33                  | Area discrepancy; detailed circle-to-square rule and fraction expansion     |
| 28           | 34                  | Numerical link and alternative 13/15 circle-to-square rule                  |

The images retain the complete printed page and its margins. They were rendered
with Poppler `pdftoppm`, long edge 2000 px, JPEG quality 82. Exact PDF, renderer
and file identities are in [docs/source-identities.json](docs/source-identities.json).
[scripts/source-review.py](scripts/source-review.py) re-renders the identified PDF
and checks the page and bundled-file bytes. A different Poppler/JPEG encoder
may produce different bytes; inspect the pages before changing the manifest.

## What has been normalized

The Devanagari excerpts are independently transcribed from the above print, with
modern Unicode, normalized spacing and punctuation. The IAST resolves word
boundaries for reading; it is not a diplomatic facsimile or reconstructed
pronunciation. Short glossary forms can differ in their endings from the
continuous sandhied sentence. The original print remains available beside them.
References identify the printed page and rule rather than conflating the differing
section numbering of later editions.

The English translations are new. Brackets expose supplied geometrical references
in compressed instructions. Thibaut's explicit fraction expansions determine the
numeric interpretation. His proposed discovery histories, his judgments of ancient
people and his interpretation of _saviśeṣa_ are not treated as established facts.
The exact numerical error here does not prove what that word meant historically.

Two printed arithmetic slips deserve separate attention:
- On p. 28 the half-side appears as **412**, although the construction uses
  **408** and its next tripled value is **1224**. The app calls this out in
  the page note and uses p. 27's explicit fraction expansion for the return.
- On p. 15 the first displayed remainder's denominator appears as **34 + 34**
  in this copy. The overlap on p. 14 and p. 15's subsequent calculation
  `577 × 577 = 332929`, against `2 × 408 × 408 = 332928`, give the square
  denominator. The model derives its remainder from the exact rule; it does
  not reproduce a printed plus as a mathematical multiplication.

No chronology of invention, comparative priority claim, route of transmission,
or reconstruction of a particular ancient altar is asserted.

## Local fonts

All fonts use the SIL Open Font License 1.1. The actual license and copyright
texts accompany the files and are embedded in each saved reading.

| Font                                                       | Origin                                                                                   | Local license                                                           |
| ---------------------------------------------------------- | ---------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| Newsreader, variable TTF                                   | [Google Fonts source](https://github.com/google/fonts/tree/main/ofl/newsreader)          | [newsreader-OFL.txt](public/fonts/newsreader-OFL.txt)                   |
| Noto Serif Devanagari, variable TTF                        | [Google Fonts source](https://github.com/google/fonts/tree/main/ofl/notoserifdevanagari) | [notoserifdevanagari-OFL.txt](public/fonts/notoserifdevanagari-OFL.txt) |
| IBM Plex Sans, retained regular and semibold WOFF2 subsets | [IBM Plex](https://github.com/IBM/plex), reused from the Pnigeus showcase's local files  | [IBMPlex-OFL.txt](public/fonts/IBMPlex-OFL.txt)                         |

Font and source file SHA-256 values identify the exact local snapshots. No remote
font service, personal data, telemetry or runtime translation service is used.
