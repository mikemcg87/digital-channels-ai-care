import { generateReply } from "./ai/reply";
import { parseChat } from "./channels/chat";
import { parseEmail, type EmailPayload } from "./channels/email";
import { getBrand } from "./core/brands";
import { addMessage, handleInbound } from "./core/conversation";
import { getOrCreateConversation } from "./core/store";
import type { Channel, HandoffTicket } from "./core/types";

/**
 * The one entry point every channel uses. It parses the channel payload,
 * routes it through the core, and — only when routing permits — asks the model
 * for a reply. Channels and endpoints stay thin; the policy lives in the core.
 */

export interface ServiceInput {
  conversationId?: string;
  brandId?: string;
  channel: Channel;
  payload: unknown;
}

export interface ServiceResult {
  conversationId: string;
  state: string;
  route: string;
  reason: string;
  /** Present only when route is "auto". */
  reply?: string;
  handoff?: HandoffTicket;
}

const DEFAULT_BRAND = "harbourhost";

export async function handleMessage(input: ServiceInput): Promise<ServiceResult> {
  const brandId = input.brandId ?? DEFAULT_BRAND;
  const brand = getBrand(brandId);
  const conversation = getOrCreateConversation(input.conversationId, brandId, input.channel);

  const inbound =
    input.channel === "email"
      ? parseEmail((input.payload ?? {}) as EmailPayload)
      : parseChat((input.payload ?? {}) as { text?: unknown });

  const { decision, classification, autoReply } = handleInbound(conversation, inbound.text);

  if (!autoReply) {
    return {
      conversationId: conversation.id,
      state: conversation.state,
      route: decision.route,
      reason: decision.reason,
      handoff: conversation.handoff,
    };
  }

  const reply = await generateReply(conversation, brand, classification);
  addMessage(conversation, "ai", reply);

  return {
    conversationId: conversation.id,
    state: conversation.state,
    route: decision.route,
    reason: decision.reason,
    reply,
  };
}
