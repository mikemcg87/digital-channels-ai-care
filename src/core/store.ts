import { newConversation } from "./conversation";
import type { Channel, Conversation } from "./types";

/**
 * In-memory conversation store.
 *
 * Fine for a single-process prototype and for tests. A real deployment would
 * swap this for Redis or a database; the interface is intentionally tiny so
 * that swap is a one-file change.
 */

const conversations = new Map<string, Conversation>();

export function getConversation(id: string): Conversation | undefined {
  return conversations.get(id);
}

export function createConversation(brandId: string, channel: Channel): Conversation {
  const conversation = newConversation(brandId, channel);
  conversations.set(conversation.id, conversation);
  return conversation;
}

export function getOrCreateConversation(
  id: string | undefined,
  brandId: string,
  channel: Channel,
): Conversation {
  if (id) {
    const existing = conversations.get(id);
    if (existing) return existing;
  }
  return createConversation(brandId, channel);
}

export function allConversations(): Conversation[] {
  return [...conversations.values()];
}

/** Test helper. */
export function __resetStore(): void {
  conversations.clear();
}
