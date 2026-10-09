# 03 — Conversation flows

Two channels, one core. The channel decides how a message is parsed and
rendered; the core decides what happens to it.

## 1. Intent taxonomy

Deliberately small and operational — each intent maps to a queue and a policy.

| Intent | Example cues | Default queue suffix |
|---|---|---|
| `billing` | invoice, charged, refund, overcharged | `-billing` |
| `technical` | error, down, 500, DNS, can't log in | `-technical` |
| `cancellation` | cancel, terminate, not renewing | `-retention` |
| `sales` | pricing, upgrade, demo, quote | `-sales` |
| `complaint` | unacceptable, escalate, ombudsman | `-escalations` |
| `account` | password, reset, 2FA, permissions | `-account` |
| `other` | everything else | `-general` |

## 2. Chat flow

```mermaid
sequenceDiagram
  participant U as Customer
  participant W as Chat widget
  participant S as Service (core)
  participant M as AI
  U->>W: message
  W->>S: POST /api/chat {text}
  S->>S: classify → route
  alt route = auto
    S->>M: generate reply (brand tone)
    M-->>S: reply
    S-->>W: reply + reason
  else route = ai_assist
    S-->>W: "a colleague will reply" + handoff ticket
  else route = human
    S-->>W: "a colleague will reply" + handoff ticket
  end
```

## 3. Email flow

```mermaid
flowchart LR
  E[Inbound email] --> P[parseEmail: strip quoted history + signature]
  P --> K[Keep subject as a signal, raw fields in meta]
  K --> S[Same core: classify → route]
  S --> D{Auto?}
  D -->|yes| R[Reply sent as an email reply]
  D -->|no| H[Handoff ticket to the intent queue]
```

The only email-specific logic is `stripQuoted` — removing quoted history and
signatures so the classifier sees the new content. Everything downstream is
shared with chat.

## 4. Conversation state machine

```mermaid
stateDiagram-v2
  [*] --> new
  new --> ai_handling: route=auto
  new --> awaiting_human: route=human or ai_assist
  ai_handling --> ai_handling: route=auto
  ai_handling --> awaiting_human: turn limit / urgency / sentiment
  awaiting_human --> human_handling: agent replies
  human_handling --> resolved: customer confirms
  ai_handling --> resolved: customer confirms
```

Only one handoff ticket is ever raised per conversation: once a human owns it,
later messages do not create new tickets (see `handleInbound` in
`src/core/conversation.ts`).

## 5. Design decisions

- **Chat and email share one core.** A new channel adds an adapter, not a
  parallel policy.
- **The AI replies only after routing says it may.** The model never decides
  whether it is allowed to answer.
- **Unsummarised context is never cut.** Unlike a compaction strategy, a
  handoff carries the real thread; the one-line summary is for triage only.
- **No sensitive data in the AI path.** The system prompt forbids requesting
  credentials; this is written down so it can be tested and audited.
