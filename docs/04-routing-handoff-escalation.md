# 04 — Routing, handoff and escalation

This document is the specification the code implements
(`src/core/routing.ts`, `src/core/handoff.ts`). Rules are ordered; the first
that matches wins, and each returns a one-line reason.

## 1. Routing rules

| # | Condition | Route | Why |
|---|---|---|---|
| 1 | intent is human-only for the brand | **human** | hard business policy beats model confidence |
| 2 | urgency is high | **human** | outages, duplicate charges, suspected fraud |
| 3 | sentiment is negative | **human** | retention risk; a person should own the reply |
| 4 | AI has used its turn budget | **human** | prevent loops and customer frustration |
| 5 | confidence below the brand floor | **ai_assist** | a human approves a draft rather than writing from scratch |
| 6 | otherwise | **auto** | confident, in-policy, routine |

`ai_assist` is a distinct outcome, not a synonym for "human": the work is
drafted by AI and approved by a person, which is where most of the time saving
sits for enquiries the AI cannot fully own.

## 2. Escalation matrix

Priority follows urgency; the SLA follows priority and is set per brand.

| Urgency | Signal | Default SLA (illustrative) |
|---|---|---|
| high | urgent terms, outages, duplicate charge, fraud | 15 min |
| normal | a clear intent with no urgency markers | 4 h |
| low | positive/acknowledgement tone | 24 h |

## 3. Handoff ticket

A handoff produces a ticket the receiving agent can act on without reading the
whole thread:

```
id        HO-<base36>-<n>
queue     brand.queues[intent]           e.g. hh-retention
priority  classification.urgency
sla       brand.sla[priority]
summary   intent=… | urgency=… | sentiment=… | turns=… | last: "…"
```

The `summary` field exists specifically to satisfy BR-5 (a handoff must not
make the customer repeat themselves). The full transcript stays in the
conversation record for reference.

## 4. Why routing lives outside the model

- **Auditability.** Rule 1 in particular is a compliance control: it must hold
  even if the model is confident, and it must be provable in a test.
- **Cost and latency.** Classification and routing are deterministic and free;
  the model is only called on the `auto` path.
- **Replaceability.** Swapping the classifier for an LLM only requires the new
  classifier to return the same `Classification` shape; routing is unchanged.

## 5. Configuration surface (per brand)

```ts
{
  humanIntents:  Intent[]                 // never auto-resolved
  confidenceFloor: number                 // below this → ai_assist
  maxAiTurns: number                      // above this → human
  queues: Record<Intent, string>          // where handoffs land
  sla: Record<Urgency, number>            // minutes
  tone: string                            // passed to the model
}
```

Everything a brand needs to differ by is configuration; nothing else changes.
