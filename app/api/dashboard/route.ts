import { NextResponse } from "next/server";
import { auth } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const admin = await prisma.businessAdmin.findUnique({ where: { id: session.user.id as string } });
  if (!admin) return NextResponse.json({ error: "admin_not_found" }, { status: 404 });

  const businessId = admin.businessId;

  const [
    eligibleCustomers,
    completedAppointments,
    pendingReminders,
    deliveredReminders,
    failedDeliveries,
    optedOutCustomers,
    recentActivity,
  ] = await Promise.all([
    prisma.customer.count({ where: { businessId, optedOut: false, consentGiven: true } }),
    prisma.appointment.count({ where: { businessId, status: "completed" } }),
    prisma.reminderJob.count({ where: { businessId, status: "pending" } }),
    prisma.reminderDelivery.count({ where: { businessId, status: "sent" } }),
    prisma.reminderDelivery.count({ where: { businessId, status: "failed" } }),
    prisma.customer.count({ where: { businessId, optedOut: true } }),
    prisma.auditLog.findMany({
      where: { businessId },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
  ]);

  return NextResponse.json({
    businessId,
    metrics: {
      eligibleCustomers,
      completedAppointments,
      pendingReminders,
      deliveredReminders,
      failedDeliveries,
      optedOutCustomers,
    },
    recentActivity,
  });
}