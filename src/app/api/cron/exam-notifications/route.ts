// Optional cron endpoint — can be called by an external scheduler.
// Not required: the admin dashboard triggers reminders automatically via after().
//
// POST /api/cron/exam-notifications
// Header: Authorization: Bearer <CRON_SECRET>

import { NextResponse, type NextRequest } from "next/server";
import { sendExamReminders } from "@/server/domain/notifications/examReminders";

export async function POST(request: NextRequest) {
  const auth = request.headers.get("authorization");
  const secret = process.env.CRON_SECRET;
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await sendExamReminders();
  return NextResponse.json(result);
}
