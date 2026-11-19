import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const admin = await prisma.businessAdmin.findUnique({ where: { id: session.user.id as string } });
  if (!admin) return NextResponse.json({ error: "admin_not_found" }, { status: 404 });

  const business = await prisma.business.findUnique({
    where: { id: admin.businessId },
    include: { reminderConfigs: true },
  });
  return NextResponse.json({ business });
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const admin = await prisma.businessAdmin.findUnique({ where: { id: session.user.id as string } });
  if (!admin) return NextResponse.json({ error: "admin_not_found" }, { status: 404 });

  const body = await req.json();
  const { name, bookingUrl, brandingColor, contactEmail, contactPhone, reminderInterval } = body;

  const business = await prisma.business.update({
    where: { id: admin.businessId },
    data: {
      name: name ?? undefined,
      bookingUrl: bookingUrl ?? undefined,
      brandingColor: brandingColor ?? undefined,
      contactEmail: contactEmail ?? undefined,
      contactPhone: contactPhone ?? undefined,
    },
  });

  if (reminderInterval != null) {
    await prisma.reminderConfig.upsert({
      where: { businessId: admin.businessId },
      update: { intervalDays: Number(reminderInterval) },
      create: { businessId: admin.businessId, intervalDays: Number(reminderInterval) },
    });
    await prisma.business.update({
      where: { id: admin.businessId },
      data: { reminderInterval: Number(reminderInterval) },
    });
  }

  return NextResponse.json({ business });
}