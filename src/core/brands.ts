import type { BrandConfig, Intent, Urgency } from "./types";

/**
 * Two illustrative brands with deliberately different policies, to show that
 * the same core can be tuned per brand — the "standardise and scale across
 * markets" requirement, made concrete.
 *
 * These are fictional. Nothing here is derived from any real company.
 */

function queuesFor(prefix: string): Record<Intent, string> {
  return {
    billing: `${prefix}-billing`,
    technical: `${prefix}-technical`,
    cancellation: `${prefix}-retention`,
    sales: `${prefix}-sales`,
    complaint: `${prefix}-escalations`,
    account: `${prefix}-account`,
    other: `${prefix}-general`,
  };
}

const sla: Record<Urgency, number> = { high: 15, normal: 240, low: 1440 };

/**
 * A hosting brand. Cancellations and complaints are commercially sensitive, so
 * they never auto-resolve, and the confidence floor is high.
 */
export const harbourHost: BrandConfig = {
  id: "harbourhost",
  name: "Harbour Host",
  tone: "warm, plain English, no jargon",
  humanIntents: ["cancellation", "complaint"],
  confidenceFloor: 0.6,
  maxAiTurns: 3,
  queues: queuesFor("hh"),
  sla,
};

/**
 * A marketing-tools brand. More self-serve and automation-tolerant: only
 * complaints go straight to a human, and the AI may answer with less certainty.
 */
export const lanternReach: BrandConfig = {
  id: "lanternreach",
  name: "Lantern Reach",
  tone: "brisk, practical, friendly",
  humanIntents: ["complaint"],
  confidenceFloor: 0.45,
  maxAiTurns: 5,
  queues: queuesFor("lr"),
  sla,
};

export const BRANDS: Record<string, BrandConfig> = {
  [harbourHost.id]: harbourHost,
  [lanternReach.id]: lanternReach,
};

export function getBrand(id: string): BrandConfig {
  const brand = BRANDS[id];
  if (!brand) {
    throw new Error(`Unknown brand: ${id}. Known: ${Object.keys(BRANDS).join(", ")}`);
  }
  return brand;
}
