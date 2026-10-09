/** Shared types for the UI. Kept in sync with src/service.ts by hand. */

export type Route = "auto" | "ai_assist" | "human";

export interface Turn {
  speaker: "customer" | "ai" | "system";
  text: string;
  route?: Route;
  reason?: string;
}

export interface Handoff {
  id: string;
  queue: string;
  priority: string;
  slaMinutes: number;
  summary: string;
}

export interface ApiResult {
  conversationId: string;
  state: string;
  route: Route;
  reason: string;
  reply?: string;
  handoff?: Handoff;
  error?: string;
}
