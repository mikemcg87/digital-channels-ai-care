import type { InboundMessage } from "./types";

/** Chat inbound: already conversational, so parsing is near-trivial. */
export function parseChat(payload: { text?: unknown }): InboundMessage {
  const text = typeof payload?.text === "string" ? payload.text.trim() : "";
  if (!text) throw new Error("chat message has no text");
  return { text };
}
