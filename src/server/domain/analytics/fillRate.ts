// Fill-rate and enrollment analytics — pure functions.

export type SessionStat = {
  sessionId: string;
  maxCapacity: number;
  enrolled: number;
  subjectId: string;
  levels: string[]; // serialized Level enum
};

/** Global fill rate: sum(enrolled) / sum(capacity). */
export function globalFillRate(sessions: SessionStat[]): number {
  const total = sessions.reduce((a, s) => a + s.maxCapacity, 0);
  const filled = sessions.reduce((a, s) => a + s.enrolled, 0);
  return total > 0 ? filled / total : 0;
}

/** Fill rate per subject. */
export function fillRateBySubject(
  sessions: SessionStat[],
): Array<{ subjectId: string; fillRate: number; total: number; filled: number }> {
  const bySubject = new Map<string, { total: number; filled: number }>();
  for (const s of sessions) {
    const cur = bySubject.get(s.subjectId) ?? { total: 0, filled: 0 };
    cur.total += s.maxCapacity;
    cur.filled += s.enrolled;
    bySubject.set(s.subjectId, cur);
  }
  return Array.from(bySubject.entries()).map(([subjectId, v]) => ({
    subjectId,
    total: v.total,
    filled: v.filled,
    fillRate: v.total > 0 ? v.filled / v.total : 0,
  }));
}

/** Count of students per level across all sessions. */
export function enrollmentByLevel(
  sessions: Array<SessionStat & { perLevel?: Record<string, number> }>,
): Record<string, number> {
  const out: Record<string, number> = {};
  for (const s of sessions) {
    const perLevel = s.perLevel ?? {};
    for (const [lvl, n] of Object.entries(perLevel)) {
      out[lvl] = (out[lvl] ?? 0) + n;
    }
  }
  return out;
}
