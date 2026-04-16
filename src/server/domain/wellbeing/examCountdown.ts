export const MS_PER_DAY = 1000 * 60 * 60 * 24;

/**
 * Days until `date`, counting from the start of `from`'s local day.
 * Returns 0 if the exam is today, negative if past.
 */
export function daysUntil(date: Date, from: Date = new Date()): number {
  const a = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
  ).getTime();
  const b = new Date(
    from.getFullYear(),
    from.getMonth(),
    from.getDate(),
  ).getTime();
  return Math.round((a - b) / MS_PER_DAY);
}

/**
 * French-readable relative day phrase, e.g.:
 *  - "aujourd'hui"
 *  - "demain"
 *  - "dans 5 jours"
 *  - "il y a 2 jours"
 */
export function humanDaysUntil(days: number): string {
  if (days === 0) return "aujourd'hui";
  if (days === 1) return "demain";
  if (days === -1) return "hier";
  if (days > 0) return `dans ${days} jours`;
  return `il y a ${Math.abs(days)} jours`;
}

/**
 * Choose a visual urgency bucket for an exam based on days remaining.
 *   - "imminent"  : 0 to 3 days
 *   - "soon"      : 4 to 14 days
 *   - "upcoming"  : 15+ days
 *   - "past"      : < 0
 */
export type ExamUrgency = "past" | "imminent" | "soon" | "upcoming";

export function examUrgency(days: number): ExamUrgency {
  if (days < 0) return "past";
  if (days <= 3) return "imminent";
  if (days <= 14) return "soon";
  return "upcoming";
}
