import type { BrandConfig, Classification, Conversation } from "../core/types";

/**
 * Reply generation.
 *
 * The AI only ever runs *after* routing says it may (route === "auto"). It is
 * isolated here so the routing logic can be tested with no model and no API
 * key, and so a different provider is a one-file change.
 *
 * With OPENAI_API_KEY set it calls the model; without one it falls back to a
 * deterministic template, so the whole prototype runs offline and the test
 * suite never needs a key.
 */

export function buildSystemPrompt(brand: BrandConfig, classification: Classification): string {
  return [
    `You are a customer-care assistant for ${brand.name}.`,
    `Tone: ${brand.tone}.`,
    `The customer's message was classified as intent="${classification.intent}"`,
    `with urgency="${classification.urgency}".`,
    "Answer helpfully and briefly in plain language.",
    "If you are unsure, or the customer asks for something you cannot do,",
    "say so and offer to pass them to a human — never invent policy, prices or timescales.",
    "Never ask for passwords, full card numbers, or other sensitive credentials.",
  ].join(" ");
}

function transcript(conversation: Conversation): { role: "user" | "assistant"; content: string }[] {
  return conversation.messages
    .filter((m) => m.speaker === "customer" || m.speaker === "ai")
    .map((m) => ({ role: m.speaker === "customer" ? "user" : "assistant", content: m.text }));
}

function templateReply(brand: BrandConfig, classification: Classification): string {
  const openers: Record<Classification["intent"], string> = {
    billing: "Thanks for flagging the billing query",
    technical: "Thanks for reporting the technical issue",
    cancellation: "Thanks for letting us know",
    sales: "Thanks for your interest",
    complaint: "Thank you for telling us",
    account: "Thanks for getting in touch about your account",
    other: "Thanks for your message",
  };
  return (
    `${openers[classification.intent]}. ` +
    `I'm the ${brand.name} assistant. ` +
    `I've noted this as a ${classification.intent} request and can help from here. ` +
    `(Set OPENAI_API_KEY to enable model-written replies; this is the offline fallback.)`
  );
}

export async function generateReply(
  conversation: Conversation,
  brand: BrandConfig,
  classification: Classification,
): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return templateReply(brand, classification);

  const { default: OpenAI } = await import("openai");
  const client = new OpenAI({ apiKey });
  const completion = await client.chat.completions.create({
    model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
    temperature: 0.3,
    messages: [
      { role: "system", content: buildSystemPrompt(brand, classification) },
      ...transcript(conversation),
    ],
  });
  const reply = completion.choices[0]?.message?.content?.trim();
  return reply && reply.length > 0 ? reply : templateReply(brand, classification);
}
