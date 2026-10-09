import { describe, expect, it } from "vitest";
import { parseEmail, stripQuoted } from "../src/channels/email";

describe("email channel", () => {
  it("strips quoted history", () => {
    const raw = "I need help with billing.\n\nOn Mon, 1 Jan 2026, Support wrote:\n> an old reply";
    expect(stripQuoted(raw)).toBe("I need help with billing.");
  });

  it("strips the signature block", () => {
    const raw = "Please resend my invoice.\n\n--\nJane Doe\nAcme Ltd";
    expect(stripQuoted(raw)).toBe("Please resend my invoice.");
  });

  it("keeps the subject as a signal but preserves the raw fields in meta", () => {
    const message = parseEmail({
      from: "jane@acme.test",
      subject: "Invoice query",
      text: "Please check the amount on my latest invoice",
    });
    expect(message.text).toContain("Invoice query");
    expect(message.text).toContain("Please check the amount");
    expect(message.meta?.from).toBe("jane@acme.test");
    expect(message.meta?.subject).toBe("Invoice query");
  });

  it("rejects an email with no new content", () => {
    expect(() => parseEmail({ text: "On Mon, 1 Jan 2026, Support wrote:\n> old" })).toThrow();
  });
});
