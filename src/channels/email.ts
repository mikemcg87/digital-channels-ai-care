import type { InboundMessage } from "./types";

/**
 * Email inbound.
 *
 * Email is messier than chat: the body usually carries the whole quoted thread
 * and a signature. Feeding that to a classifier dilutes the signal and pushes
 * the token cost up, so we strip it and keep the thread position as metadata
 * instead. This is the kind of channel-specific detail that has to be designed
 * for, not assumed away.
 */

export interface EmailPayload {
  from?: string;
  subject?: string;
  text?: string;
}

const QUOTE_START = /^\s*On .+ wrote:\s*$/i;
const ORIGINAL_MESSAGE = /^\s*-{2,}\s*original message\s*-{2,}\s*$/i;
const SIGNATURE = /^--\s*$/;

/** Remove quoted history and the signature block, keeping the new content. */
export function stripQuoted(text: string): string {
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  const kept: string[] = [];
  for (const line of lines) {
    if (QUOTE_START.test(line) || ORIGINAL_MESSAGE.test(line) || SIGNATURE.test(line)) break;
    if (/^\s*>/.test(line)) continue; // quoted line
    kept.push(line);
  }
  return kept.join("\n").trim();
}

export function parseEmail(payload: EmailPayload): InboundMessage {
  const body = stripQuoted(typeof payload.text === "string" ? payload.text : "");
  if (!body) throw new Error("email has no new content after stripping quoted text");
  const meta: Record<string, string> = {};
  if (payload.from) meta.from = payload.from;
  if (payload.subject) meta.subject = payload.subject;
  // Subject is often the best one-line signal in an email, so prepend it to the
  // text handed to the classifier — while meta keeps the raw fields.
  const text = payload.subject ? `${payload.subject} — ${body}` : body;
  return { text, meta };
}
