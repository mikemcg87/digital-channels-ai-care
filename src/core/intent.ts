import type { Classification, Intent, Sentiment, Urgency } from "./types";

/**
 * Rules-based intent classifier.
 *
 * Deliberately deterministic and dependency-free: it runs in tests without a
 * model, gives an explainable reason for every decision, and acts as the
 * fallback when the LLM classifier is unavailable. An LLM classifier can wrap
 * this later and only needs to return the same Classification shape.
 *
 * The thresholds (confidenceFloor etc.) live in the brand config, not here.
 */

interface IntentRule {
  intent: Intent;
  terms: string[];
  /** Contribution of each matched term to the intent score. */
  weight: number;
}

const RULES: IntentRule[] = [
  {
    intent: "billing",
    weight: 2,
    terms: [
      "invoice", "invoiced", "billing", "bill", "charged", "charge", "payment",
      "payment failed", "card declined", "refund", "overcharged", "vat", "receipt",
      "subscription fee", "price increase", "direct debit",
    ],
  },
  {
    intent: "technical",
    weight: 2,
    terms: [
      "error", "bug", "broken", "not working", "doesn't work", "does not work",
      "down", "outage", "timeout", "500", "404", "dns", "ssl", "certificate",
      "email not sending", "can't log in", "cannot log in", "slow", "crash",
      "api", "webhook", "cron", "database",
    ],
  },
  {
    intent: "cancellation",
    weight: 3,
    terms: [
      "cancel", "cancellation", "close my account", "close the account",
      "terminate", "end my contract", "downgrade", "stop the subscription",
      "not renewing", "won't renew", "transfer away", "leave",
    ],
  },
  {
    intent: "sales",
    weight: 2,
    terms: [
      "pricing", "quote", "upgrade", "plan", "demo", "trial", "buy", "purchase",
      "discount", "enterprise", "seats", "add-on", "interested in",
    ],
  },
  {
    intent: "complaint",
    weight: 3,
    terms: [
      "complaint", "unacceptable", "terrible", "awful", "disgusted", "appalling",
      "ridiculous", "useless", "furious", "angry", "scam", "worst", "escalate",
      "speak to a manager", "ombudsman", "legal action",
    ],
  },
  {
    intent: "account",
    weight: 2,
    terms: [
      "password", "reset", "locked out", "2fa", "two-factor", "mfa", "username",
      "profile", "change my email", "update my details", "permissions", "access",
      "add a user", "remove a user",
    ],
  },
];

const URGENT_TERMS = [
  "urgent", "asap", "immediately", "right away", "today", "down", "outage",
  "not working", "broken", "charged twice", "duplicate charge", "unauthorised",
  "unauthorized", "fraud", "fraudulent", "data loss", "lost data", "security",
];

const NEGATIVE_TERMS = [
  "angry", "furious", "unacceptable", "terrible", "awful", "disappointed",
  "frustrated", "ridiculous", "useless", "appalling", "fed up", "scam",
  "worst", "disgusted",
];

const POSITIVE_TERMS = [
  "thanks", "thank you", "cheers", "great", "perfect", "love", "appreciate",
  "helpful", "brilliant", "awesome",
];

function countTerm(haystack: string, term: string): number {
  // Word-ish boundary match; keeps "cancel" from matching inside "cancelled"? No
  // — it should match. \b still matches "cancelled", which is what we want, and
  // stops "api" matching inside "capital".
  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(`\\b${escaped}\\b`, "gi");
  return (haystack.match(re) ?? []).length;
}

function normalise(text: string): string {
  return text.toLowerCase().replace(/\s+/g, " ").trim();
}

export function classify(text: string): Classification {
  const haystack = normalise(text);
  const reasons: string[] = [];

  let bestIntent: Intent = "other";
  let bestScore = 0;
  let totalScore = 0;

  for (const rule of RULES) {
    let score = 0;
    const matched: string[] = [];
    for (const term of rule.terms) {
      const hits = countTerm(haystack, term);
      if (hits > 0) {
        score += hits * rule.weight;
        matched.push(term);
      }
    }
    totalScore += score;
    if (score > bestScore) {
      bestScore = score;
      bestIntent = rule.intent;
      reasons.length = 0;
      reasons.push(`intent=${rule.intent} via [${matched.join(", ")}]`);
    }
  }

  // Confidence: share of the matched signal the winning intent owns, damped so
  // a single weak keyword never reads as certainty.
  let confidence = 0;
  if (bestScore > 0) {
    const share = totalScore > 0 ? bestScore / totalScore : 0;
    confidence = Math.min(0.95, 0.4 * share + 0.1 * Math.min(bestScore, 4));
  } else {
    reasons.push("no intent keywords matched; defaulting to other");
  }

  const urgency: Urgency = URGENT_TERMS.some((t) => countTerm(haystack, t) > 0)
    ? "high"
    : "normal";
  if (urgency === "high") reasons.push("urgency=high via urgent terms");

  const sentiment: Sentiment = NEGATIVE_TERMS.some((t) => countTerm(haystack, t) > 0)
    ? "negative"
    : POSITIVE_TERMS.some((t) => countTerm(haystack, t) > 0)
      ? "positive"
      : "neutral";

  return { intent: bestIntent, confidence: Number(confidence.toFixed(2)), sentiment, urgency, reasons };
}
