import crypto from "crypto";

export function verifyWebhookSignature(payload: string, signature: string | null, secret: string): boolean {
  if (!signature || !secret) return false;
  const expected = crypto.createHmac("sha256", secret).update(payload).digest("hex");
  try {
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  } catch {
    return false;
  }
}

export function isReplay(timestamp: string | null, toleranceSeconds = 300): boolean {
  if (!timestamp) return true;
  const ts = Number(timestamp);
  if (Number.isNaN(ts)) return true;
  const now = Math.floor(Date.now() / 1000);
  return Math.abs(now - ts) > toleranceSeconds;
}