/**
 * E2E seed for the scheduling / assignment engine.
 *
 * Creates a deterministic fixture:
 *   1 admin, 2 teachers (each 1 subject), 3 rooms (cap 5/8/10),
 *   8 time slots (Mon-Fri), 12 students across 3 levels,
 *   compatibility matrix, varied availability.
 *
 * Run standalone:  NODE_OPTIONS='--dns-result-order=ipv4first' tsx src/tests/e2e/helpers/seed-scheduling.ts
 */
import { setDefaultResultOrder } from "node:dns";
setDefaultResultOrder("ipv4first");

import { config as loadEnv } from "dotenv";
loadEnv({ path: ".env.local" });
loadEnv({ path: ".env" });

import { PrismaClient } from "../../../../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { createClient } from "@supabase/supabase-js";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL not set");
  process.exit(1);
}
const adapter = new PrismaPg({ connectionString: url });
const prisma = new PrismaClient({ adapter });

// ── Credentials ──────────────────────────────────────────────────────
export const E2E_ADMIN_EMAIL = "e2e-admin@levelup.test";
export const E2E_ADMIN_PASSWORD = "E2eTest!2026";

// ── Supabase admin helper ────────────────────────────────────────────
async function ensureAuthUser(
  email: string,
  password: string,
  name: string,
): Promise<string | null> {
  const sbUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!sbUrl || !serviceKey) {
    console.warn("Supabase env vars missing – skipping auth user creation");
    return null;
  }

  const sb = createClient(sbUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // Search existing
  let page = 1;
  for (;;) {
    const { data, error } = await sb.auth.admin.listUsers({
      page,
      perPage: 1000,
    });
    if (error) {
      console.error("listUsers failed:", error.message);
      return null;
    }
    const hit = data.users.find(
      (u) => u.email?.toLowerCase() === email.toLowerCase(),
    );
    if (hit) {
      await sb.auth.admin.updateUserById(hit.id, {
        password,
        email_confirm: true,
        user_metadata: { name, role: "ADMIN" },
      });
      return hit.id;
    }
    if (data.users.length < 1000) break;
    page += 1;
  }

  const { data, error } = await sb.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name, role: "ADMIN" },
  });
  if (error || !data.user) {
    console.error("createUser failed:", error?.message);
    return null;
  }
  return data.user.id;
}

// ── Main seed ────────────────────────────────────────────────────────
export async function seedSchedulingFixture() {
  console.log("[e2e-seed] Cleaning tables…");

  // Delete SRS tables first to avoid FK violations
  await prisma.$transaction([
    prisma.srsReview.deleteMany(),
    prisma.srsCard.deleteMany(),
    prisma.srsSubject.deleteMany(),
    prisma.enrollment.deleteMany(),
    prisma.session.deleteMany(),
    prisma.sessionTemplate.deleteMany(),
    prisma.teacherAvailability.deleteMany(),
    prisma.studentAvailability.deleteMany(),
    prisma.timeSlot.deleteMany(),
    prisma.levelCompatibility.deleteMany(),
    prisma.moodCheckIn.deleteMany(),
    prisma.contentCompletion.deleteMany(),
    prisma.contentItem.deleteMany(),
    prisma.examDate.deleteMany(),
    prisma.notification.deleteMany(),
    prisma.message.deleteMany(),
    prisma.conversation.deleteMany(),
    prisma.studentProfile.deleteMany(),
    prisma.teacherProfile.deleteMany(),
    prisma.room.deleteMany(),
    prisma.subject.deleteMany(),
    prisma.leadSubmission.deleteMany(),
    prisma.auditLog.deleteMany(),
    prisma.user.deleteMany(),
  ]);

  // ── Subjects ──
  const maths = await prisma.subject.create({ data: { name: "Maths" } });
  const physique = await prisma.subject.create({ data: { name: "Physique" } });

  // ── Rooms (3 rooms: 5 / 8 / 10) ──
  const roomSmall = await prisma.room.create({
    data: { name: "Salle Petite", capacity: 5 },
  });
  const roomMedium = await prisma.room.create({
    data: { name: "Salle Moyenne", capacity: 8 },
  });
  const roomLarge = await prisma.room.create({
    data: { name: "Salle Grande", capacity: 10 },
  });

  // ── Time Slots (8: Mon-Fri, 2 per day but skip Wed+Fri afternoon) ──
  const slotDefs: Array<{
    dayOfWeek:
      | "MONDAY"
      | "TUESDAY"
      | "WEDNESDAY"
      | "THURSDAY"
      | "FRIDAY";
    startTime: string;
    endTime: string;
  }> = [
    { dayOfWeek: "MONDAY", startTime: "16:00", endTime: "17:30" },
    { dayOfWeek: "MONDAY", startTime: "17:45", endTime: "19:15" },
    { dayOfWeek: "TUESDAY", startTime: "16:00", endTime: "17:30" },
    { dayOfWeek: "TUESDAY", startTime: "17:45", endTime: "19:15" },
    { dayOfWeek: "WEDNESDAY", startTime: "14:00", endTime: "15:30" },
    { dayOfWeek: "THURSDAY", startTime: "16:00", endTime: "17:30" },
    { dayOfWeek: "THURSDAY", startTime: "17:45", endTime: "19:15" },
    { dayOfWeek: "FRIDAY", startTime: "16:00", endTime: "17:30" },
  ];
  const timeSlots = [];
  for (const def of slotDefs) {
    timeSlots.push(await prisma.timeSlot.create({ data: def }));
  }

  // ── Compatibility matrix ──
  // GRADE_10 + GRADE_11 = compatible (for Maths)
  // GRADE_10 + GRADE_12 = BLOCKED
  // GRADE_11 + GRADE_12 = compatible (for Physique)
  await prisma.levelCompatibility.createMany({
    data: [
      {
        subjectId: maths.id,
        levelA: "GRADE_10",
        levelB: "GRADE_11",
        compatible: true,
      },
      {
        subjectId: physique.id,
        levelA: "GRADE_11",
        levelB: "GRADE_12",
        compatible: true,
      },
      // Explicitly block GRADE_10 + GRADE_12 (for clarity in tests)
      {
        subjectId: maths.id,
        levelA: "GRADE_10",
        levelB: "GRADE_12",
        compatible: false,
      },
      {
        subjectId: physique.id,
        levelA: "GRADE_10",
        levelB: "GRADE_12",
        compatible: false,
      },
    ],
  });

  // ── Teachers ──
  // Teacher A: Maths only
  const teacherA = await prisma.user.create({
    data: {
      email: "e2e-prof-maths@levelup.test",
      name: "Prof Maths",
      role: "TEACHER",
      teacherProfile: {
        create: {
          subjects: { connect: [{ id: maths.id }] },
        },
      },
    },
    include: { teacherProfile: true },
  });
  // Teacher B: Physique only
  const teacherB = await prisma.user.create({
    data: {
      email: "e2e-prof-physique@levelup.test",
      name: "Prof Physique",
      role: "TEACHER",
      teacherProfile: {
        create: {
          subjects: { connect: [{ id: physique.id }] },
        },
      },
    },
    include: { teacherProfile: true },
  });

  // Both teachers available on all slots
  for (const ts of timeSlots) {
    await prisma.teacherAvailability.create({
      data: {
        teacherId: teacherA.teacherProfile!.id,
        timeSlotId: ts.id,
        available: true,
      },
    });
    await prisma.teacherAvailability.create({
      data: {
        teacherId: teacherB.teacherProfile!.id,
        timeSlotId: ts.id,
        available: true,
      },
    });
  }

  // ── Students (12: 4 x GRADE_10, 4 x GRADE_11, 4 x GRADE_12) ──
  type StudentSeed = {
    name: string;
    email: string;
    level: "GRADE_10" | "GRADE_11" | "GRADE_12";
    subjectIds: string[];
    /** Override availability: "all" (default), "none", or specific slot indices */
    availability?: "all" | "none" | number[];
  };

  const studentSeeds: StudentSeed[] = [
    // GRADE_10 — 4 students, all want Maths
    {
      name: "Eleve G10-A",
      email: "e2e-g10a@levelup.test",
      level: "GRADE_10",
      subjectIds: [maths.id],
    },
    {
      name: "Eleve G10-B",
      email: "e2e-g10b@levelup.test",
      level: "GRADE_10",
      subjectIds: [maths.id],
    },
    {
      name: "Eleve G10-C",
      email: "e2e-g10c@levelup.test",
      level: "GRADE_10",
      subjectIds: [maths.id],
    },
    {
      name: "Eleve G10-D",
      email: "e2e-g10d@levelup.test",
      level: "GRADE_10",
      subjectIds: [maths.id],
    },

    // GRADE_11 — 4 students, want Maths + Physique
    {
      name: "Eleve G11-A",
      email: "e2e-g11a@levelup.test",
      level: "GRADE_11",
      subjectIds: [maths.id, physique.id],
    },
    {
      name: "Eleve G11-B",
      email: "e2e-g11b@levelup.test",
      level: "GRADE_11",
      subjectIds: [maths.id, physique.id],
    },
    {
      name: "Eleve G11-C",
      email: "e2e-g11c@levelup.test",
      level: "GRADE_11",
      subjectIds: [maths.id, physique.id],
    },
    {
      name: "Eleve G11-D",
      email: "e2e-g11d@levelup.test",
      level: "GRADE_11",
      subjectIds: [maths.id, physique.id],
    },

    // GRADE_12 — 4 students
    // 3 want Physique (normal availability)
    {
      name: "Eleve G12-A",
      email: "e2e-g12a@levelup.test",
      level: "GRADE_12",
      subjectIds: [physique.id],
    },
    {
      name: "Eleve G12-B",
      email: "e2e-g12b@levelup.test",
      level: "GRADE_12",
      subjectIds: [physique.id],
    },
    {
      name: "Eleve G12-C",
      email: "e2e-g12c@levelup.test",
      level: "GRADE_12",
      subjectIds: [physique.id],
    },
    // 1 wants Physique but is UNAVAILABLE on ALL slots → must be unassigned
    {
      name: "Eleve G12-Indispo",
      email: "e2e-g12-indispo@levelup.test",
      level: "GRADE_12",
      subjectIds: [physique.id],
      availability: "none",
    },
  ];

  for (const s of studentSeeds) {
    const user = await prisma.user.create({
      data: {
        email: s.email,
        name: s.name,
        role: "STUDENT",
        studentProfile: {
          create: {
            level: s.level,
            subjects: { connect: s.subjectIds.map((id) => ({ id })) },
          },
        },
      },
      include: { studentProfile: true },
    });

    for (let i = 0; i < timeSlots.length; i++) {
      const ts = timeSlots[i];
      let preference: "AVAILABLE" | "PREFERRED" | "UNAVAILABLE";
      if (s.availability === "none") {
        preference = "UNAVAILABLE";
      } else if (Array.isArray(s.availability)) {
        preference = s.availability.includes(i) ? "AVAILABLE" : "UNAVAILABLE";
      } else {
        // "all" or undefined → AVAILABLE; first slot is PREFERRED
        preference = i === 0 ? "PREFERRED" : "AVAILABLE";
      }
      await prisma.studentAvailability.create({
        data: {
          studentId: user.studentProfile!.id,
          timeSlotId: ts.id,
          preference,
        },
      });
    }
  }

  // ── Admin ──
  const adminAuthId = await ensureAuthUser(
    E2E_ADMIN_EMAIL,
    E2E_ADMIN_PASSWORD,
    "E2E Admin",
  );
  await prisma.user.create({
    data: {
      email: E2E_ADMIN_EMAIL,
      name: "E2E Admin",
      role: "ADMIN",
      authId: adminAuthId,
    },
  });

  console.log("[e2e-seed] Done. IDs:");
  console.log("  Subjects:", maths.id, physique.id);
  console.log("  Rooms:", roomSmall.id, roomMedium.id, roomLarge.id);
  console.log("  Slots:", timeSlots.length);
  console.log(
    `  Admin: ${E2E_ADMIN_EMAIL} / ${E2E_ADMIN_PASSWORD} (authId=${adminAuthId})`,
  );

  return {
    maths,
    physique,
    roomSmall,
    roomMedium,
    roomLarge,
    timeSlots,
    teacherA,
    teacherB,
  };
}

// ── Run as standalone script ─────────────────────────────────────────
if (
  process.argv[1]?.endsWith("seed-scheduling.ts") ||
  process.argv[1]?.endsWith("seed-scheduling.js")
) {
  seedSchedulingFixture()
    .catch((err) => {
      console.error(err);
      process.exit(1);
    })
    .finally(() => prisma.$disconnect());
}
