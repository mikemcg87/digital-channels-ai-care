import { describe, expect, it } from "vitest";
import { getBrand } from "../src/core/brands";
import { addMessage, newConversation } from "../src/core/conversation";
import { createHandoff, summarise } from "../src/core/handoff";
import { classify } from "../src/core/intent";
import { route } from "../src/core/routing";

const brand = getBrand("harbourhost");

describe("handoff", () => {
  it("builds a ticket with queue, priority, SLA and summary", () => {
    const conversation = newConversation("harbourhost", "chat");
    addMessage(conversation, "customer", "I want to cancel my account");
    const classification = classify("I want to cancel my account");
    const decision = route(conversation, classification, brand);
    const ticket = createHandoff(conversation, classification, brand, decision);

    expect(ticket.id).toMatch(/^HO-/);
    expect(ticket.queue).toBe("hh-retention");
    expect(ticket.priority).toBe("normal");
    expect(ticket.slaMinutes).toBe(240);
    expect(ticket.summary).toContain("intent=cancellation");
  });

  it("summarises recent customer text for the receiving agent", () => {
    const conversation = newConversation("harbourhost", "chat");
    addMessage(conversation, "customer", "Please cancel   my account today");
    const summary = summarise(conversation, classify("cancel"));
    expect(summary).toContain("last:");
    expect(summary).toContain("Please cancel my account today");
  });
});
