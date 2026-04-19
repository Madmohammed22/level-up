/** Map GRADE_X enum values to French/Moroccan display labels. */
const LEVEL_LABELS: Record<string, string> = {
  GRADE_7: "1AC",
  GRADE_8: "2AC",
  GRADE_9: "3ème",
  GRADE_10: "2nde",
  GRADE_11: "1ère",
  GRADE_12: "Terminale",
};

/** Convert a single GRADE_X code to its French label (fallback: raw code). */
export function levelLabel(code: string): string {
  return LEVEL_LABELS[code] ?? code;
}

/** Convert an array of GRADE_X codes to a joined French label string. */
export function levelsLabel(codes: string[], separator = " + "): string {
  return codes.map(levelLabel).join(separator);
}
