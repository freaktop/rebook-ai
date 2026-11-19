import { generateUnsubscribeToken, verifyUnsubscribeToken } from "@/lib/unsubscribe";

describe("unsubscribe tokens", () => {
  it("round trips", () => {
    const t = generateUnsubscribeToken("cust123");
    expect(verifyUnsubscribeToken(t)).toBe("cust123");
  });
  it("rejects garbage", () => {
    expect(verifyUnsubscribeToken("not-a-token")).toBeNull();
  });
});