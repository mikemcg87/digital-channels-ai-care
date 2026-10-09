import { describe, expect, it } from "vitest";
import { getBrand } from "../src/core/brands";
import { newConversation } from "../src/core/conversation";
import { classify } from "../src/core/intent";
import { route } from "../src/core/routing";
import type { Classification } from "../src/core/types";

const harbour = getBrand("harbourhost");
const lantern = getBrand("lanternreach");

const weakMatch: Classification = {
  intent: "other",
  confidence: 0.2,
  sentiment: "neutral",
  urgency: "normal",
  reasons: ["test"],
};

describe("routing", () => {
  it("sends a cancellation to the retention queue for a strict brand", () => {
    const conversation = newConversation("harbourhost", "chat");
    const decision = route(conversation, classify("I want to cancel my account"), harbour);
    expect(decision.route).toBe("human");
    expect(decision.queue).toBe("hh-retention");
    expect(decision.slaMinutes).toBe(240);
  });

  it("auto-answers a confident sales question for the self-serve brand", () => {
    const conversation = newConversation("lanternreach", "chat");
    const decision = route(conversation, classify("can you send me pricing for the upgrade plan"), lantern);
    expect(decision.route).toBe("auto");
  });

  it("escalates anything urgent, even when the intent is clear", () => {
    const conversation = newConversation("lanternreach", "chat");
    const decision = route(conversation, classify("my site is down with a 500 error"), lantern);
    expect(decision.route).toBe("human");
    expect(decision.reason).toContain("urgency");
  });

  it("escalates a negative-sentiment message rather than auto-replying", () => {
    const conversation = newConversation("lanternreach", "chat");
    // Billing, not complaint — so this exercises the sentiment rule, not the
    // human-only-intent rule that complaints would trigger first.
    const decision = route(conversation, classify("I'm frustrated with the invoice you sent me"), lantern);
    expect(decision.route).toBe("human");
    expect(decision.reason).toContain("negative sentiment");
  });

  it("escalates once the AI has used its turns", () => {
    const conversation = newConversation("lanternreach", "chat");
    conversation.aiTurns = lantern.maxAiTurns;
    const decision = route(conversation, classify("can you send me pricing for the upgrade plan"), lantern);
    expect(decision.route).toBe("human");
    expect(decision.reason).toContain("without resolving");
  });

  it("falls back to ai_assist below the brand's confidence floor", () => {
    const conversation = newConversation("harbourhost", "chat");
    expect(route(conversation, weakMatch, harbour).route).toBe("ai_assist");
  });
});
