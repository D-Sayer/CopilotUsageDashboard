import { MessageSquare, RefreshCw, Coins, Star, DollarSign, TrendingUp } from "lucide-react";
import type { UsageSummary, ModelTotal } from "../types";
import { formatTokens, formatNumber } from "../utils";
import { calculateModelCost, formatCost } from "../pricing";

interface Props {
  summary: UsageSummary;
  models?: ModelTotal[];
  dailyByModel?: Record<string, Record<string, { inputTokens: number; outputTokens: number; cacheReadTokens: number; reasoningTokens: number; requests: number }>>;
}

export function SummaryCards({ summary, models, dailyByModel }: Props) {
  const totalApiCost = models
    ? models.reduce((sum, m) => {
        const { cost } = calculateModelCost(m.model, m.inputTokens, m.outputTokens, m.cacheReadTokens, m.cacheWriteTokens, m.reasoningTokens);
        return sum + cost;
      }, 0)
    : 0;

  const hasUnknownModels = models?.some(m => {
    const { isUnknown } = calculateModelCost(m.model, m.inputTokens, m.outputTokens, m.cacheReadTokens, m.cacheWriteTokens, m.reasoningTokens);
    return isUnknown;
  });

  // Calculate 30-day rolling API cost
  let rolling30Cost = 0;
  let rolling30HasUnknown = false;
  if (dailyByModel) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 30);
    for (const [dateStr, modelMap] of Object.entries(dailyByModel)) {
      if (new Date(dateStr) < cutoff) continue;
      for (const [modelName, usage] of Object.entries(modelMap)) {
        const { cost, isUnknown } = calculateModelCost(modelName, usage.inputTokens, usage.outputTokens, usage.cacheReadTokens, 0, usage.reasoningTokens);
        rolling30Cost += cost;
        if (isUnknown) rolling30HasUnknown = true;
      }
    }
  }

  const cards = [
    { label: "Total Sessions", value: formatNumber(summary.totalSessions), icon: <MessageSquare size={20} /> },
    { label: "Total Requests", value: formatNumber(summary.totalRequests), icon: <RefreshCw size={20} /> },
    { label: "Total Tokens", value: formatTokens(summary.totalTokens), icon: <Coins size={20} /> },
    { label: "Premium Requests", value: formatNumber(summary.totalPremiumRequests), icon: <Star size={20} /> },
    { label: "API Price (All Time)", value: hasUnknownModels ? `~${formatCost(totalApiCost)}` : formatCost(totalApiCost), icon: <DollarSign size={20} /> },
    { label: "API Price (30 Days)", value: rolling30HasUnknown ? `~${formatCost(rolling30Cost)}` : formatCost(rolling30Cost), icon: <TrendingUp size={20} /> },
  ];

  return (
    <div className="summary-cards">
      {cards.map((card) => (
        <div key={card.label} className="summary-card">
          <div className="card-icon">{card.icon}</div>
          <div className="card-content">
            <div className="card-value">{card.value}</div>
            <div className="card-label">{card.label}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
