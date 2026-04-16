// Pure conflict detection for sessions and enrollments.

export type TimeRange = { startAt: Date; endAt: Date };

export function rangesOverlap(a: TimeRange, b: TimeRange): boolean {
  return a.startAt < b.endAt && b.startAt < a.endAt;
}

/**
 * Detect whether a student has a time conflict with an existing enrollment.
 * Pass in the candidate session range and the student's existing sessions.
 */
export function hasStudentTimeConflict(
  candidate: TimeRange,
  existing: TimeRange[],
): boolean {
  return existing.some((e) => rangesOverlap(candidate, e));
}

/**
 * Detect whether a room is already booked at the candidate time.
 */
export function hasRoomConflict(
  candidate: TimeRange & { roomId: string },
  existing: Array<TimeRange & { roomId: string }>,
): boolean {
  return existing.some(
    (e) => e.roomId === candidate.roomId && rangesOverlap(candidate, e),
  );
}

/**
 * Detect whether a teacher is already assigned at the candidate time.
 */
export function hasTeacherConflict(
  candidate: TimeRange & { teacherId: string },
  existing: Array<TimeRange & { teacherId: string }>,
): boolean {
  return existing.some(
    (e) => e.teacherId === candidate.teacherId && rangesOverlap(candidate, e),
  );
}
