import Link from "next/link";
import { requireRole } from "@/server/auth/requireRole";
import { prisma } from "@/server/db/prisma";
import { KpiCard } from "@/components/admin/analytics/KpiCard";

function fmtDate(d: Date): string {
  const days = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];
  return `${days[d.getDay()]} ${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function fmtTime(d: Date): string {
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export default async function TeacherHomePage() {
  const user = await requireRole("TEACHER");

  const profile = await prisma.teacherProfile.findUnique({
    where: { userId: user.id },
    select: { id: true, subjects: { select: { id: true, name: true } } },
  });

  const now = new Date();

  // Next 5 upcoming sessions
  const upcomingSessions = profile
    ? await prisma.session.findMany({
        where: {
          teacherId: profile.id,
          status: { not: "CANCELLED" },
          startAt: { gte: now },
        },
        orderBy: { startAt: "asc" },
        take: 5,
        include: {
          subject: { select: { name: true } },
          room: { select: { name: true } },
          enrollments: {
            where: { status: "CONFIRMED" },
            select: { attendance: true },
          },
        },
      })
    : [];

  // All enrollments for this teacher (for stats)
  const allEnrollments = profile
    ? await prisma.enrollment.findMany({
        where: {
          status: "CONFIRMED",
          session: { teacherId: profile.id, status: { not: "CANCELLED" } },
        },
        select: {
          studentId: true,
          attendance: true,
          session: { select: { subjectId: true, startAt: true } },
        },
      })
    : [];

  // --- Basic stats ---
  const totalSessions = profile
    ? await prisma.session.count({
        where: { teacherId: profile.id, status: { not: "CANCELLED" } },
      })
    : 0;

  const uniqueStudentIds = new Set(allEnrollments.map((e) => e.studentId));

  // --- Attendance stats ---
  const marked = allEnrollments.filter((e) => e.attendance !== "PENDING");
  const present = marked.filter(
    (e) => e.attendance === "PRESENT" || e.attendance === "LATE",
  ).length;
  const attendanceRate =
    marked.length > 0 ? Math.round((present / marked.length) * 100) : null;

  const pendingAttendance = allEnrollments.filter(
    (e) => e.attendance === "PENDING",
  ).length;

  // --- Students per subject ---
  const subjectStudents = new Map<string, Set<string>>();
  for (const e of allEnrollments) {
    const sid = e.session.subjectId;
    if (!subjectStudents.has(sid)) subjectStudents.set(sid, new Set());
    subjectStudents.get(sid)!.add(e.studentId);
  }
  const subjectNames = new Map(
    (profile?.subjects ?? []).map((s) => [s.id, s.name]),
  );

  // --- This week vs last week ---
  const mondayThisWeek = new Date(now);
  mondayThisWeek.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  mondayThisWeek.setHours(0, 0, 0, 0);
  const mondayLastWeek = new Date(mondayThisWeek);
  mondayLastWeek.setDate(mondayLastWeek.getDate() - 7);

  const thisWeekSessions = profile
    ? await prisma.session.count({
        where: {
          teacherId: profile.id,
          status: { not: "CANCELLED" },
          startAt: { gte: mondayThisWeek },
          endAt: { lt: new Date(mondayThisWeek.getTime() + 7 * 86400000) },
        },
      })
    : 0;
  const lastWeekSessions = profile
    ? await prisma.session.count({
        where: {
          teacherId: profile.id,
          status: { not: "CANCELLED" },
          startAt: { gte: mondayLastWeek, lt: mondayThisWeek },
        },
      })
    : 0;

  // --- Mood average on teacher's sessions ---
  const moodCheckIns = profile
    ? await prisma.moodCheckIn.findMany({
        where: {
          session: { teacherId: profile.id },
        },
        select: { score: true },
      })
    : [];
  const avgMood =
    moodCheckIns.length > 0
      ? (moodCheckIns.reduce((a, m) => a + m.score, 0) / moodCheckIns.length).toFixed(1)
      : null;

  // Unread messages
  const convo = profile
    ? await prisma.conversation.findUnique({
        where: { teacherId: profile.id },
        select: {
          _count: {
            select: {
              messages: {
                where: { readAt: null, senderId: { not: user.id } },
              },
            },
          },
        },
      })
    : null;
  const unread = convo?._count.messages ?? 0;

  const attendanceAccent =
    attendanceRate !== null
      ? attendanceRate >= 85
        ? "green"
        : attendanceRate >= 60
          ? "amber"
          : "red"
      : undefined;

  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">
          Bonjour {user.name ?? "Professeur"}
        </h1>
        <p className="text-sm text-zinc-500">Votre tableau de bord.</p>
      </header>

      {/* KPI row 1 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard
          title="Séances totales"
          value={totalSessions}
          hint="Hors annulées"
        />
        <KpiCard
          title="Élèves distincts"
          value={uniqueStudentIds.size}
          hint="Total encadré"
        />
        <Link href="/teacher/chat">
          <KpiCard
            title="Messages non lus"
            value={unread}
            accent={unread > 0 ? "red" : undefined}
            hint="Voir la messagerie"
          />
        </Link>
        <KpiCard
          title="Prochaine séance"
          value={
            upcomingSessions.length > 0
              ? fmtDate(upcomingSessions[0].startAt)
              : "—"
          }
        />
      </div>

      {/* KPI row 2 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard
          title="Taux de présence"
          value={attendanceRate !== null ? `${attendanceRate}%` : "—"}
          hint="Présent + retard"
          accent={attendanceAccent}
        />
        <KpiCard
          title="Présences à saisir"
          value={pendingAttendance}
          accent={pendingAttendance > 0 ? "red" : undefined}
          hint="En attente"
        />
        <KpiCard
          title="Cette semaine"
          value={`${thisWeekSessions} séance${thisWeekSessions !== 1 ? "s" : ""}`}
          hint={
            lastWeekSessions > 0
              ? `Sem. dernière : ${lastWeekSessions}`
              : undefined
          }
        />
        <KpiCard
          title="Humeur moyenne"
          value={avgMood ? `${avgMood}/5` : "—"}
          hint={
            moodCheckIns.length > 0
              ? `${moodCheckIns.length} check-in${moodCheckIns.length > 1 ? "s" : ""}`
              : undefined
          }
        />
      </div>

      {/* Detail cards — same grid as admin charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Students per subject */}
        {subjectStudents.size > 0 && (
          <ChartCard
            title="Élèves par matière"
            subtitle="Nombre d'élèves encadrés par discipline"
            action={{ href: "/teacher/students", label: "Voir tous" }}
          >
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {[...subjectStudents.entries()].map(([subjectId, studentSet]) => (
                <div
                  key={subjectId}
                  className="rounded-xl bg-zinc-50 dark:bg-zinc-900 p-3 text-center"
                >
                  <div className="text-sm font-medium">
                    {subjectNames.get(subjectId) ?? subjectId}
                  </div>
                  <div className="text-2xl font-semibold mt-1">
                    {studentSet.size}
                  </div>
                  <div className="text-xs text-zinc-500">
                    élève{studentSet.size > 1 ? "s" : ""}
                  </div>
                </div>
              ))}
            </div>
          </ChartCard>
        )}

        {/* Upcoming sessions */}
        <ChartCard
          title="Prochaines séances"
          subtitle="5 prochaines séances confirmées"
          action={{ href: "/teacher/schedule", label: "Voir tout" }}
        >
          {upcomingSessions.length === 0 ? (
            <p className="text-sm text-zinc-500">Aucune séance à venir.</p>
          ) : (
            <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {upcomingSessions.map((s) => {
                const pending = s.enrollments.filter(
                  (e) => e.attendance === "PENDING",
                ).length;
                return (
                  <li
                    key={s.id}
                    className="py-3 flex items-center justify-between gap-3"
                  >
                    <div>
                      <div className="font-medium text-sm">
                        {s.subject.name}
                        <span className="ml-2 text-xs text-zinc-500 font-normal">
                          {s.room.name}
                        </span>
                      </div>
                      <div className="text-xs text-zinc-500">
                        {fmtDate(s.startAt)} · {fmtTime(s.startAt)}–
                        {fmtTime(s.endAt)} · {s.enrollments.length}/
                        {s.maxCapacity} élèves
                      </div>
                    </div>
                    <Link
                      href={`/teacher/sessions/${s.id}/attendance`}
                      className="text-xs text-blue-600 hover:underline shrink-0"
                    >
                      {pending > 0 ? `Présences (${pending})` : "Voir"}
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </ChartCard>
      </div>
    </section>
  );
}

function ChartCard({
  title,
  subtitle,
  action,
  children,
}: {
  title: string;
  subtitle?: string;
  action?: { href: string; label: string };
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-sm font-medium">{title}</h2>
          {subtitle ? (
            <p className="text-xs text-zinc-500">{subtitle}</p>
          ) : null}
        </div>
        {action ? (
          <Link
            href={action.href}
            className="text-xs text-blue-600 hover:underline"
          >
            {action.label}
          </Link>
        ) : null}
      </div>
      {children}
    </div>
  );
}
