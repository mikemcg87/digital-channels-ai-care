# 08 — Testing results

## 1. Automated suite

Run with `npm test` (Vitest). Latest run:

```
 ✓ tests/intent.test.ts     (6 tests)
 ✓ tests/routing.test.ts    (6 tests)
 ✓ tests/handoff.test.ts    (2 tests)
 ✓ tests/email.test.ts      (4 tests)
 ✓ tests/service.test.ts    (5 tests)

 Test Files  5 passed (5)
      Tests  23 passed (23)
```

Type checking (`tsc --noEmit`) and the production build (`next build`) both
pass; the build exposes `/`, `/embed`, `/api/chat`, `/api/email`.

## 2. What the tests actually prove

| Area | Evidence | What it demonstrates |
|---|---|---|
| Classification | 6 tests | intents and urgency are detected with explainable reasons |
| Routing policy | 6 tests | each rule fires in priority order, per brand |
| Handoff | 2 tests | tickets carry queue, priority, SLA and summary |
| Channel parity | 4 tests | email is normalised before it reaches the core |
| End-to-end | 5 tests | whole conversations route correctly through one entry point |

## 3. Bugs found and fixed during development

- **Rule order.** An early draft of the sentiment test expected the *sentiment*
  reason for a message that was also a human-only intent. The test was wrong:
  rule 1 (hard policy) must beat rule 3 (sentiment). Fixed by choosing a
  message that isolates the sentiment rule — and the ordering is now explicit
  in `docs/04`.
- **Confidence boundary.** A single matched keyword produced a confidence too
  close to the floor. Confidence is now damped and rounded, so a weak match
  lands on `ai_assist` rather than a confident wrong answer.
- **Vitest vs Tailwind.** The test runner tried to load the Next/Tailwind
  PostCSS pipeline. Disabled for tests so the logic suite stays Node-only and
  fast.

## 4. Refinements I would make next

1. **Labelled set.** Score reply quality, not just routing, against a set of
   real (anonymised) enquiries.
2. **Classifier upgrade.** Wrap the rules classifier with an LLM classifier
   behind the same `Classification` shape, and A/B the routing outcomes.
3. **Multi-intent messages.** A message can be two things ("cancel *and* I was
   overcharged"); the current single-label model needs a primary/secondary split.
4. **Threading.** Link follow-up emails to their conversation (via `In-Reply-To`)
   rather than treating each as new.
5. **Persistence.** Replace the in-memory store with Redis so handoffs survive a
   restart and scale horizontally.
6. **Observability.** Emit the routing reason as a metric, so deflection and
   misroutes can be tracked per brand over time.

## 5. Honest limits

This is a prototype and a design pack, not a deployed system. It has no CRM
integration, no persistence beyond the process, no authentication, and no
evaluation of reply *quality*. The value is in the analysis, the policy, and a
working, tested skeleton those decisions fit into.
