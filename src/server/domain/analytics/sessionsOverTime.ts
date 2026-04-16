// Group sessions by ISO week (Mon–Sun) for the sessions-per-week chart.
// Pure functions — no Prisma, no Next.js.

import { mondayOf } from "@/server/domain/scheduling/weekDates";

export type SessionForTimeline = {
  startAt: Date;
  status: "DRAFT" | "CONFIRMED" | "CANCELLED";
};

export type WeekBucket = {
  weekStart: string; // ISO date (YYYY-MM-DD) of the Monday
  total: number;
  confirmed: number;
  cancelled: number;
};

/**
 * Bucket sessions by Monday of their week.
 * Returns chronologically sorted buckets, one per week that has sessions.
 * Empty weeks inside the range are filled in with zeros so the chart is continuous.
 */
export function groupSessionsByWeek(
  sessions: SessionForTimeline[],
): WeekBucket[] {
  if (sessions.length === 0) return [];

  const map = new Map<string, WeekBucket>();
  let minWeek: Date | null = null;
  let maxWeek: Date | null = null;

  for (const s of sessions) {
    const monday = mondayOf(s.startAt);
    const key = toIsoDate(monday);
    if (!minWeek || monday < minWeek) minWeek = monday;
    if (!maxWeek || monday > maxWeek) maxWeek = monday;

    const bucket = map.get(key) ?? {
      weekStart: key,
      total: 0,
      confirmed: 0,
      cancelled: 0,
    };
    bucket.total += 1;
    if (s.status === "CONFIRMED") bucket.confirmed += 1;
    if (s.status === "CANCELLED") bucket.cancelled += 1;
    map.set(key, bucket);
  }

  // Fill gaps so the chart line is continuous.
  const result: WeekBucket[] = [];
  const cursor = new Date(minWeek!);
  while (cursor <= maxWeek!) {
    const key = toIsoDate(cursor);
    result.push(
      map.get(key) ?? {
        weekStart: key,
        total: 0,
        confirmed: 0,
        cancelled: 0,
      },
    );
    cursor.setDate(cursor.getDate() + 7);
  }
  return result;
}

function toIsoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
