// Daily attendance rate for the last N days. Pure function.

export type AttendancePoint = {
  sessionDate: Date;
  attendance: string; // PRESENT, ABSENT, LATE, PENDING
};

export type AttendanceDay = {
  date: string; // ISO YYYY-MM-DD
  rate: number; // 0..100 percentage, 0 if no data
  present: number;
  total: number;
};

/**
 * Returns one entry per day for the last `days` days (inclusive of today),
 * oldest first. Days with no enrollments have rate=0, total=0.
 */
export function dailyAttendanceRates(
  enrollments: AttendancePoint[],
  days: number,
  today: Date = new Date(),
): AttendanceDay[] {
  const out: AttendanceDay[] = [];
  const buckets = new Map<string, { present: number; total: number }>();

  for (const e of enrollments) {
    if (e.attendance === "PENDING") continue;
    const key = toIsoDate(e.sessionDate);
    const cur = buckets.get(key) ?? { present: 0, total: 0 };
    cur.total += 1;
    if (e.attendance === "PRESENT" || e.attendance === "LATE") {
      cur.present += 1;
    }
    buckets.set(key, cur);
  }

  const cursor = new Date(today);
  cursor.setHours(0, 0, 0, 0);
  cursor.setDate(cursor.getDate() - (days - 1));

  for (let i = 0; i < days; i++) {
    const key = toIsoDate(cursor);
    const bucket = buckets.get(key);
    out.push({
      date: key,
      rate: bucket && bucket.total > 0
        ? Math.round((bucket.present / bucket.total) * 100)
        : 0,
      present: bucket?.present ?? 0,
      total: bucket?.total ?? 0,
    });
    cursor.setDate(cursor.getDate() + 1);
  }
  return out;
}

function toIsoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
