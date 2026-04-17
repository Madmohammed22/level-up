"use server";

import { prisma } from "@/server/db/prisma";
import { LeadSubmissionSchema } from "@/types/schemas";
import { notifyAdmins } from "@/server/domain/notify";

export async function submitLead(
  formData: FormData,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const raw = {
    name: String(formData.get("name") ?? ""),
    email: String(formData.get("email") ?? ""),
    phone: String(formData.get("phone") ?? ""),
    message: String(formData.get("message") ?? ""),
    source: String(formData.get("source") ?? "landing"),
  };

  const parsed = LeadSubmissionSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      error:
        parsed.error.issues[0]?.message ?? "Formulaire invalide",
    };
  }

  try {
    await prisma.leadSubmission.create({
      data: {
        name: parsed.data.name,
        email: parsed.data.email,
        phone: parsed.data.phone || null,
        message: parsed.data.message || null,
        source: parsed.data.source || "landing",
      },
    });

    // Notify all admins about new lead
    await notifyAdmins({
      type: "GENERIC",
      title: "Nouveau lead",
      body: `${parsed.data.name} (${parsed.data.email}) souhaite réserver une séance.`,
      data: { name: parsed.data.name, email: parsed.data.email },
    });

    return { ok: true };
  } catch {
    return { ok: false, error: "Erreur serveur. Réessayez plus tard." };
  }
}
