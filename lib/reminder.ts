export function calculateReminderDate(completedAt: Date, intervalDays: number): Date {
  const d = new Date(completedAt);
  d.setDate(d.getDate() + intervalDays);
  // schedule at 09:00 local-ish (UTC) of that day
  d.setUTCHours(9, 0, 0, 0);
  return d;
}

export function isEligibleForReminder(params: {
  status: string;
  optedOut: boolean;
  consentGiven: boolean;
  alreadyRebooked: boolean;
}): boolean {
  if (params.status !== "completed") return false;
  if (params.optedOut) return false;
  if (!params.consentGiven) return false;
  if (params.alreadyRebooked) return false;
  return true;
}

export function escapeHtml(value: string | null | undefined): string {
  if (value == null) return "";
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}