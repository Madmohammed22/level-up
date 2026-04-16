import { prisma } from "@/server/db/prisma";

/**
 * Write an audit log entry. Fire-and-forget — never throws.
 */
export async function audit(params: {
  userId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  payload?: Record<string, unknown>;
}): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId: params.userId ?? null,
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId ?? null,
        payload: params.payload ? JSON.parse(JSON.stringify(params.payload)) : undefined,
      },
    });
  } catch (err) {
    console.error("[audit-log] Failed to write:", err);
  }
}
