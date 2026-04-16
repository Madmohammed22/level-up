// Enrollment counts per (level × subject) cell — drives the heatmap.
// Pure functions.

export type EnrollmentRecord = {
  subjectId: string;
  level: string; // Level enum serialized
};

export type MatrixCell = {
  subjectId: string;
  level: string;
  count: number;
};

export function enrollmentMatrix(
  records: EnrollmentRecord[],
  subjectIds: string[],
  levels: string[],
): MatrixCell[] {
  const counts = new Map<string, number>();
  for (const r of records) {
    const key = `${r.subjectId}|${r.level}`;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  const out: MatrixCell[] = [];
  for (const subjectId of subjectIds) {
    for (const level of levels) {
      out.push({
        subjectId,
        level,
        count: counts.get(`${subjectId}|${level}`) ?? 0,
      });
    }
  }
  return out;
}
