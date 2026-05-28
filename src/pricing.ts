/**
 * API pricing data per model (cost per 1M tokens in USD).
 *
 * To add/update pricing: edit the entries below.
 * Model names are matched case-insensitively and support partial matching
 * (e.g., "claude-sonnet-4" matches "claude-sonnet-4-20250514").
 *
 * If a model isn't found, the "unknown" fallback is used.
 */

export interface ModelPricing {
  inputPerMillion: number;
  outputPerMillion: number;
  cacheReadPerMillion: number;
  cacheWritePerMillion: number;
  reasoningPerMillion: number;
}

// Pricing entries - matched top-to-bottom, first match wins.
// Use more-specific names before less-specific ones.
const pricingTable: Array<{ pattern: string; pricing: ModelPricing }> = [
  // OPEN AI
  {
    pattern: "gpt-4.1",
    pricing: {
      inputPerMillion: 2.0,
      outputPerMillion: 8.0,
      cacheReadPerMillion: 0.5,
      cacheWritePerMillion: 0,
      reasoningPerMillion: 8.0,
    },
  },
  {
    pattern: "gpt-5.4",
    pricing: {
      inputPerMillion: 2.5,
      outputPerMillion: 15,
      cacheReadPerMillion: 0.25,
      cacheWritePerMillion: 0,
      reasoningPerMillion: 15,
    },
  },

  // ANTHROPIC
  {
    pattern: "claude-opus-4.6",
    pricing: {
      inputPerMillion: 5.0,
      outputPerMillion: 25.0,
      cacheReadPerMillion: 0.5,
      cacheWritePerMillion: 6.25,
      reasoningPerMillion: 25,
    },
  },
  {
    pattern: "claude-sonnet-4.6",
    pricing: {
      inputPerMillion: 3.0,
      outputPerMillion: 15.0,
      cacheReadPerMillion: 0.3,
      cacheWritePerMillion: 3.75,
      reasoningPerMillion: 15.0,
    },
  },
  {
    pattern: "claude-sonnet-4.5",
    pricing: {
      inputPerMillion: 3.0,
      outputPerMillion: 15.0,
      cacheReadPerMillion: 0.3,
      cacheWritePerMillion: 3.75,
      reasoningPerMillion: 15.0,
    },
  },
  {
    pattern: "claude-haiku-4.5",
    pricing: {
      inputPerMillion: 1.0,
      outputPerMillion: 5.0,
      cacheReadPerMillion: 0.08,
      cacheWritePerMillion: 1.25,
      reasoningPerMillion: 5.0,
    },
  },
];

const UNKNOWN_PRICING: ModelPricing = {
  inputPerMillion: 0,
  outputPerMillion: 0,
  cacheReadPerMillion: 0,
  cacheWritePerMillion: 0,
  reasoningPerMillion: 0,
};

export function getModelPricing(modelName: string): {
  pricing: ModelPricing;
  isUnknown: boolean;
} {
  const normalized = modelName.toLowerCase();
  for (const entry of pricingTable) {
    const pattern = entry.pattern.toLowerCase();
    const idx = normalized.indexOf(pattern);
    if (idx === -1) continue;
    // Ensure the match isn't a prefix of a longer version string.
    // e.g., "claude-opus-4" should NOT match "claude-opus-4.5"
    const afterIdx = idx + pattern.length;
    const charAfter = normalized[afterIdx];
    if (charAfter && /[0-9.]/.test(charAfter)) continue;
    return { pricing: entry.pricing, isUnknown: false };
  }
  return { pricing: UNKNOWN_PRICING, isUnknown: true };
}

export function calculateTokenCost(
  pricing: ModelPricing,
  inputTokens: number,
  outputTokens: number,
  cacheReadTokens: number,
  cacheWriteTokens: number,
  reasoningTokens: number,
): number {
  return (
    (inputTokens / 1_000_000) * pricing.inputPerMillion +
    (outputTokens / 1_000_000) * pricing.outputPerMillion +
    (cacheReadTokens / 1_000_000) * pricing.cacheReadPerMillion +
    (cacheWriteTokens / 1_000_000) * pricing.cacheWritePerMillion +
    (reasoningTokens / 1_000_000) * pricing.reasoningPerMillion
  );
}

export function calculateModelCost(
  modelName: string,
  inputTokens: number,
  outputTokens: number,
  cacheReadTokens: number,
  cacheWriteTokens: number,
  reasoningTokens: number,
): { cost: number; isUnknown: boolean } {
  const { pricing, isUnknown } = getModelPricing(modelName);
  const cost = calculateTokenCost(
    pricing,
    inputTokens,
    outputTokens,
    cacheReadTokens,
    cacheWriteTokens,
    reasoningTokens,
  );
  return { cost, isUnknown };
}

export function formatCost(cost: number, isUnknown?: boolean): string {
  if (isUnknown) return "—";
  if (cost < 0.01) return `$${cost.toFixed(4)} USD`;
  if (cost < 1) return `$${cost.toFixed(3)} USD`;
  return `$${cost.toFixed(2)} USD`;
}
