# 01 — Requirements

> Illustrative requirements for a fictional deployment, written to show the
> analysis behind the prototype. Not derived from any real company.

## 1. Context and goal

The group runs several customer-facing brands, each with its own support inbox
and web chat. Today, a small team answers everything by hand in the brand's
contact-centre/CRM tool. Response times vary by brand, the same question is
answered differently by different people, and there is no shared view of which
enquiries could have been resolved automatically.

**Goal:** introduce AI-assisted email and chat care that resolves routine
enquiries automatically, drafts the rest for a human, and escalates anything
sensitive — consistently across brands, with per-brand control where it matters.

**Why now:** volume is growing faster than the support headcount, and the
brands answer the same categories of question in slightly different ways. A
single channel-agnostic core, configured per brand, removes the duplication.

## 2. Stakeholders

| Stakeholder | Interest |
|---|---|
| Head of Customer Care | resolution rate, CSAT, headcount pressure |
| Brand owners | their tone, their policies, their customers |
| Support agents | fewer repetitive tickets, clean handoffs, no blame for AI |
| Contact-centre/CRM owner | how the AI hands work into the existing queue |
| AI/technical team | how intents, routing and handoff are defined and tested |
| Compliance / privacy | no sensitive data in the AI path; auditability |

## 3. Business requirements

- **BR-1** Routine enquiries across all brands are answered automatically when
  policy allows, without an agent in the loop.
- **BR-2** Per-brand policy is configurable without code changes: which intents
  are human-only, the automation confidence floor, and the escalation limit.
- **BR-3** Every routing decision is explainable in one line, for audit and for
  agent trust.
- **BR-4** Sensitive or high-risk interactions (cancellations, complaints,
  suspected fraud) always reach a human.
- **BR-5** Handoffs carry enough context that the agent never re-asks the
  customer what they already said.

## 4. Customer requirements

- **CR-1** A fast, accurate answer in the channel the customer chose (email or
  chat), in the brand's tone.
- **CR-2** A clear, honest path to a human when the AI cannot help — not a loop.
- **CR-3** The customer is never asked for passwords, full card numbers, or
  other credentials.
- **CR-4** Email replies read as a normal reply to their email, not a bot dump.

## 5. Operational requirements

- **OR-1** Intents map to human queues, so work lands with the right team.
- **OR-2** Priority and first-response SLA follow from urgency, per brand.
- **OR-3** The AI gets a bounded number of turns before escalation, so it cannot
  loop or burn the customer's patience.
- **OR-4** Both channels share one core: adding a channel must not duplicate
  routing logic.

## 6. Non-functional requirements

- **NFR-1 (testability)** Routing, handoff and channel parsing are pure logic,
  testable with no model and no network.
- **NFR-2 (safety)** Absence of a model must degrade to a safe, templated reply,
  never to silence or an invented policy.
- **NFR-3 (portability)** The channel adapters and the model provider are
  replaceable in one file each.
- **NFR-4 (explainability)** Every decision carries a machine-checkable reason.

## 7. Assumptions

- A contact-centre/CRM exists to receive handoffs (mocked here by a ticket).
- Per-brand tone and policy can be expressed as configuration.
- A single intent taxonomy is good enough to start; it will be refined from
  real transcripts after launch.

## 8. Out of scope

- Voice/telephony channels.
- Actual CRM integration, agent desktop, and workforce management.
- Model selection and fine-tuning (the model is behind an adapter).
- Multilingual handling beyond the single-language assumption above.

## 9. Success measures

| Measure | Target (illustrative) |
|---|---|
| Auto-resolution rate | ≥ 40% of routine enquiries |
| Median first response (auto) | < 1 minute |
| Handoff re-ask rate | ~0 (all context carried) |
| Escalation correctness | no sensitive intent auto-answered (audited) |
| CSAT vs baseline | no regression |
