// Helpers to turn a (week start, TimeSlot) pair into concrete start/end Dates.
//
// Convention: week starts on MONDAY. `weekStart` must be a Date at 00:00 local
// whose day of week is Monday. Callers should pass one in via `mondayOf(date)`.

import type { DayOfWeek } from "@/generated/prisma/enums";

const DAY_OFFSET: Record<DayOfWeek, number> = {
  MONDAY: 0,
  TUESDAY: 1,
  WEDNESDAY: 2,
  THURSDAY: 3,
  FRIDAY: 4,
  SATURDAY: 5,
  SUNDAY: 6,
};

/** Return the Monday of the week containing `date` at 00:00 local time. */
export function mondayOf(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const dow = d.getDay(); // 0=Sun..6=Sat
  const diff = dow === 0 ? -6 : 1 - dow; // shift to Monday
  d.setDate(d.getDate() + diff);
  return d;
}

/** Parse "HH:MM" into [hours, minutes]. Throws on malformed input. */
function parseHHMM(s: string): [number, number] {
  const m = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(s);
  if (!m) throw new Error(`Invalid time: ${s}`);
  return [Number(m[1]), Number(m[2])];
}

export type TimeSlotLike = {
  dayOfWeek: DayOfWeek;
  startTime: string; // "HH:MM"
  endTime: string;
};

/**
 * Concrete (date, startAt, endAt) for a given TimeSlot on the week starting
 * at `weekStart` (which must be a Monday at 00:00 local).
 */
export function timeSlotToDates(
  weekStart: Date,
  slot: TimeSlotLike,
): { date: Date; startAt: Date; endAt: Date } {
  const offset = DAY_OFFSET[slot.dayOfWeek];
  const day = new Date(weekStart);
  day.setDate(day.getDate() + offset);
  day.setHours(0, 0, 0, 0);

  const [sh, sm] = parseHHMM(slot.startTime);
  const [eh, em] = parseHHMM(slot.endTime);

  const startAt = new Date(day);
  startAt.setHours(sh, sm, 0, 0);
  const endAt = new Date(day);
  endAt.setHours(eh, em, 0, 0);

  return { date: day, startAt, endAt };
}
