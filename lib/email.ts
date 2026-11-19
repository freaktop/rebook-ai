import { Resend } from "resend";
import { escapeHtml } from "./reminder";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export interface ReminderEmailParams {
  to: string;
  firstName?: string | null;
  serviceName?: string | null;
  businessName: string;
  businessContact?: string | null;
  bookingUrl: string;
  unsubscribeUrl: string;
}

export function buildReminderEmail(params: ReminderEmailParams): { subject: string; html: string; text: string } {
  const subject = "It's time to book your next appointment.";
  const firstName = escapeHtml(params.firstName || "there");
  const serviceName = escapeHtml(params.serviceName || "appointment");
  const businessName = escapeHtml(params.businessName);
  const businessContact = escapeHtml(params.businessContact || "");
  const bookingUrl = escapeHtml(params.bookingUrl);
  const unsubscribeUrl = escapeHtml(params.unsubscribeUrl);

  const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="font-family:Arial,Helvetica,sans-serif;max-width:600px;margin:0 auto;padding:24px;color:#1f2937;">
  <h2 style="color:#111827;">It's time to book your next appointment.</h2>
  <p>Hi ${firstName},</p>
  <p>We hope you enjoyed your recent ${serviceName} appointment at ${businessName}.</p>
  <p>It's almost time for your next visit.</p>
  <p>You can book your next appointment using the link below.</p>
  <p style="margin:24px 0;">
    <a href="${bookingUrl}" style="display:inline-block;background:#2563eb;color:#fff;padding:12px 24px;text-decoration:none;border-radius:6px;font-weight:bold;">BOOK YOUR NEXT APPOINTMENT</a>
  </p>
  <p>We look forward to seeing you again.</p>
  <p>${businessName}</p>
  ${businessContact ? `<p style="color:#6b7280;font-size:13px;">${businessContact}</p>` : ""}
  <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;">
  <p style="color:#9ca3af;font-size:12px;">Unsubscribe: <a href="${unsubscribeUrl}">${unsubscribeUrl}</a></p>
</body></html>`;

  const text = `Hi ${params.firstName || "there"},

We hope you enjoyed your recent ${params.serviceName || "appointment"} appointment at ${params.businessName}.

It's almost time for your next visit.

You can book your next appointment using the link below:

${params.bookingUrl}

We look forward to seeing you again.

${params.businessName}
${params.businessContact || ""}

Unsubscribe: ${params.unsubscribeUrl}`;

  return { subject, html, text };
}

export async function sendReminderEmail(params: ReminderEmailParams): Promise<{ success: boolean; providerId?: string; error?: string }> {
  if (!resend) {
    return { success: false, error: "RESEND_API_KEY not configured" };
  }
  const { subject, html, text } = buildReminderEmail(params);
  try {
    const result = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || "Rebook AI <noreply@example.com>",
      to: params.to,
      subject,
      html,
      text,
    });
    if (result.error) {
      return { success: false, error: result.error.message };
    }
    return { success: true, providerId: result.data?.id };
  } catch (e: any) {
    return { success: false, error: e?.message || "Unknown error" };
  }
}