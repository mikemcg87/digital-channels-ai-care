import type {
  BrandConfig,
  Classification,
  Conversation,
  RoutingDecision,
} from "./types";

/**
 * Routing: decide whether a message is answered automatically, drafted by AI
 * for a human to approve, or handed straight to a human.
 *
 * The rules are ordered by priority and each returns a reason, so every routing
 * decision can be explained to a stakeholder and asserted in a test — the
 * "define routing, handoff and escalation logic" requirement.
 */
export function route(
  conversation: Conversation,
  classification: Classification,
  brand: BrandConfig,
): RoutingDecision {
  const { intent, confidence, sentiment, urgency } = classification;

  // 1. Hard business policy: some intents never auto-resolve for this brand.
  if (brand.humanIntents.includes(intent)) {
    return human(brand, intent, urgency, `intent "${intent}" is human-only for ${brand.name}`);
  }

  // 2. Anything urgent goes to a human now, whatever the model thinks.
  if (urgency === "high") {
    return human(brand, intent, urgency, "urgency is high");
  }

  // 3. An angry customer is a retention risk: a person should own the reply.
  if (sentiment === "negative") {
    return human(brand, intent, urgency, "negative sentiment");
  }

  // 4. The AI has had its allotted turns; hand over before it loops.
  if (conversation.aiTurns >= brand.maxAiTurns) {
    return human(
      brand,
      intent,
      urgency,
      `AI has replied ${conversation.aiTurns} times without resolving (limit ${brand.maxAiTurns})`,
    );
  }

  // 5. Not confident enough to answer alone, but confident enough to draft:
  //    a human approves rather than writes from scratch.
  if (confidence < brand.confidenceFloor) {
    return {
      route: "ai_assist",
      reason: `confidence ${confidence} below floor ${brand.confidenceFloor}; AI drafts for review`,
    };
  }

  // 6. Otherwise the AI handles it.
  return { route: "auto", reason: `confident ${intent} (${confidence}) within policy` };
}

function human(
  brand: BrandConfig,
  intent: Classification["intent"],
  urgency: Classification["urgency"],
  reason: string,
): RoutingDecision {
  return {
    route: "human",
    reason,
    queue: brand.queues[intent],
    slaMinutes: brand.sla[urgency],
  };
}
