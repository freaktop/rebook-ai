import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyUnsubscribeToken } from "@/lib/unsubscribe";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  if (!token) return NextResponse.json({ error: "missing_token" }, { status: 400 });
  const customerId = verifyUnsubscribeToken(token);
  if (!customerId) return NextResponse.json({ error: "invalid_or_expired_token" }, { status: 400 });

  const customer = await prisma.customer.findUnique({ where: { id: customerId } });
  if (!customer) return NextResponse.json({ error: "customer_not_found" }, { status: 404 });

  await prisma.customer.update({
    where: { id: customerId },
    data: { optedOut: true, optedOutAt: new Date() },
  });

  await prisma.reminderJob.updateMany({
    where: { customerId, status: "pending" },
    data: { status: "canceled", canceledReason: "customer_unsubscribed" },
  });

  await prisma.unsubscribeRecord.create({
    data: { customerId, token },
  });

  await prisma.auditLog.create({
    data: { businessId: customer.businessId, action: "customer_unsubscribed", entityType: "customer", entityId: customerId },
  });

  return NextResponse.redirect(new URL("/unsubscribed", req.url));
}