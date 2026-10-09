import { beforeEach, describe, expect, it } from "vitest";
import { __resetHandoffCounter } from "../src/core/handoff";
import { __resetStore } from "../src/core/store";
import { handleMessage } from "../src/service";

beforeEach(() => {
  __resetStore();
  __resetHandoffCounter();
});

describe("service (end to end through the core)", () => {
  it("auto-replies to a confident billing question", async () => {
    const result = await handleMessage({
      channel: "chat",
      brandId: "harbourhost",
      payload: { text: "I have a question about my invoice and payment" },
    });
    expect(result.route).toBe("auto");
    expect(result.reply).toBeTruthy();
    expect(result.handoff).toBeUndefined();
    expect(result.state).toBe("ai_handling");
  });

  it("hands off a cancellation and returns a ticket, not a reply", async () => {
    const result = await handleMessage({
      channel: "chat",
      brandId: "harbourhost",
      payload: { text: "Please cancel my account" },
    });
    expect(result.route).toBe("human");
    expect(result.reply).toBeUndefined();
    expect(result.handoff?.queue).toBe("hh-retention");
    expect(result.state).toBe("awaiting_human");
  });

  it("keeps one conversation across turns and escalates after the AI turn limit", async () => {
    const first = await handleMessage({
      channel: "chat",
      brandId: "lanternreach",
      payload: { text: "can you send me pricing for the upgrade plan" },
    });
    expect(first.route).toBe("auto");

    let last = first;
    for (let i = 0; i < 5; i += 1) {
      last = await handleMessage({
        conversationId: first.conversationId,
        channel: "chat",
        brandId: "lanternreach",
        payload: { text: "can you send me pricing for the upgrade plan" },
      });
    }
    expect(last.route).toBe("human");
    expect(last.conversationId).toBe(first.conversationId);
  });

  it("treats email through the same policy as chat", async () => {
    const result = await handleMessage({
      channel: "email",
      brandId: "harbourhost",
      payload: {
        subject: "Cancellation",
        text: "Please cancel.\n\nOn Mon, 1 Jan 2026, Support wrote:\n> old",
      },
    });
    expect(result.route).toBe("human");
    expect(result.handoff?.queue).toBe("hh-retention");
  });

  it("rejects an empty chat message", async () => {
    await expect(
      handleMessage({ channel: "chat", brandId: "harbourhost", payload: { text: "   " } }),
    ).rejects.toThrow();
  });
});
