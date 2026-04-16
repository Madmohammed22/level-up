// Daily mood averages for the last N days. Pure functions.

export type MoodPoint = {
  createdAt: Date;
  score: number; // 1..5
};

export type MoodDay = {
  date: string; // ISO YYYY-MM-DD
  average: number; // 0 if no check-ins
  count: number;
};

/**
 * Returns one entry per day for the last `days` days (inclusive of today),
 * oldest first. Days with no check-ins have average=0, count=0.
 */
export function dailyMoodAverages(
  checkIns: MoodPoint[],
  days: number,
  today: Date = new Date(),
): MoodDay[] {
  const out: MoodDay[] = [];
  const sums = new Map<string, { sum: number; count: number }>();

  for (const m of checkIns) {
    const key = toIsoDate(m.createdAt);
    const cur = sums.get(key) ?? { sum: 0, count: 0 };
    cur.sum += m.score;
    cur.count += 1;
    sums.set(key, cur);
  }

  const cursor = new Date(today);
  cursor.setHours(0, 0, 0, 0);
  cursor.setDate(cursor.getDate() - (days - 1));

  for (let i = 0; i < days; i++) {
    const key = toIsoDate(cursor);
    const bucket = sums.get(key);
    out.push({
      date: key,
      average: bucket ? bucket.sum / bucket.count : 0,
      count: bucket?.count ?? 0,
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
