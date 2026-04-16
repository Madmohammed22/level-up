/**
 * Demo seed: 3 subjects, 2 rooms, 10 time slots (Mon-Fri x 2 slots),
 * 2 teachers, 10 students, a compatibility matrix.
 *
 * Run: pnpm db:seed
 */
// Force IPv4 DNS resolution. Node 18+ may prefer AAAA (IPv6) records,
// but the Supabase pooler only reliably answers on IPv4 -> ECONNREFUSED otherwise.
// Note: the authoritative version of this flag is set via NODE_OPTIONS in
// package.json (before any ESM import runs); this call is a safety net.
import { setDefaultResultOrder } from "node:dns";
setDefaultResultOrder("ipv4first");

// Load env files. tsx does NOT load .env or .env.local automatically (unlike Next.js).
// Order matches Next.js precedence: .env.local overrides .env.
import { config as loadEnv } from "dotenv";
loadEnv({ path: ".env.local" });
loadEnv({ path: ".env" });

if (!process.env.DATABASE_URL) {
  console.error(
    "DATABASE_URL is not set. Put it in .env.local (or .env) at the repo root.",
  );
  process.exit(1);
}

import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

// Admin credentials (overridable via env). The admin auth user is
// (re)created idempotently so `pnpm db:seed` can always log you in.
const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL ?? "admin@levelup.demo";
const ADMIN_PASSWORD =
  process.env.SEED_ADMIN_PASSWORD ?? "LevelUp!Admin2026";
const ADMIN_NAME = process.env.SEED_ADMIN_NAME ?? "Admin LevelUp";

/**
 * Create (or look up) a Supabase auth user for the admin and return its UUID.
 * Requires SUPABASE_SERVICE_ROLE_KEY + NEXT_PUBLIC_SUPABASE_URL.
 * Returns null if Supabase is not configured — seeding still succeeds but
 * the admin will have no authId and cannot log in via Supabase.
 */
async function ensureAdminAuthUser(): Promise<string | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    console.warn(
      "Skipping admin auth bootstrap: SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_URL missing.",
    );
    return null;
  }

  const supabase: SupabaseClient = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // 1) Try to find existing user by email.
  //    listUsers paginates; we scan until we find it or run out.
  let page = 1;
  const perPage = 1000;
  let existing: { id: string } | null = null;
  for (;;) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage,
    });
    if (error) {
      console.error("Supabase listUsers failed:", error.message);
      return null;
    }
    const hit = data.users.find(
      (u) => u.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase(),
    );
    if (hit) {
      existing = { id: hit.id };
      break;
    }
    if (data.users.length < perPage) break;
    page += 1;
  }

  if (existing) {
    // Reset password so the seeded credentials always work after a reseed.
    const { error } = await supabase.auth.admin.updateUserById(existing.id, {
      password: ADMIN_PASSWORD,
      email_confirm: true,
      user_metadata: { name: ADMIN_NAME, role: "ADMIN" },
    });
    if (error) {
      console.error("Supabase updateUserById failed:", error.message);
      return null;
    }
    return existing.id;
  }

  const { data, error } = await supabase.auth.admin.createUser({
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
    email_confirm: true,
    user_metadata: { name: ADMIN_NAME, role: "ADMIN" },
  });
  if (error || !data.user) {
    console.error(
      "Supabase createUser failed:",
      error?.message ?? "unknown error",
    );
    return null;
  }
  return data.user.id;
}

async function main() {
  console.log("Seeding LEVEL UP demo data...");

  // Clean slate (safe for local dev).
  await prisma.$transaction([
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

  // ---- Subjects ----
  const [maths, physique, francais] = await Promise.all([
    prisma.subject.create({ data: { name: "Maths" } }),
    prisma.subject.create({ data: { name: "Physique" } }),
    prisma.subject.create({ data: { name: "Francais" } }),
  ]);

  // ---- Rooms ----
  await prisma.room.create({ data: { name: "Salle A", capacity: 10 } });
  await prisma.room.create({ data: { name: "Salle B", capacity: 10 } });

  // ---- Time slots (Mon-Fri x 2 slots = 10) ----
  const days = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"] as const;
  const slots = ["16:00-17:30", "17:45-19:15"];
  const timeSlots = [];
  for (const day of days) {
    for (const s of slots) {
      const [startTime, endTime] = s.split("-");
      timeSlots.push(
        await prisma.timeSlot.create({
          data: { dayOfWeek: day, startTime, endTime },
        }),
      );
    }
  }

  // ---- Compatibility matrix (admin configurable) ----
  await prisma.levelCompatibility.createMany({
    data: [
      // Maths: allow GRADE_10 <-> GRADE_11
      {
        subjectId: maths.id,
        levelA: "GRADE_10",
        levelB: "GRADE_11",
        compatible: true,
      },
      // Physique: allow GRADE_11 <-> GRADE_12
      {
        subjectId: physique.id,
        levelA: "GRADE_11",
        levelB: "GRADE_12",
        compatible: true,
      },
    ],
  });

  // ---- Teachers ----
  const teacher1User = await prisma.user.create({
    data: {
      email: "prof.durand@levelup.demo",
      name: "Claire Durand",
      role: "TEACHER",
      teacherProfile: {
        create: {
          bio: "Professeure de mathématiques et physique.",
          subjects: { connect: [{ id: maths.id }, { id: physique.id }] },
        },
      },
    },
    include: { teacherProfile: true },
  });

  const teacher2User = await prisma.user.create({
    data: {
      email: "prof.martin@levelup.demo",
      name: "Paul Martin",
      role: "TEACHER",
      teacherProfile: {
        create: {
          bio: "Professeur de français et méthodologie.",
          subjects: { connect: [{ id: francais.id }] },
        },
      },
    },
    include: { teacherProfile: true },
  });

  // Teacher availability: both teachers available on all slots.
  for (const ts of timeSlots) {
    await prisma.teacherAvailability.create({
      data: {
        teacherId: teacher1User.teacherProfile!.id,
        timeSlotId: ts.id,
        available: true,
      },
    });
    await prisma.teacherAvailability.create({
      data: {
        teacherId: teacher2User.teacherProfile!.id,
        timeSlotId: ts.id,
        available: true,
      },
    });
  }

  // ---- Students ----
  const studentSeeds = [
    { name: "Emma Petit", level: "GRADE_10", subjects: [maths, francais] },
    { name: "Lucas Bernard", level: "GRADE_10", subjects: [maths] },
    { name: "Chloé Dubois", level: "GRADE_10", subjects: [maths, physique] },
    { name: "Hugo Laurent", level: "GRADE_11", subjects: [maths, physique] },
    { name: "Léa Moreau", level: "GRADE_11", subjects: [maths] },
    { name: "Nathan Simon", level: "GRADE_11", subjects: [physique, francais] },
    { name: "Jade Michel", level: "GRADE_12", subjects: [physique] },
    { name: "Adam Leroy", level: "GRADE_12", subjects: [physique, francais] },
    { name: "Sara Roux", level: "GRADE_9", subjects: [francais, maths] },
    { name: "Yanis David", level: "GRADE_9", subjects: [maths] },
  ] as const;

  for (const s of studentSeeds) {
    const user = await prisma.user.create({
      data: {
        email: `${s.name.split(" ")[0].toLowerCase()}@levelup.demo`,
        name: s.name,
        role: "STUDENT",
        studentProfile: {
          create: {
            level: s.level,
            subjects: { connect: s.subjects.map((su) => ({ id: su.id })) },
          },
        },
      },
      include: { studentProfile: true },
    });
    // Default: student is available on all slots.
    for (const ts of timeSlots) {
      await prisma.studentAvailability.create({
        data: {
          studentId: user.studentProfile!.id,
          timeSlotId: ts.id,
          preference: "AVAILABLE",
        },
      });
    }
  }

  // ---- Admin ----
  // Bootstrap the Supabase auth user first so we can link authId.
  const adminAuthId = await ensureAdminAuthUser();
  await prisma.user.create({
    data: {
      email: ADMIN_EMAIL,
      name: ADMIN_NAME,
      role: "ADMIN",
      authId: adminAuthId,
    },
  });

  if (adminAuthId) {
    console.log(
      `Admin ready — login: ${ADMIN_EMAIL} / password: ${ADMIN_PASSWORD}`,
    );
  } else {
    console.warn(
      `Admin row created WITHOUT authId (${ADMIN_EMAIL}). ` +
        "Set SUPABASE_SERVICE_ROLE_KEY and re-run to enable login.",
    );
  }

  // ---- Content (methodology/stress) ----
  await prisma.contentItem.createMany({
    data: [
      {
        title: "Respiration 4-7-8",
        type: "EXERCISE",
        category: "STRESS",
        body: "Inspire 4s, retiens 7s, expire 8s. Répète 4 fois.",
        durationSec: 120,
      },
      {
        title: "Technique Pomodoro",
        type: "MICRO_LESSON",
        category: "TIME_MANAGEMENT",
        body: "25 minutes de focus, 5 minutes de pause. Répète 4 fois puis pause longue.",
      },
      {
        title: "Protocole veille d'examen",
        type: "PROTOCOL",
        category: "EXAM_PREP",
        body: "Relecture ciblée, 30 min de sport léger, coucher à 22h30, pas d'écran 1h avant.",
      },
    ],
  });

  console.log("Seed done.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
