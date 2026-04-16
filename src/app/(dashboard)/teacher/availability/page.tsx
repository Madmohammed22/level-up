import { requireRole } from "@/server/auth/requireRole";
import { prisma } from "@/server/db/prisma";
import { TeacherAvailabilityForm } from "./TeacherAvailabilityForm";

export default async function TeacherAvailabilityPage() {
  const user = await requireRole("TEACHER");

  const profile = await prisma.teacherProfile.findUnique({
    where: { userId: user.id },
    select: { id: true },
  });

  const timeSlots = await prisma.timeSlot.findMany({
    orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
    select: { id: true, dayOfWeek: true, startTime: true, endTime: true },
  });

  // Load existing availability
  const existing = profile
    ? await prisma.teacherAvailability.findMany({
        where: { teacherId: profile.id },
        select: { timeSlotId: true, available: true },
      })
    : [];

  const saved: Record<string, boolean> = {};
  for (const row of existing) {
    saved[row.timeSlotId] = row.available;
  }

  return (
    <section>
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">
          Mes disponibilités
        </h1>
        <p className="text-sm text-zinc-500">
          Indiquez vos créneaux disponibles pour que le planning soit généré en
          fonction de votre emploi du temps.
        </p>
      </header>

      <TeacherAvailabilityForm timeSlots={timeSlots} saved={saved} />
    </section>
  );
}
