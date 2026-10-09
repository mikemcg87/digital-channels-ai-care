# 05 — User stories and acceptance criteria

Stories are grouped by outcome. Each acceptance criterion names the test that
enforces it, so requirements trace straight to executable checks.

## US-1 — Auto-resolve a routine enquiry
*As a customer, I want a fast, accurate answer without waiting for a person.*

- **AC-1.1** Given a confident billing question, when it arrives on chat, then
  the AI replies and no handoff is raised. → `tests/service.test.ts`
- **AC-1.2** The reply follows the brand's tone, expressed in the system prompt
  handed to the model. → `src/ai/reply.ts::buildSystemPrompt`
- **AC-1.3** With no model configured, the system returns a safe templated reply
  rather than silence. → `src/ai/reply.ts::templateReply`

## US-2 — Never auto-answer sensitive intents
*As a brand owner, I want cancellations and complaints handled by a person.*

- **AC-2.1** Given a cancellation on a brand where `cancellation` is
  human-only, when it arrives, then the route is `human` and the queue is
  `hh-retention`. → `tests/routing.test.ts`, `tests/service.test.ts`
- **AC-2.2** The reason states that the intent is human-only. →
  `tests/routing.test.ts`

## US-3 — Escalate anything urgent
*As a customer, I want an outage or a duplicate charge seen immediately.*

- **AC-3.1** Given high urgency, when it arrives, then the route is `human`
  even if the intent is clear. → `tests/routing.test.ts`
- **AC-3.2** The SLA is the brand's high-urgency value (15 min). →
  `docs/04`, `tests/handoff.test.ts`

## US-4 — Protect the customer relationship
*As a care lead, I want angry customers with a person quickly.*

- **AC-4.1** Given negative sentiment, when it arrives, then the route is
  `human` with reason "negative sentiment". → `tests/routing.test.ts`

## US-5 — Bound the AI
*As an operations lead, I don't want the AI to loop.*

- **AC-5.1** Given the AI has used `maxAiTurns`, when another message arrives,
  then the route is `human`. → `tests/routing.test.ts`, `tests/service.test.ts`

## US-6 — Draft when unsure
*As an agent, I want a draft rather than a blank page.*

- **AC-6.1** Given confidence below the brand floor, when it arrives, then the
  route is `ai_assist`, not `auto`. → `tests/routing.test.ts`

## US-7 — Clean handoffs
*As an agent, I don't want to re-ask the customer what they already said.*

- **AC-7.1** A handoff produces a ticket with queue, priority, SLA and a
  one-line summary. → `tests/handoff.test.ts`
- **AC-7.2** The summary contains the intent and the latest customer text. →
  `tests/handoff.test.ts`

## US-8 — One core, two channels
*As a technology owner, I want new channels without duplicated policy.*

- **AC-8.1** An email with quoted history is stripped to its new content before
  classification. → `tests/email.test.ts`
- **AC-8.2** An email cancellation routes exactly as a chat cancellation does. →
  `tests/service.test.ts`

## US-9 — Explainable decisions
*As an auditor, I want to know why each decision was made.*

- **AC-9.1** Every classification carries human-readable reasons. →
  `tests/intent.test.ts`
- **AC-9.2** Every routing decision carries a reason, returned to the caller and
  shown in the UI. → `tests/routing.test.ts`, `src/app/page.tsx`

## US-10 — Demonstrate the positive path
*As a stakeholder, I want to see it working.*

- **AC-10.1** The demo page shows the route and reason under every reply. →
  `src/app/page.tsx`
- **AC-10.2** Switching brand changes policy outcomes with no code change. →
  `src/core/brands.ts`, demo brand selector
