import { calculateReminderDate, isEligibleForReminder, escapeHtml } from "@/lib/reminder";

describe("calculateReminderDate", () => {
  it("adds interval days", () => {
    const d = new Date("2026-01-01T12:00:00Z");
    const r = calculateReminderDate(d, 21);
    expect(r.getUTCDate()).toBe(22);
    expect(r.getUTCMonth()).toBe(0);
  });
});

describe("isEligibleForReminder", () => {
  it("true for completed eligible", () => {
    expect(isEligibleForReminder({ status: "completed", optedOut: false, consentGiven: true, alreadyRebooked: false })).toBe(true);
  });
  it("false if opted out", () => {
    expect(isEligibleForReminder({ status: "completed", optedOut: true, consentGiven: true, alreadyRebooked: false })).toBe(false);
  });
  it("false if not completed", () => {
    expect(isEligibleForReminder({ status: "pending", optedOut: false, consentGiven: true, alreadyRebooked: false })).toBe(false);
  });
  it("false if rebooked", () => {
    expect(isEligibleForReminder({ status: "completed", optedOut: false, consentGiven: true, alreadyRebooked: true })).toBe(false);
  });
});

describe("escapeHtml", () => {
  it("escapes dangerous chars", () => {
    expect(escapeHtml("<script>")).toBe("&lt;script&gt;");
  });
});