import { requireRole } from "@/server/auth/requireRole";
import { prisma } from "@/server/db/prisma";
import { TeacherScheduleSearch } from "./TeacherScheduleSearch";

export default async function TeacherSchedulePage() {
  const user = await requireRole("TEACHER");

  const profile = await prisma.teacherProfile.findUnique({
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
          Profil professeur introuvable. Contacte un administrateur.
        </p>
      </section>
    );
  }

  const sessions = await prisma.session.findMany({
    where: { teacherId: profile.id },
    orderBy: { startAt: "asc" },
    include: {
      subject: { select: { name: true } },
      room: { select: { name: true } },
      enrollments: {
        where: { status: "CONFIRMED" },
        select: { attendance: true },
      },
    },
  });

  const now = new Date();
  const rows = sessions.map((s) => {
    const total = s.enrollments.length;
    const pending = s.enrollments.filter(
      (e) => e.attendance === "PENDING",
    ).length;
    return {
      id: s.id,
      startAt: s.startAt.toISOString(),
      endAt: s.endAt.toISOString(),
      subjectName: s.subject.name,
      roomName: s.room.name,
      levels: s.levels,
      enrolledCount: total,
      maxCapacity: s.maxCapacity,
      status: s.status,
      pendingAttendance: pending,
      totalAttendance: total,
      isPast: s.endAt.getTime() < now.getTime(),
    };
  });

  return (
    <section>
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Mon planning</h1>
        <p className="text-sm text-zinc-500">
          Toutes tes séances, groupées par semaine. Clique sur «&nbsp;Présences&nbsp;»
          pour saisir la présence après la séance.
        </p>
      </header>

      <TeacherScheduleSearch rows={rows} />
    </section>
  );
}
