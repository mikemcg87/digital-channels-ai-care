# 06 — Test scenarios

Two layers, deliberately kept apart:

- **Unit / logic tests (automated).** Pure functions: classification, routing,
  handoff, email parsing. No model, no network — they run in milliseconds and
  in CI.
- **Flow / acceptance scenarios (automated through the service).** Whole
  conversations through `handleMessage`, which is what a manual tester would do
  against the API.

## Automated scenarios

| ID | Scenario | Expected | Where |
|---|---|---|---|
| T-01 | Duplicate charge on an invoice | intent `billing`, urgency `high` | `intent.test.ts` |
| T-02 | "Please cancel my account" | intent `cancellation` | `intent.test.ts` |
| T-03 | "My website is down with a 500 error" | intent `technical`, urgency `high` | `intent.test.ts` |
| T-04 | Unacceptable/useless wording | intent `complaint`, sentiment `negative` | `intent.test.ts` |
| T-05 | "hello there" | intent `other`, confidence 0 | `intent.test.ts` |
| T-06 | Cancellation on a strict brand | route `human`, queue `hh-retention` | `routing.test.ts` |
| T-07 | Pricing question on a self-serve brand | route `auto` | `routing.test.ts` |
| T-08 | Outage despite a clear intent | route `human` (urgency) | `routing.test.ts` |
| T-09 | Angry message, non-complaint intent | route `human` (sentiment) | `routing.test.ts` |
| T-10 | Turn budget exhausted | route `human` | `routing.test.ts` |
| T-11 | Below the confidence floor | route `ai_assist` | `routing.test.ts` |
| T-12 | Handoff ticket shape | queue/priority/SLA/summary correct | `handoff.test.ts` |
| T-13 | Summary content | contains intent and last customer text | `handoff.test.ts` |
| T-14 | Quoted email history | stripped | `email.test.ts` |
| T-15 | Email signature | stripped | `email.test.ts` |
| T-16 | Subject as signal | prepended to text; raw fields kept in meta | `email.test.ts` |
| T-17 | Email with no new content | rejected | `email.test.ts` |
| T-18 | Routine billing on chat | `auto` + reply, no handoff | `service.test.ts` |
| T-19 | Cancellation on chat | `human` + ticket, no reply | `service.test.ts` |
| T-20 | Multi-turn until the turn limit | escalates, same conversation id | `service.test.ts` |
| T-21 | Email cancellation | `human`, same queue as chat | `service.test.ts` |
| T-22 | Empty chat message | rejected | `service.test.ts` |

## Manual / exploratory scenarios (for a human tester)

1. **Brand differentiation.** Run the same cancellation text on both brands;
   confirm the queue and reason change with no code change.
2. **Tone.** On `auto`, confirm the reply reads in the brand's voice.
3. **Handoff prose.** Confirm the customer-facing line is honest ("a colleague
   will reply") and does not promise a time the system cannot keep.
4. **Confidence boundary.** Feed ambiguous text and confirm it lands on
   `ai_assist` rather than a confident wrong answer.
5. **Long thread.** Paste a long email thread and confirm only the new content
   is classified (check the reason, not just the outcome).
6. **Offline mode.** Run with no `OPENAI_API_KEY` and confirm safe templated
   replies, never an error shown to the customer.

## Not covered (and why)

- **Model output quality.** Asserted structurally, not semantically; scoring
  reply quality needs a labelled set and belongs in an eval harness.
- **CRM delivery.** The ticket is returned, not delivered; integration is out
  of scope for the prototype.
- **Load and latency.** Single-process store; not a performance test.
