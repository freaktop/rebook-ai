import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendReminderEmail, buildReminderEmail } from "@/lib/email";
import { generateUnsubscribeToken } from "@/lib/unsubscribe";

const CRON_SECRET = process.env.CRON_SECRET || "";

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (CRON_SECRET && auth !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const jobs = await prisma.reminderJob.findMany({
    where: { status: "pending", scheduledFor: { lte: now } },
    include: { customer: true, appointment: true, business: { include: { reminderConfigs: true } } },
    take: 50,
  });

  let sent = 0;
  let failed = 0;
  let canceled = 0;

  for (const job of jobs) {
    const customer = job.customer;
    const business = job.business;

    // re-check suppression: any new completed booking after this appointment?
    const newerBooking = await prisma.appointment.findFirst({
      where: {
        businessId: job.businessId,
        customerId: customer.id,
        createdAt: { gt: job.appointment.createdAt },
      },
    });

    if (customer.optedOut || !customer.consentGiven || (customer as any).optedOut) {
      await prisma.reminderJob.update({ where: { id: job.id }, data: { status: "canceled", canceledReason: "opted_out" } });
      canceled++;
      continue;
    }

    if (newerBooking) {
      await prisma.reminderJob.update({ where: { id: job.id }, data: { status: "canceled", canceledReason: "customer_rebooked" } });
      canceled++;
      continue;
    }

    // check preference
    const pref = await prisma.customerPreference.findUnique({ where: { customerId: customer.id } });
    if (pref && !pref.emailEnabled) {
      await prisma.reminderJob.update({ where: { id: job.id }, data: { status: "canceled", canceledReason: "email_disabled" } });
      canceled++;
      continue;
    }

    const unsubscribeToken = generateUnsubscribeToken(customer.id);
    const unsubscribeUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/unsubscribe?token=${unsubscribeToken}`;
    const bookingUrl = business.bookingUrl || `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}`;

    const result = await sendReminderEmail({
      to: customer.email,
      firstName: customer.firstName,
      serviceName: job.appointment.serviceName,
      businessName: business.name,
      businessContact: business.contactEmail || business.contactPhone,
      bookingUrl,
      unsubscribeUrl,
    });

    if (result.success) {
      await prisma.reminderJob.update({ where: { id: job.id }, data: { status: "sent" } });
      await prisma.reminderDelivery.create({
        data: {
          businessId: job.businessId,
          customerId: customer.id,
          reminderJobId: job.id,
          status: "sent",
          providerId: result.providerId,
          sentAt: new Date(),
        },
      });
      sent++;
    } else {
      await prisma.reminderDelivery.create({
        data: {
          businessId: job.businessId,
          customerId: customer.id,
          reminderJobId: job.id,
          status: "failed",
          error: result.error,
        },
      });
      // retry: leave job pending but bump scheduledFor by 1 hour (max 3 retries tracked by delivery count)
      const retryCount = await prisma.reminderDelivery.count({ where: { reminderJobId: job.id } });
      if (retryCount >= 3) {
        await prisma.reminderJob.update({ where: { id: job.id }, data: { status: "failed" } });
      } else {
        const next = new Date(now.getTime() + 60 * 60 * 1000);
        await prisma.reminderJob.update({ where: { id: job.id }, data: { scheduledFor: next } });
      }
      failed++;
    }
  }

  return NextResponse.json({ processed: jobs.length, sent, failed, canceled });
}