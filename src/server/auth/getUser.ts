// Resolve the current authenticated user (Supabase Auth) and their
// application-level User row (role, profiles).

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { prisma } from "@/server/db/prisma";

export type AppUser = Awaited<ReturnType<typeof getCurrentUser>>;

export async function getCurrentUser() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) return null;

  const user = await prisma.user.findUnique({
    where: { authId: authUser.id },
    include: {
      studentProfile: true,
      teacherProfile: true,
    },
  });

  return user;
}
