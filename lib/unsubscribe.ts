import crypto from "crypto";

const SECRET = process.env.NEXTAUTH_SECRET || "dev-secret-change-me";

export function generateUnsubscribeToken(customerId: string): string {
  const payload = `${customerId}:${Date.now()}`;
  const sig = crypto.createHmac("sha256", SECRET).update(payload).digest("hex");
  return Buffer.from(`${payload}:${sig}`).toString("base64url");
}

export function verifyUnsubscribeToken(token: string): string | null {
  try {
    const decoded = Buffer.from(token, "base64url").toString();
    const parts = decoded.split(":");
    if (parts.length !== 3) return null;
    const [customerId, ts, sig] = parts;
    const payload = `${customerId}:${ts}`;
    const expected = crypto.createHmac("sha256", SECRET).update(payload).digest("hex");
    if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
    // token valid for 30 days
    if (Date.now() - Number(ts) > 30 * 24 * 60 * 60 * 1000) return null;
    return customerId;
  } catch {
    return null;
  }
}