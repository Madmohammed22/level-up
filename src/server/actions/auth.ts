"use server";

// Auth Server Actions.
// - signUp: creates a Supabase Auth user AND the mirrored Prisma User row
//   (role = STUDENT by default; admin is promoted manually via SQL).
// - signIn: email+password login, redirects to a role-specific dashboard.
// - signOut: clears the Supabase session.

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { prisma } from "@/server/db/prisma";

const SignInSchema = z.object({
  email: z.string().email("Email invalide"),
  password: z.string().min(8, "Mot de passe: 8 caractères minimum"),
});

const SignUpSchema = z.object({
  name: z.string().min(2, "Nom trop court"),
  email: z.string().email("Email invalide"),
  password: z.string().min(8, "Mot de passe: 8 caractères minimum"),
});

export type AuthState = { error?: string };

function roleHome(role: string): string {
  switch (role) {
    case "ADMIN":
      return "/dashboard/admin";
    case "TEACHER":
      return "/dashboard/teacher";
    default:
      return "/dashboard/student";
  }
}

export async function signIn(
  _prev: AuthState | undefined,
  formData: FormData,
): Promise<AuthState> {
  const parsed = SignInSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Entrée invalide" };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error || !data.user) {
    return { error: "Identifiants invalides" };
  }

  // Ensure the Prisma User row is linked to this Supabase auth user.
  const prismaUser = await prisma.user.findFirst({
    where: { OR: [{ authId: data.user.id }, { email: parsed.data.email }] },
  });

  if (!prismaUser) {
    // No matching Prisma user — sign them out to avoid an inconsistent state.
    await supabase.auth.signOut();
    return { error: "Compte introuvable. Contactez un administrateur." };
  }

  if (!prismaUser.authId) {
    await prisma.user.update({
      where: { id: prismaUser.id },
      data: { authId: data.user.id },
    });
  }

  revalidatePath("/", "layout");
  redirect(roleHome(prismaUser.role));
}

export async function signUp(
  _prev: AuthState | undefined,
  formData: FormData,
): Promise<AuthState> {
  const parsed = SignUpSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Entrée invalide" };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
  });
  if (error || !data.user) {
    return { error: error?.message ?? "Inscription impossible" };
  }

  // Upsert the Prisma User row. Default role STUDENT.
  await prisma.user.upsert({
    where: { email: parsed.data.email },
    update: { authId: data.user.id, name: parsed.data.name },
    create: {
      email: parsed.data.email,
      name: parsed.data.name,
      authId: data.user.id,
      role: "STUDENT",
    },
  });

  revalidatePath("/", "layout");
  redirect("/dashboard/student");
}

export async function forgotPassword(
  _prev: AuthState | undefined,
  formData: FormData,
): Promise<AuthState & { ok?: boolean }> {
  const email = (formData.get("email") as string | null)?.trim();
  if (!email || !z.string().email().safeParse(email).success) {
    return { error: "Email invalide" };
  }

  const supabase = await createSupabaseServerClient();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${siteUrl}/api/auth/callback?next=/auth/reset-password`,
  });
  if (error) {
    return { error: error.message };
  }

  return { ok: true };
}

export async function resetPassword(
  _prev: AuthState | undefined,
  formData: FormData,
): Promise<AuthState & { ok?: boolean }> {
  const password = formData.get("password") as string | null;
  if (!password || password.length < 8) {
    return { error: "Mot de passe: 8 caractères minimum" };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    return { error: error.message };
  }

  return { ok: true };
}

export async function signOut() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/auth/login");
}
