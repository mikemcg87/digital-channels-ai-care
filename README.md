# Digital Channels AI Care

A design pack **and** a runnable prototype for AI-powered **email and chat**
customer care: how enquiries are classified, when the AI answers, when it drafts
for a human, and when and how it hands off — configurable per brand.

This is a portfolio piece for a **Business/Technical Analyst, Digital Channels**
role. It is deliberately weighted towards the analysis: requirements, journeys,
conversation flows, routing/handoff/escalation, user stories and acceptance
criteria — with a small, tested implementation that proves the policy is real
and buildable, not just written down.

> Illustrative and fictional. No real company's data, policy or code is
> included, and nothing here is derived from a specific employer.

## The problem

Several brands, each with its own inbox and web chat, answer everything by hand.
Routine questions wait behind complaints, answers vary by brand, handoffs lose
context, and there is no way to see which enquiries could have been resolved
automatically.

## The approach

One **channel-agnostic core**, configured per brand:

- **Classify** every inbound message into a small operational intent taxonomy.
- **Route** it by ordered policy: hard business rules first, then urgency,
  sentiment, a turn budget, and finally model confidence.
- **Answer, draft, or hand off** — three distinct outcomes, each explainable.
- **Configure, don't fork** — everything a brand needs to differ by is data.

| Route | Meaning |
|---|---|
| `auto` | the AI answers on its own |
| `ai_assist` | the AI drafts; a human approves before sending |
| `human` | a handoff ticket goes to the intent's queue with a priority and SLA |

Routing rules, in priority order (see [`docs/04`](docs/04-routing-handoff-escalation.md)):

1. intent is human-only for the brand → **human**
2. urgency is high → **human**
3. sentiment is negative → **human**
4. the AI has used its turn budget → **human**
5. confidence below the brand floor → **ai_assist**
6. otherwise → **auto**

## What's in the box

```
docs/                                   the analyst deliverable
  01-requirements.md                    business / customer / operational / NFRs
  02-current-state-journeys.md          as-is journey → gaps and root causes
  03-conversation-flows.md              email + chat flows, intent taxonomy, states
  04-routing-handoff-escalation.md      the policy this code implements
  05-user-stories-acceptance-criteria.md stories → AC → test, traceable
  06-test-scenarios.md                  automated + manual + explicitly not covered
  07-multi-brand-rollout.md             shared vs per-brand; phased rollout
  08-testing-results.md                 results, bugs found, refinements, limits
src/
  core/          types, brands (policy), intent, routing, handoff, conversation, store
  channels/      chat + email adapters (email strips quoted history)
  ai/            reply generation (offline fallback when no key)
  app/           Next.js demo page, embeddable widget, /api/chat, /api/email
tests/           Vitest: classification, routing, handoff, email, end-to-end
```

## Run it

```bash
npm install
npm run dev            # http://localhost:3000  (demo, shows the routing decision)
                       # http://localhost:3000/embed  (the customer-facing widget)
```

No API key is required: without `OPENAI_API_KEY` the AI path returns a safe
templated reply, so the whole thing runs offline. Set the key to get
model-written replies in the brand's tone.

```bash
npm test               # 23 tests, no model and no network needed
npm run typecheck
npm run build
npm run verify         # all three
```

## Try the policy

In the demo page, pick a brand and send:

- `I have a question about my invoice and payment` → `auto`
- `Please cancel my account` → `human` (retention queue)
- `My site is down with a 500 error` → `human` (urgency)
- `I'm frustrated with the invoice you sent me` → `human` (sentiment)
- `hello there` → `ai_assist` (low confidence)

The same cancellation text behaves differently across the two brands **without a
code change** — that is the multi-brand claim, demonstrated.

## Design decisions

- **Routing is not the model's job.** Business rules are deterministic, cheap,
  auditable and testable; the model is called only on the `auto` path.
- **`ai_assist` is a first-class outcome.** It is where much of the time saving
  lives for work the AI cannot fully own.
- **Chat and email share one core.** A new channel adds an adapter, not a
  parallel policy; the only email-specific logic is stripping quoted history.
- **Explainable by construction.** Every decision carries a reason, surfaced in
  the API and the UI.
- **Safe degradation.** No model → a templated reply, never silence or invented
  policy.

## Limits

Prototype and design pack, not a deployed system: no CRM integration, no
persistence beyond the process, no auth, and reply *quality* is not evaluated
here (that needs a labelled set and an eval harness). See
[`docs/08`](docs/08-testing-results.md) for the honest list and the next steps.

## Licence

MIT — see [LICENSE](LICENSE).
