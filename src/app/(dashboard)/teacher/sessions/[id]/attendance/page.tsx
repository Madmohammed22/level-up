import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireRole } from "@/server/auth/requireRole";
import { prisma } from "@/server/db/prisma";
import { markAttendanceBulk } from "@/server/actions/teacher/attendance";

const DATE_FMT = new Intl.DateTimeFormat("fr-FR", {
  weekday: "long",
  day: "2-digit",
  month: "long",
  year: "numeric",
});
const TIME_FMT = new Intl.DateTimeFormat("fr-FR", {
  hour: "2-digit",
  minute: "2-digit",
});

const ATTENDANCE_OPTIONS: Array<{
  value: "PENDING" | "PRESENT" | "ABSENT" | "LATE";
  label: string;
}> = [
  { value: "PENDING", label: "—" },
  { value: "PRESENT", label: "Présent" },
  { value: "LATE", label: "Retard" },
  { value: "ABSENT", label: "Absent" },
];

export default async function TeacherSessionAttendancePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireRole("TEACHER");
  const { id } = await params;

  const teacher = await prisma.teacherProfile.findUnique({
    where: { userId: user.id },
    select: { id: true },
  });
  if (!teacher) redirect("/teacher");

  const session = await prisma.session.findUnique({
    where: { id },
    include: {
      subject: { select: { name: true } },
      room: { select: { name: true } },
      enrollments: {
        where: { status: "CONFIRMED" },
        include: {
          student: {
            include: { user: { select: { name: true } } },
          },
        },
        orderBy: { student: { user: { name: "asc" } } },
      },
    },
  });

  if (!session) notFound();
  if (session.teacherId !== teacher.id) redirect("/teacher/schedule");

  return (
    <section>
      <Link
        href="/teacher/schedule"
        className="text-xs text-zinc-500 hover:underline inline-block mb-4"
      >
        ← Retour au planning
      </Link>

      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">
          Présences — {session.subject.name}
        </h1>
        <p className="text-sm text-zinc-500 mt-1">
          {DATE_FMT.format(session.startAt)} ·{" "}
          {TIME_FMT.format(session.startAt)}–{TIME_FMT.format(session.endAt)} ·{" "}
          {session.room.name}
        </p>
      </header>

      {session.enrollments.length === 0 ? (
        <p className="text-sm text-zinc-500">Aucun élève inscrit.</p>
      ) : (
        <form action={markAttendanceBulk} className="space-y-4">
          <input type="hidden" name="sessionId" value={session.id} />

          <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-zinc-500 border-b border-zinc-200 dark:border-zinc-800">
                  <th className="px-4 py-2 font-medium">Élève</th>
                  <th className="px-4 py-2 font-medium">Niveau</th>
                  <th className="px-4 py-2 font-medium">Présence</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {session.enrollments.map((e) => (
                  <tr key={e.id}>
                    <td className="px-4 py-3 font-medium">
                      {e.student.user.name}
                    </td>
                    <td className="px-4 py-3 text-xs text-zinc-500">
                      {e.student.level}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-3">
                        {ATTENDANCE_OPTIONS.map((opt) => (
                          <label
                            key={opt.value}
                            className="inline-flex items-center gap-1 text-xs"
                          >
                            <input
                              type="radio"
                              name={`attendance_${e.id}`}
                              value={opt.value}
                              defaultChecked={e.attendance === opt.value}
                            />
                            {opt.label}
                          </label>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button
            type="submit"
            className="rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 px-4 py-2 text-sm font-medium"
          >
            Enregistrer les présences
          </button>
        </form>
      )}
    </section>
  );
}
