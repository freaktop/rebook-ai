import crypto from "crypto";
import { verifyWebhookSignature, isReplay } from "@/lib/webhook";

describe("webhook signature", () => {
  const secret = "shh";
  const payload = '{"event":"x"}';
  const sig = crypto.createHmac("sha256", secret).update(payload).digest("hex");

  it("verifies valid", () => {
    expect(verifyWebhookSignature(payload, sig, secret)).toBe(true);
  });
  it("rejects tampered", () => {
    expect(verifyWebhookSignature(payload + "x", sig, secret)).toBe(false);
  });
  it("rejects missing", () => {
    expect(verifyWebhookSignature(payload, null, secret)).toBe(false);
  });
});