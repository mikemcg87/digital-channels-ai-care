import { describe, expect, it } from "vitest";
import { classify } from "../src/core/intent";

describe("classify", () => {
  it("detects billing and flags a duplicate charge as urgent", () => {
    const c = classify("I've been charged twice on my last invoice");
    expect(c.intent).toBe("billing");
    expect(c.urgency).toBe("high");
    expect(c.confidence).toBeGreaterThan(0.5);
  });

  it("detects a cancellation request", () => {
    const c = classify("Please cancel my account");
    expect(c.intent).toBe("cancellation");
  });

  it("detects a technical issue and its urgency", () => {
    const c = classify("My website is down with a 500 error");
    expect(c.intent).toBe("technical");
    expect(c.urgency).toBe("high");
  });

  it("detects a complaint and negative sentiment", () => {
    const c = classify("This is unacceptable and frankly useless");
    expect(c.intent).toBe("complaint");
    expect(c.sentiment).toBe("negative");
  });

  it("falls back to other with zero confidence when nothing matches", () => {
    const c = classify("hello there");
    expect(c.intent).toBe("other");
    expect(c.confidence).toBe(0);
  });

  it("explains itself", () => {
    expect(classify("cancel my account").reasons.join(" ")).toContain("cancellation");
  });
});
