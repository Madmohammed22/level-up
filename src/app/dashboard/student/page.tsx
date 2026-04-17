import Link from "next/link";
import { requireRole } from "@/server/auth/requireRole";
import { prisma } from "@/server/db/prisma";
import { KpiCard } from "@/components/admin/analytics/KpiCard";
import {
  ExamCountdown,
  type ExamCountdownItem,
} from "@/components/student/ExamCountdown";

function fmtDate(d: Date): string {
  const days = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];
  return `${days[d.getDay()]} ${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function fmtTime(d: Date): string {
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export default async function StudentHomePage() {
  const user = await requireRole("STUDENT");

  const profile = await prisma.studentProfile.findUnique({
    where: { userId: user.id },
    select: { id: true, subjects: { select: { id: true, name: true } } },
  });

  const now = new Date();
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);

  // --- Exams countdown ---
  let exams: ExamCountdownItem[] = [];
  if (profile) {
    const rows = await prisma.examDate.findMany({
      where: { studentId: profile.id, date: { gte: today } },
      orderBy: { date: "asc" },
      take: 5,
      include: { subject: { select: { name: true } } },
    });
    exams = rows.map((r) => ({
      id: r.id,
      subjectName: r.subject.name,
      date: r.date,
      protocolActivated: r.protocolActivated,
    }));
  }

  // --- Upcoming sessions ---
  const upcomingSessions = profile
    ? await prisma.session.findMany({
        where: {
          status: "CONFIRMED",
          startAt: { gte: now },
          enrollments: {
            some: { studentId: profile.id, status: "CONFIRMED" },
          },
        },
        orderBy: { startAt: "asc" },
        take: 5,
        include: {
          subject: { select: { name: true } },
          room: { select: { name: true } },
          teacher: { include: { user: { select: { name: true } } } },
        },
      })
    : [];

  // --- Enrollments for stats ---
  const allEnrollments = profile
    ? await prisma.enrollment.findMany({
        where: {
          studentId: profile.id,
          status: "CONFIRMED",
          session: { status: { not: "CANCELLED" } },
        },
        select: { attendance: true },
      })
    : [];

  const totalSessions = allEnrollments.length;
  const marked = allEnrollments.filter((e) => e.attendance !== "PENDING");
  const present = marked.filter(
    (e) => e.attendance === "PRESENT" || e.attendance === "LATE",
  ).length;
  const attendanceRate =
    marked.length > 0 ? Math.round((present / marked.length) * 100) : null;

  // --- Content progress ---
  const totalContent = await prisma.contentItem.count({
    where: { published: true },
  });
  const completedContent = profile
    ? await prisma.contentCompletion.count({
        where: { studentId: profile.id },
      })
    : 0;
  const contentPct =
    totalContent > 0
      ? Math.round((completedContent / totalContent) * 100)
      : null;

  // --- Unread messages ---
  const convo = profile
    ? await prisma.conversation.findUnique({
        where: { studentId: profile.id },
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

  // --- Mood average ---
  const moodCheckIns = profile
    ? await prisma.moodCheckIn.findMany({
        where: { studentId: profile.id },
        select: { score: true },
      })
    : [];
  const avgMood =
    moodCheckIns.length > 0
      ? (
          moodCheckIns.reduce((a, m) => a + m.score, 0) / moodCheckIns.length
        ).toFixed(1)
      : null;

  // --- Attendance accent ---
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
          Salut {user.name ?? "toi"}
        </h1>
        <p className="text-sm text-zinc-500">Ton tableau de bord.</p>
      </header>

      {/* KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard
          title="Séances suivies"
          value={totalSessions}
          hint="Total inscrit"
        />
        <KpiCard
          title="Taux de présence"
          value={attendanceRate !== null ? `${attendanceRate}%` : "—"}
          hint="Présent + retard"
          accent={attendanceAccent}
        />
        <Link href="/dashboard/student/chat">
          <KpiCard
            title="Messages non lus"
            value={unread}
            hint="Voir la messagerie"
            accent={unread > 0 ? "red" : undefined}
          />
        </Link>
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

      {/* KPI row 2 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard
          title="Méthodologie"
          value={contentPct !== null ? `${contentPct}%` : "—"}
          hint={`${completedContent}/${totalContent} fiches`}
          accent={
            contentPct !== null
              ? contentPct >= 75
                ? "green"
                : contentPct >= 40
                  ? "amber"
                  : "red"
              : undefined
          }
        />
        <KpiCard
          title="Matières"
          value={profile?.subjects.length ?? 0}
          hint="Inscrit"
        />
        <KpiCard
          title="Examens à venir"
          value={exams.length}
          hint={exams.length > 0 ? exams[0].subjectName : undefined}
          accent={exams.length > 0 ? "amber" : undefined}
        />
        <KpiCard
          title="Prochaine séance"
          value={
            upcomingSessions.length > 0
              ? fmtDate(upcomingSessions[0].startAt)
              : "—"
          }
        />
      </div>

      {/* Detail cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Exam countdown */}
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-medium">Examens à venir</h2>
              <p className="text-xs text-zinc-500">Compte à rebours</p>
            </div>
            <Link
              href="/dashboard/student/exams"
              className="text-xs text-blue-600 hover:underline"
            >
              Voir tous
            </Link>
          </div>
          <ExamCountdown exams={exams} />
        </div>

        {/* Upcoming sessions */}
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-medium">Prochaines séances</h2>
              <p className="text-xs text-zinc-500">5 prochaines confirmées</p>
            </div>
            <Link
              href="/dashboard/student/schedule"
              className="text-xs text-blue-600 hover:underline"
            >
              Mon planning
            </Link>
          </div>
          {upcomingSessions.length === 0 ? (
            <p className="text-sm text-zinc-500">Aucune séance à venir.</p>
          ) : (
            <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {upcomingSessions.map((s) => (
                <li
                  key={s.id}
                  className="py-3 flex items-center justify-between gap-3"
                >
                  <div>
                    <div className="font-medium text-sm">
                      {s.subject.name}
                      <span className="ml-2 text-xs text-zinc-500 font-normal">
                        {s.teacher.user.name}
                      </span>
                    </div>
                    <div className="text-xs text-zinc-500">
                      {fmtDate(s.startAt)} · {fmtTime(s.startAt)}–
                      {fmtTime(s.endAt)} · {s.room.name}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
