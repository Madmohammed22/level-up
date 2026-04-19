import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireRole } from "@/server/auth/requireRole";
import { prisma } from "@/server/db/prisma";
import { AttendanceForm } from "./AttendanceForm";
import { levelLabel } from "@/lib/levelLabels";

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
  if (!teacher) redirect("/dashboard/teacher");

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
  if (session.teacherId !== teacher.id) redirect("/dashboard/teacher/schedule");

  return (
    <section>
      <Link
        href="/dashboard/teacher/schedule"
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
        <AttendanceForm
          sessionId={session.id}
          enrollments={session.enrollments.map((e) => ({
            id: e.id,
            attendance: e.attendance,
            studentName: e.student.user.name ?? "",
            studentLevel: levelLabel(e.student.level),
          }))}
        />
      )}
    </section>
  );
}
