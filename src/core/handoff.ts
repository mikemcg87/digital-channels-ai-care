import type {
  BrandConfig,
  Classification,
  Conversation,
  HandoffTicket,
  RoutingDecision,
} from "./types";

/**
 * Handoff / escalation.
 *
 * Produces the ticket an agent receives. In production this would create a
 * record in the contact-centre or CRM; here it returns a plain object so the
 * logic is testable without any platform. The `summary` is what makes the
 * AI→human transition smooth: the agent never has to read the whole thread.
 */

let counter = 0;

function nextId(): string {
  counter += 1;
  return `HO-${Date.now().toString(36)}-${counter.toString(36).padStart(2, "0")}`;
}

/** One-line summary for the receiving agent. */
export function summarise(conversation: Conversation, classification: Classification): string {
  const lastCustomer = [...conversation.messages]
    .reverse()
    .find((m) => m.speaker === "customer");
  const snippet = lastCustomer
    ? lastCustomer.text.replace(/\s+/g, " ").trim().slice(0, 140)
    : "(no customer message)";
  return [
    `intent=${classification.intent}`,
    `urgency=${classification.urgency}`,
    `sentiment=${classification.sentiment}`,
    `turns=${conversation.messages.length}`,
    `last: "${snippet}"`,
  ].join(" | ");
}

export function createHandoff(
  conversation: Conversation,
  classification: Classification,
  brand: BrandConfig,
  decision: RoutingDecision,
  now: Date = new Date(),
): HandoffTicket {
  const priority = classification.urgency;
  return {
    id: nextId(),
    // Fall back to the brand's queue for the intent if routing did not name one.
    queue: decision.queue ?? brand.queues[classification.intent],
    priority,
    slaMinutes: decision.slaMinutes ?? brand.sla[priority],
    summary: summarise(conversation, classification),
    createdAt: now.toISOString(),
  };
}

/** Test/seed helper: reset the id counter for deterministic output. */
export function __resetHandoffCounter(): void {
  counter = 0;
}
