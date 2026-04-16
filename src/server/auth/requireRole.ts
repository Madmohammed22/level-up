// Guard helpers. Use from Server Components, Server Actions, Route Handlers.

import { redirect } from "next/navigation";
import type { UserRole } from "@/generated/prisma/enums";
import { getCurrentUser } from "./getUser";

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireRole(...allowed: UserRole[]) {
  const user = await requireUser();
  if (!allowed.includes(user.role)) redirect("/");
  return user;
}
