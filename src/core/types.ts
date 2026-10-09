/**
 * Core domain types for the Digital Channels AI Care prototype.
 *
 * Design rule: the core knows nothing about Next.js, HTTP or OpenAI. It deals
 * only in conversations, messages, and routing decisions. Channels (chat,
 * email) and brands are adapters around it, so one implementation can serve
 * every channel and every brand — which is what makes it scale across markets.
 */

export type Channel = "chat" | "email";

/** Who produced a message. `agent` is always a human. */
export type Speaker = "customer" | "ai" | "agent" | "system";

export interface Message {
  id: string;
  channel: Channel;
  speaker: Speaker;
  text: string;
  /** ISO-8601 timestamp. */
  at: string;
  /** Channel-specific metadata, e.g. an email subject or message-id. */
  meta?: Record<string, string>;
}

/** Conversation lifecycle. Mirrors the flow in docs/03-conversation-flows.md. */
export type ConversationState =
  | "new"
  | "ai_handling"
  | "awaiting_human"
  | "human_handling"
  | "resolved";

export interface Conversation {
  id: string;
  brandId: string;
  channel: Channel;
  state: ConversationState;
  messages: Message[];
  /** Consecutive AI replies in this conversation, reset by any human reply. */
  aiTurns: number;
  handoff?: HandoffTicket;
}

/**
 * Intent taxonomy. Deliberately small and operational: each intent maps to a
 * queue and to a routing policy, so the taxonomy has business meaning rather
 * than being a generic NLP label set.
 */
export type Intent =
  | "billing"
  | "technical"
  | "cancellation"
  | "sales"
  | "complaint"
  | "account"
  | "other";

export type Urgency = "low" | "normal" | "high";

export type Sentiment = "positive" | "neutral" | "negative";

export interface Classification {
  intent: Intent;
  /** 0..1 — confidence in the predicted intent. */
  confidence: number;
  sentiment: Sentiment;
  urgency: Urgency;
  /** Why the classifier decided this; surfaced to agents and asserted in tests. */
  reasons: string[];
}

/** Where an inbound message should go. */
export type Route = "auto" | "ai_assist" | "human";

export interface RoutingDecision {
  route: Route;
  reason: string;
  /** Which human queue, when route is "human". */
  queue?: string;
  /** Target first-response time in minutes, when route is "human". */
  slaMinutes?: number;
}

/**
 * Per-brand policy. Everything that differs between brands lives here, so the
 * rollout story ("standardise the core, configure per brand") is literal.
 */
export interface BrandConfig {
  id: string;
  name: string;
  /** Tone guidance handed to the model, e.g. "warm, plain English". */
  tone: string;
  /** Intents this brand always sends to a human, regardless of confidence. */
  humanIntents: Intent[];
  /** Below this confidence the AI may not answer alone. */
  confidenceFloor: number;
  /** Consecutive AI replies allowed before escalating to a human. */
  maxAiTurns: number;
  /** Human queue per intent. */
  queues: Record<Intent, string>;
  /** First-response SLA in minutes per urgency. */
  sla: Record<Urgency, number>;
}

export interface HandoffTicket {
  id: string;
  queue: string;
  priority: Urgency;
  slaMinutes: number;
  /** One-line summary for the receiving agent. */
  summary: string;
  createdAt: string;
}
