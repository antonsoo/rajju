export const CIRCLE_STEPS = [
  {
    title: "Take half the diagonal",
    text: "Fix a cord at the centre of the square and stretch it to a corner. This is longer than half a side.",
    word: "cord",
  },
  {
    title: "Swing the cord east",
    text: "Keep the centre fixed. Turn the cord toward the east side. Its end now projects beyond the square.",
    word: "east",
  },
  {
    title: "Keep a third of the excess",
    text: "Divide only the projecting piece into three. Add one of those thirds to the half-side inside the square. This is the radius.",
    word: "third",
  },
  {
    title: "Draw, then compare",
    text: "The circle cuts away four corners and adds four bulges outside the sides. The two sets of areas look close. Are they equal?",
    word: "circle",
  },
] as const;

export const DIAGONAL_STEPS = [
  {
    title: "Start with the side",
    expression: "1",
    text: "A square on this cord has only the original area. The geometric diagonal must produce twice that area.",
  },
  {
    title: "Increase by its third",
    expression: "1 + 1/3",
    text: "Add one third of the original side. The square on the longer cord is still too small.",
  },
  {
    title: "Add a fourth of that third",
    expression: "1 + 1/3 + 1/12",
    text: "The added fourth belongs to the third, not to the whole side. The square is now slightly too large.",
  },
  {
    title: "Remove a thirty-fourth of the fourth",
    expression: "1 + 1/3 + 1/12 − 1/408",
    text: "Subtract one thirty-fourth of the last addition. The length is 577/408 of the side. Its square exceeds twice the original by exactly 1/166464 of the original area.",
  },
] as const;

export interface Word {
  id: string;
  devanagari: string;
  iast: string;
  meaning: string;
  note: string;
  highlight: string;
}

export const WORDS: Word[] = [
  {
    id: "square",
    devanagari: "चतुरस्रम्",
    iast: "caturasram",
    meaning: "a square",
    note: "Literally a four-cornered figure; here the context calls for a square. The ending marks the thing being made or transformed.",
    highlight: "square",
  },
  {
    id: "circle",
    devanagari: "मण्डलम्",
    iast: "maṇḍalam",
    meaning: "a circle",
    note: "A circular figure. Read it as the target shape in the first instruction and as the starting shape in the return instruction.",
    highlight: "circle",
  },
  {
    id: "wish",
    devanagari: "चिकीर्षन्",
    iast: "cikīrṣan",
    meaning: "wishing to make",
    note: "A participle from the desiderative of kṛ, ‘make’. It introduces the person who wants to carry out the transformation.",
    highlight: "square",
  },
  {
    id: "centre",
    devanagari: "मध्यात्",
    iast: "madhyāt",
    meaning: "from the centre",
    note: "The ablative ending -āt gives the starting point. The cord stays fixed here while its other end moves.",
    highlight: "cord",
  },
  {
    id: "east",
    devanagari: "प्राचीम्",
    iast: "prācīm",
    meaning: "toward the east [line]",
    note: "The eastward line is the direction of the swing. East is drawn to the right in this modern plan.",
    highlight: "east",
  },
  {
    id: "third",
    devanagari: "तृतीयेन",
    iast: "tṛtīyena",
    meaning: "with a third",
    note: "The instrumental ending -ena expresses the added amount. It is a third of the excess outside the square, not a third of the whole cord.",
    highlight: "excess",
  },
  {
    id: "draw",
    devanagari: "परिलिखेत्",
    iast: "parilikhet",
    meaning: "one should draw around",
    note: "An optative instruction, from pari + likh. A radius is fixed before the circle is traced.",
    highlight: "circle",
  },
  {
    id: "measure",
    devanagari: "प्रमाणम्",
    iast: "pramāṇam",
    meaning: "the measure",
    note: "In the diagonal rule, the starting measure is the square’s side. The nested fractions refer back to this measure and then to its added parts.",
    highlight: "square",
  },
  {
    id: "increase",
    devanagari: "वर्धयेत्",
    iast: "vardhayet",
    meaning: "one should increase",
    note: "A causative optative from vṛdh, ‘grow’. The instruction tells the reader to lengthen the measure.",
    highlight: "cord",
  },
  {
    id: "fourth",
    devanagari: "चतुर्थेन",
    iast: "caturthena",
    meaning: "with a fourth",
    note: "Here the fourth is a fourth of the preceding third: 1/(3 × 4) of the original measure.",
    highlight: "excess",
  },
  {
    id: "remainder",
    devanagari: "सविशेषः",
    iast: "saviśeṣaḥ",
    meaning: "with a remainder / excess",
    note: "Thibaut treats this as a name for the increased measure. The word has received different interpretations; it alone does not establish a proof of irrationality or a modern error analysis.",
    highlight: "excess",
  },
];

export const PASSAGES = {
  circle: {
    title: "From square to circle",
    page: 26,
    reference: "Baudhāyana, circle rule · Thibaut p. 26",
    devanagari:
      "चतुरस्रं मण्डलं चिकीर्षन्नक्ष्णयार्धं मध्यात्प्राचीमभ्यापातयेत् । यदतिशिष्यते तस्य सह तृतीयेन मण्डलं परिलिखेत् ।",
    iast: "caturasraṃ maṇḍalaṃ cikīrṣann akṣṇayārdhaṃ madhyāt prācīm abhyāpātayet. yad atiśiṣyate tasya saha tṛtīyena maṇḍalaṃ parilikhet.",
    english:
      "Wishing to make a square into a circle, lay out half the diagonal from the centre toward the east. Draw the circle with a third of what projects beyond [added to the part inside].",
    note: "The bracketed words make the geometrical reading explicit. They are supplied in this new English translation, not additional Sanskrit. The circle is intended as an area transformation; the modern calculation below finds a mismatch.",
    words: ["square", "circle", "wish", "centre", "east", "third", "draw"],
  },
  return: {
    title: "From circle to square",
    page: 27,
    reference: "Baudhāyana, detailed return rule · Thibaut pp. 27–28",
    devanagari:
      "मण्डलं चतुरस्रं चिकीर्षन् विष्कम्भमष्टौ भागान्कृत्वा भागमेकोनत्रिंशद्धा विभज्याष्टाविंशतिभागानुद्धरेत् । भागस्य च षष्ठमष्टमभागोनम् ।",
    iast: "maṇḍalaṃ caturasraṃ cikīrṣan viṣkambham aṣṭau bhāgān kṛtvā bhāgam ekonatriṃśaddhā vibhajyāṣṭāviṃśatibhāgān uddharet. bhāgasya ca ṣaṣṭham aṣṭamabhāgonam.",
    english:
      "Wishing to make a circle into a square, divide the diameter into eight parts, then one part into twenty-nine. Remove twenty-eight of those parts, and also a sixth of the remaining part, diminished by its eighth.",
    note: "The retained side is (7/8 + 1/232 − 1/1392 + 1/11136) times the diameter. This follows Thibaut’s explicit fraction expansion. His pp. 27–28 discuss the connection to the outward transformation; a close return is not an exact equality of areas.",
    words: ["circle", "square", "wish"],
  },
  simple: {
    title: "A shorter return rule",
    page: 28,
    reference: "Baudhāyana, alternative return rule · Thibaut p. 28",
    devanagari: "अपि वा पञ्चदश भागान्कृत्वा द्वावुद्धरेत्सैषानित्या चतुरस्रकरणी ।",
    iast: "api vā pañcadaśa bhāgān kṛtvā dvāv uddharet. saiṣānityā caturasrakaraṇī.",
    english:
      "Or, having divided [the diameter] into fifteen parts, remove two. This gives an inexact square-making measure.",
    note: "Thibaut renders the resulting side as ‘gross’. The reading anityā is retained here, following the printed Baudhāyana passage; the neighboring authors’ formulations and interpretations differ. The numerical instruction is unambiguous: retain 13/15 of the diameter.",
    words: ["circle", "square"],
  },
  diagonal: {
    title: "The numerical diagonal",
    page: 12,
    reference: "Baudhāyana, diagonal rule · Thibaut pp. 12–13",
    devanagari: "प्रमाणं तृतीयेन वर्धयेत्तच्चतुर्थेनात्मचतुस्त्रिंशोनेन । सविशेषः ।",
    iast: "pramāṇaṃ tṛtīyena vardhayet tac caturthenātmacatustriṃśonena. saviśeṣaḥ.",
    english:
      "Increase the measure by its third, and that [third] by its fourth, diminished by its own thirty-fourth. [The result is] saviśeṣa.",
    note: "The English supplies the nested references in brackets. Thibaut explains the diagonal interpretation on p. 13. The sūtra gives the rule, not the conjectural derivation he proposes afterward. Our exact fraction calculation does not depend on that conjecture.",
    words: ["measure", "third", "increase", "fourth", "remainder"],
  },
} as const;

export const SOURCE_NOTES: Record<number, string> = {
  6: "The editor’s account of area transformations and their ritual setting. His claims about ancient motivations remain interpretation.",
  7: "The square’s diagonal as a cord that produces double the area; Sanskrit and Thibaut’s translation.",
  12: "The numerical diagonal rule appears at the bottom of the page. The historical speculation above it is Thibaut’s.",
  13: "English explanation and fraction expansion for the diagonal; beginning of Thibaut’s proposed derivation.",
  14: "Continuation of the proposed derivation: 17² = 289 lies one square above 2 × 12² = 288.",
  15: "Overlapping cut strips and their small corner; further historical conjectures are the editor’s, not statements of the sūtra.",
  26: "Square-to-circle rule attributed to Baudhāyana, followed by Āpastamba’s version and discussion.",
  27: "The area mismatch, the detailed return rule and its explicit fraction expansion.",
  28: "The editor’s numerical link and the simpler 13/15 return rule. The prose prints 412 for the half-side, although the neighboring values use 408 and then 1224 = 3 × 408. The model follows the explicit fraction expansion on p. 27.",
};

export const SOURCE_URL = "https://archive.org/details/ulvastras00ktgoog";

export const LIMITATIONS =
  "These are modern mathematical drawings of rules transmitted under Baudhāyana’s name, not a surveyed altar or a reconstruction of an ancient building technique. Millimetres are a chosen modern scale. Sanskrit spelling, spacing and punctuation are normalized from the 1875 print; transliteration is not a pronunciation reconstruction. The source’s compressed instructions, later commentaries and Thibaut’s historical conjectures have different evidential status. No date of invention, priority claim, or route of transmission is established here.";
