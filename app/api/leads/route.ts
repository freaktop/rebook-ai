import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body?.email || !body?.businessName) {
    return NextResponse.json({ error: "missing_fields" }, { status: 400 });
  }
  // Store as audit log entry (lightweight lead capture). In production, route to CRM.
  await prisma.auditLog.create({
    data: {
      action: "demo_request",
      entityType: "lead",
      metadata: body,
    },
  });
  return NextResponse.json({ success: true });
}