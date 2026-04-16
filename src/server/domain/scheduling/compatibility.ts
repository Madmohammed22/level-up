// Pure functions for level compatibility logic (mutualization).
// No DB, no side effects. Takes data in, returns decisions.

import type { Level } from "@/generated/prisma/enums";

export type CompatibilityRow = {
  subjectId: string;
  levelA: Level;
  levelB: Level;
  compatible: boolean;
};

/**
 * Returns true if two levels can share the same session for the given subject,
 * according to the admin-configured compatibility matrix.
 * Compatibility is symmetric: (A,B) == (B,A). Same level is always compatible.
 */
export function areLevelsCompatible(
  matrix: CompatibilityRow[],
  subjectId: string,
  a: Level,
  b: Level,
): boolean {
  if (a === b) return true;
  return matrix.some(
    (row) =>
      row.subjectId === subjectId &&
      row.compatible &&
      ((row.levelA === a && row.levelB === b) ||
        (row.levelA === b && row.levelB === a)),
  );
}

/**
 * Returns true if ALL pairs in a set of levels are pairwise compatible.
 * A "level group" (e.g. [GRADE_10, GRADE_11]) can only be merged into one
 * session if every pair in the group is compatible.
 */
export function isLevelGroupCompatible(
  matrix: CompatibilityRow[],
  subjectId: string,
  levels: Level[],
): boolean {
  for (let i = 0; i < levels.length; i++) {
    for (let j = i + 1; j < levels.length; j++) {
      if (!areLevelsCompatible(matrix, subjectId, levels[i], levels[j])) {
        return false;
      }
    }
  }
  return true;
}
