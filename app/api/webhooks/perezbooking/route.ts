import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyWebhookSignature, isReplay } from "@/lib/webhook";
import { calculateReminderDate } from "@/lib/reminder";
import crypto from "crypto";

const SECRET = process.env.REBOOK_WEBHOOK_SECRET || "";

export async function POST(req: NextRequest) {
  const raw = await req.text();
  const signature = req.headers.get("x-rebook-signature");
  const timestamp = req.headers.get("x-rebook-timestamp");
  const idempotencyKeyHeader = req.headers.get("x-idempotency-key");

  if (!verifyWebhookSignature(raw, signature, SECRET)) {
    return NextResponse.json({ error: "invalid_signature" }, { status: 401 });
  }
  if (isReplay(timestamp)) {
    return NextResponse.json({ error: "replay_or_stale" }, { status: 401 });
  }

  let body: any;
  try {
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const { event, businessSlug, data } = body || {};
  if (!event || !data) {
    return NextResponse.json({ error: "missing_event_or_data" }, { status: 400 });
  }

  const idempotencyKey = idempotencyKeyHeader || body.idempotencyKey || `${event}:${crypto.randomUUID()}`;

  // idempotency check
  const existing = await prisma.webhookEvent.findUnique({ where: { idempotencyKey } });
  if (existing) {
    return NextResponse.json({ status: "duplicate", id: existing.id });
  }

  const business = businessSlug
    ? await prisma.business.findUnique({ where: { slug: businessSlug } })
    : await prisma.business.findFirst();

  if (!business) {
    return NextResponse.json({ error: "business_not_found" }, { status: 404 });
  }

  const webhookEvent = await prisma.webhookEvent.create({
    data: {
      businessId: business.id,
      source: "perezbooking",
      eventType: event,
      idempotencyKey,
      payload: body,
      status: "processing",
    },
  });

  try {
    if (event === "appointment.completed") {
      await handleCompleted(business.id, data);
    } else if (event === "booking.created") {
      await handleNewBooking(business.id, data);
    } else {
      throw new Error(`unknown_event:${event}`);
    }
    await prisma.webhookEvent.update({
      where: { id: webhookEvent.id },
      data: { status: "processed", processedAt: new Date() },
    });
    return NextResponse.json({ status: "processed", id: webhookEvent.id });
  } catch (e: any) {
    await prisma.webhookEvent.update({
      where: { id: webhookEvent.id },
      data: { status: "failed", error: e?.message },
    });
    return NextResponse.json({ error: e?.message || "processing_failed" }, { status: 500 });
  }
}

async function handleCompleted(businessId: string, data: any) {
  const email = String(data.customer?.email || "").toLowerCase();
  if (!email) throw new Error("missing_customer_email");

  const customer = await prisma.customer.upsert({
    where: { businessId_email: { businessId, email } },
    update: {
      firstName: data.customer?.firstName ?? undefined,
      lastName: data.customer?.lastName ?? undefined,
      phone: data.customer?.phone ?? undefined,
      externalId: data.customer?.externalId ?? undefined,
    },
    create: {
      businessId,
      email,
      firstName: data.customer?.firstName,
      lastName: data.customer?.lastName,
      phone: data.customer?.phone,
      externalId: data.customer?.externalId,
      consentGiven: true,
    },
  });

  // ensure preference
  await prisma.customerPreference.upsert({
    where: { customerId: customer.id },
    update: {},
    create: { customerId: customer.id },
  });

  const completedAt = data.appointment?.completedAt ? new Date(data.appointment.completedAt) : new Date();
  const status = data.appointment?.status || "completed";
  const eligibleStatus = status === "completed" || status === "confirmed";

  const appointment = await prisma.appointment.create({
    data: {
      businessId,
      customerId: customer.id,
      externalId: data.appointment?.externalId,
      serviceName: data.appointment?.serviceName,
      status,
      completedAt: eligibleStatus ? completedAt : null,
      idempotencyKey: data.idempotencyKey || `appt:${data.appointment?.externalId || crypto.randomUUID()}`,
    },
  });

  // schedule reminder only if eligible
  const config = await prisma.reminderConfig.findUnique({ where: { businessId } });
  const interval = config?.intervalDays ?? (await prisma.business.findUnique({ where: { id: businessId } }))?.reminderInterval ?? 21;

  if (eligibleStatus && customer.consentGiven && !customer.optedOut) {
    const scheduledFor = calculateReminderDate(completedAt, interval);
    await prisma.reminderJob.create({
      data: {
        businessId,
        customerId: customer.id,
        appointmentId: appointment.id,
        scheduledFor,
        status: "pending",
      },
    });
  }
}

async function handleNewBooking(businessId: string, data: any) {
  const email = String(data.customer?.email || "").toLowerCase();
  if (!email) throw new Error("missing_customer_email");
  const customer = await prisma.customer.findUnique({ where: { businessId_email: { businessId, email } } });
  if (!customer) return;

  // cancel pending reminders
  await prisma.reminderJob.updateMany({
    where: { businessId, customerId: customer.id, status: "pending" },
    data: { status: "canceled", canceledReason: "customer_rebooked" },
  });

  await prisma.auditLog.create({
    data: {
      businessId,
      action: "reminder_suppressed",
      entityType: "customer",
      entityId: customer.id,
      metadata: { reason: "new_booking", bookingExternalId: data.booking?.externalId },
    },
  });
}