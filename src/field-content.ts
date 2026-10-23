export const FIELD_READINGS = [
  {
    devanagari: "त्रिंशत्पदानि प्रक्रमावा",
    iast: "triṃśat padāni prakramā vā",
    english: "Thirty padas or prakramas.",
    note: "The western cross-line. The source names alternative measures; the experiment uses one consistent unit and makes no conversion to metres.",
  },
  {
    devanagari: "षट्त्रिंशत्प्राची",
    iast: "ṣaṭtriṃśat prācī",
    english: "The eastward line [is] thirty-six.",
    note: "Prācī names the eastward centre line. Its orientation is a prerequisite in the text. This experiment starts with that line already established.",
  },
  {
    devanagari: "चतुर्विंशतिः पुरस्तात्तिरश्ची",
    iast: "caturviṃśatiḥ purastāt tiraścī",
    english: "The eastern cross-line [is] twenty-four.",
    note: "Twenty-four is the full cross-line. The distance from the centre line to either eastern corner is twelve, not twenty-four.",
  },
  {
    devanagari: "द्वादशसु लक्षणं पञ्चदशसु लक्षणं",
    iast: "dvādaśasu lakṣaṇaṃ pañcadaśasu lakṣaṇaṃ",
    english: "A mark at twelve; a mark at fifteen.",
    note: "The locative endings indicate positions along the cord. Lakṣaṇa is a mark. In the eastern one-cord operation, hold at fifteen but use the twelve mark for the actual corner.",
  },
] as const;

export const FIELD_SOURCE_NOTES: Record<number, string> = {
  9: "Baudhāyana’s whole-number examples, followed by Āpastamba’s ground dimensions and the 54-unit cord with marks at 12 and 15. The short Sanskrit readings are excerpts of this page.",
  10: "Continue the one-cord procedure: reverse the ends, hold at 15, stake at 12. The English prints southwest and southeast for the first pair; the described north/south operation at the western end gives northwest and southwest in the modern plan. The 3–4–5 method starts below.",
  11: "Continuation of the enlarged 3–4–5 method, then 5–12–13 and the paired 8–15–17 / 12–35–37 constructions. The modern plan derives each auxiliary peg from the stated distance inward along the centre line.",
  12: "Closing explanation of known whole-number measurements, then the beginning of a different numerical-diagonal discussion. The editor’s proposed discovery history is not required by the geometric model.",
};

export const FIELD_LIMITS =
  "This is a modern plan of Āpastamba’s layout rules as excerpted and explained by Thibaut in 1875. It is not a survey of a surviving ground or a reconstruction of a complete ritual. The centre line is assumed to be oriented already. Cords are ideal, inextensible and taut; the pegs are points on a flat plane. Soil, knot thickness, cord stretch, measurement tolerances and the ritual’s other requirements are outside the model. The elliptical locus is a modern mathematical comparison, not a claim about an ancient derivation.";
