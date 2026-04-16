// Single entry point that fetches everything the admin dashboard needs,
// in parallel, and returns already-shaped, serializable data for the page.

import { prisma } from "@/server/db/prisma";
import {
  globalFillRate,
  fillRateBySubject,
  type SessionStat,
} from "@/server/domain/analytics/fillRate";
import {
  groupSessionsByWeek,
  type WeekBucket,
} from "@/server/domain/analytics/sessionsOverTime";
import {
  dailyMoodAverages,
  type MoodDay,
} from "@/server/domain/analytics/moodTrends";
import {
  enrollmentMatrix,
  type MatrixCell,
} from "@/server/domain/analytics/levelSubjectMatrix";

export type AdminDashboardData = {
  kpis: {
    students: number;
    teachers: number;
    sessionsThisWeek: number;
    fillRatePct: number; // 0..100
  };
  fillRateBySubject: Array<{ subject: string; fillRate: number }>;
  sessionsPerWeek: Array<WeekBucket & { label: string }>;
  moodLast14Days: MoodDay[];
  levelSubjectMatrix: {
    subjects: Array<{ id: string; name: string }>;
    levels: string[];
    cells: MatrixCell[];
    max: number;
  };
};

export async function loadAdminDashboardData(): Promise<AdminDashboardData> {
  const now = new Date();
  const startOfWeek = mondayOf(now);
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(endOfWeek.getDate() + 7);

  const [
    studentCount,
    teacherCount,
    sessionsThisWeek,
    allSessions,
    subjects,
    enrollments,
    moodCheckIns,
  ] = await Promise.all([
    prisma.studentProfile.count(),
    prisma.teacherProfile.count(),
    prisma.session.count({
      where: {
        startAt: { gte: startOfWeek, lt: endOfWeek },
        status: { not: "CANCELLED" },
      },
    }),
    prisma.session.findMany({
      where: { status: { not: "CANCELLED" } },
      select: {
        id: true,
        startAt: true,
        status: true,
        maxCapacity: true,
        subjectId: true,
        levels: true,
        _count: { select: { enrollments: true } },
      },
    }),
    prisma.subject.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.enrollment.findMany({
      where: { status: "CONFIRMED" },
      select: {
        session: { select: { subjectId: true } },
        student: { select: { level: true } },
      },
    }),
    prisma.moodCheckIn.findMany({
      where: {
        createdAt: { gte: daysAgo(now, 14) },
      },
      select: { createdAt: true, score: true },
    }),
  ]);

  // ---- fill rate ----
  const sessionStats: SessionStat[] = allSessions.map((s) => ({
    sessionId: s.id,
    maxCapacity: s.maxCapacity,
    enrolled: s._count.enrollments,
    subjectId: s.subjectId,
    levels: s.levels,
  }));
  const fillRatePct = Math.round(globalFillRate(sessionStats) * 100);
  const subjectNameById = new Map(subjects.map((s) => [s.id, s.name]));
  const perSubject = fillRateBySubject(sessionStats).map((row) => ({
    subject: subjectNameById.get(row.subjectId) ?? row.subjectId,
    fillRate: Math.round(row.fillRate * 100),
  }));

  // ---- sessions per week ----
  const buckets = groupSessionsByWeek(
    allSessions.map((s) => ({ startAt: s.startAt, status: s.status })),
  );
  const sessionsPerWeek = buckets.map((b) => ({
    ...b,
    label: shortWeekLabel(b.weekStart),
  }));

  // ---- mood last 14 days ----
  const moodLast14Days = dailyMoodAverages(moodCheckIns, 14, now);

  // ---- level × subject matrix ----
  const LEVELS = ["GRADE_9", "GRADE_10", "GRADE_11", "GRADE_12"];
  const matrixRecords = enrollments.map((e) => ({
    subjectId: e.session.subjectId,
    level: e.student.level,
  }));
  const cells = enrollmentMatrix(
    matrixRecords,
    subjects.map((s) => s.id),
    LEVELS,
  );
  const max = cells.reduce((m, c) => (c.count > m ? c.count : m), 0);

  return {
    kpis: {
      students: studentCount,
      teachers: teacherCount,
      sessionsThisWeek,
      fillRatePct,
    },
    fillRateBySubject: perSubject,
    sessionsPerWeek,
    moodLast14Days,
    levelSubjectMatrix: {
      subjects,
      levels: LEVELS,
      cells,
      max,
    },
  };
}

// ---------- small helpers ----------

function mondayOf(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const dow = d.getDay(); // 0 Sun..6 Sat
  const diff = dow === 0 ? -6 : 1 - dow;
  d.setDate(d.getDate() + diff);
  return d;
}

function daysAgo(ref: Date, n: number): Date {
  const d = new Date(ref);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - (n - 1));
  return d;
}

function shortWeekLabel(isoDate: string): string {
  const [, m, d] = isoDate.split("-");
  return `${d}/${m}`;
}
