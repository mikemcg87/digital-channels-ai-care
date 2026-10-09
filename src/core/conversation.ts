import { getBrand } from "./brands";
import { classify } from "./intent";
import { createHandoff } from "./handoff";
import { route } from "./routing";
import type {
  Channel,
  Classification,
  Conversation,
  ConversationState,
  Message,
  RoutingDecision,
  Speaker,
} from "./types";

/**
 * Turns the pure pieces into a workflow: append a message, classify, route,
 * hand off, resolve. This is the single entry point every channel calls.
 */

let seq = 0;
function id(prefix: string): string {
  seq += 1;
  return `${prefix}-${seq.toString(36)}`;
}

export function newConversation(brandId: string, channel: Channel): Conversation {
  return {
    id: id("conv"),
    brandId,
    channel,
    state: "new",
    messages: [],
    aiTurns: 0,
  };
}

export function addMessage(
  conversation: Conversation,
  speaker: Speaker,
  text: string,
  at: Date = new Date(),
): Message {
  const message: Message = {
    id: id("msg"),
    channel: conversation.channel,
    speaker,
    text,
    at: at.toISOString(),
  };
  conversation.messages.push(message);
  if (speaker === "ai") conversation.aiTurns += 1;
  if (speaker === "agent") conversation.aiTurns = 0;
  return message;
}

export interface HandleResult {
  decision: RoutingDecision;
  classification: Classification;
  /** True when the AI should produce the reply itself. */
  autoReply: boolean;
  /** True when this call raised a handoff (a new ticket was created). */
  handoffRaised: boolean;
  state: ConversationState;
}

/**
 * Process one inbound customer message and move the conversation accordingly.
 */
export function handleInbound(
  conversation: Conversation,
  text: string,
  now: Date = new Date(),
): HandleResult {
  addMessage(conversation, "customer", text, now);
  const brand = getBrand(conversation.brandId);
  const classification = classify(text);
  const decision = route(conversation, classification, brand);

  let handoffRaised = false;
  switch (decision.route) {
    case "human": {
      conversation.state = "awaiting_human";
      if (!conversation.handoff) {
        conversation.handoff = createHandoff(conversation, classification, brand, decision, now);
        handoffRaised = true;
      }
      break;
    }
    case "ai_assist":
      // Drafted by AI, approved by a human: the human still owns the reply.
      conversation.state = "awaiting_human";
      if (!conversation.handoff) {
        conversation.handoff = createHandoff(conversation, classification, brand, decision, now);
        handoffRaised = true;
      }
      break;
    case "auto":
    default:
      conversation.state = "ai_handling";
      break;
  }

  return {
    decision,
    classification,
    autoReply: decision.route === "auto",
    handoffRaised,
    state: conversation.state,
  };
}

/** A human replies; the conversation is now human-owned. */
export function agentReply(
  conversation: Conversation,
  text: string,
  now: Date = new Date(),
): Message {
  conversation.state = "human_handling";
  return addMessage(conversation, "agent", text, now);
}

export function resolve(conversation: Conversation): void {
  conversation.state = "resolved";
}
