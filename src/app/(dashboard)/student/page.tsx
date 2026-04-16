import { requireRole } from "@/server/auth/requireRole";
import { prisma } from "@/server/db/prisma";
import {
  ExamCountdown,
  type ExamCountdownItem,
} from "@/components/student/ExamCountdown";

export default async function StudentHomePage() {
  const user = await requireRole("STUDENT");

  const profile = await prisma.studentProfile.findUnique({
    where: { userId: user.id },
    select: { id: true },
  });

  let exams: ExamCountdownItem[] = [];
  if (profile) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
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

  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">
          Salut {user.name ?? "toi"} 👋
        </h1>
        <p className="text-sm text-zinc-500">
          Ton planning, tes messages et tes ressources méthodologiques en un
          seul endroit.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ExamCountdown exams={exams} />
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5">
          <h2 className="font-medium">Astuce du jour</h2>
          <p className="mt-2 text-sm text-zinc-500">
            Respiration 4-7-8 avant de réviser — 2 minutes suffisent.
          </p>
        </div>
      </div>
    </section>
  );
}
