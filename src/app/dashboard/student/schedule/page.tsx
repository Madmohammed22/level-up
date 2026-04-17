import { requireRole } from "@/server/auth/requireRole";
import { prisma } from "@/server/db/prisma";
import {
  SessionsTable,
  groupByWeek,
  type SessionRow,
} from "@/components/sessions/SessionsTable";

export default async function StudentSchedulePage() {
  const user = await requireRole("STUDENT");

  const profile = await prisma.studentProfile.findUnique({
    where: { userId: user.id },
    select: { id: true },
  });

  if (!profile) {
    return (
      <section>
        <h1 className="text-2xl font-semibold tracking-tight mb-2">
          Mon planning
        </h1>
        <p className="text-sm text-zinc-500">
          Profil élève introuvable. Contacte un administrateur.
        </p>
      </section>
    );
  }

  const enrollments = await prisma.enrollment.findMany({
    where: {
      studentId: profile.id,
      status: "CONFIRMED",
      session: { status: { not: "CANCELLED" } },
    },
    include: {
      session: {
        include: {
          subject: { select: { name: true } },
          room: { select: { name: true } },
          teacher: { include: { user: { select: { name: true } } } },
          _count: { select: { enrollments: true } },
        },
      },
    },
    orderBy: { session: { startAt: "asc" } },
  });

  const rows: SessionRow[] = enrollments.map((e) => ({
    id: e.session.id,
    startAt: e.session.startAt,
    endAt: e.session.endAt,
    subjectName: e.session.subject.name,
    teacherName: e.session.teacher.user.name,
    roomName: e.session.room.name,
    levels: e.session.levels,
    enrolledCount: e.session._count.enrollments,
    maxCapacity: e.session.maxCapacity,
    status: e.session.status,
  }));

  const byWeek = groupByWeek(rows);

  return (
    <section>
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Mon planning</h1>
        <p className="text-sm text-zinc-500">
          Tes séances à venir et passées, organisées par semaine.
        </p>
      </header>

      {byWeek.length === 0 ? (
        <p className="text-sm text-zinc-500">
          Aucune séance assignée pour le moment.
        </p>
      ) : (
        <div className="space-y-8">
          {byWeek.map((g) => (
            <div key={g.key}>
              <h2 className="text-sm font-medium mb-3">{g.label}</h2>
              <SessionsTable sessions={g.items} showEnrollment={false} />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
