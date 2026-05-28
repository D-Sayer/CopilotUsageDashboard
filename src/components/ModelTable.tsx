import { Layers } from "lucide-react";
import type { ModelTotal } from "../types";
import { formatNumber } from "../utils";
import { calculateModelCost, formatCost } from "../pricing";

interface Props {
  models: ModelTotal[];
}

export function ModelTable({ models }: Props) {
  const totalInput = models.reduce((s, m) => s + m.inputTokens, 0);
  const totalOutput = models.reduce((s, m) => s + m.outputTokens, 0);
  const totalCache = models.reduce((s, m) => s + m.cacheReadTokens, 0);
  const totalReasoning = models.reduce((s, m) => s + m.reasoningTokens, 0);
  const totalRequests = models.reduce((s, m) => s + m.requests, 0);
  const totalCost = models.reduce((s, m) => s + m.cost, 0);
  const totalApiCost = models.reduce((s, m) => {
    const { cost } = calculateModelCost(m.model, m.inputTokens, m.outputTokens, m.cacheReadTokens, m.cacheWriteTokens, m.reasoningTokens);
    return s + cost;
  }, 0);
  const hasAnyUnknown = models.some(m => calculateModelCost(m.model, m.inputTokens, m.outputTokens, m.cacheReadTokens, m.cacheWriteTokens, m.reasoningTokens).isUnknown);

  return (
    <div className="table-container">
      <div className="table-header">
        <Layers size={16} className="table-header-icon" />
        <h2>Model Usage Breakdown</h2>
      </div>
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Model</th>
              <th>Sessions</th>
              <th>Requests</th>
              <th>Input Tokens</th>
              <th>Output Tokens</th>
              <th>Cache Read</th>
              <th>Reasoning</th>
              <th>Premium Cost</th>
              <th>API Price Equiv. (USD)</th>
            </tr>
          </thead>
          <tbody>
            {models.map((m) => {
              const { cost: apiCost, isUnknown } = calculateModelCost(m.model, m.inputTokens, m.outputTokens, m.cacheReadTokens, m.cacheWriteTokens, m.reasoningTokens);
              return (
                <tr key={m.model}>
                  <td className="model-name">
                    <span className="model-badge">{m.model}</span>
                  </td>
                  <td>{formatNumber(m.sessions)}</td>
                  <td>{formatNumber(m.requests)}</td>
                  <td className="token-input">{formatNumber(m.inputTokens)}</td>
                  <td className="token-output">{formatNumber(m.outputTokens)}</td>
                  <td className="token-cache">{formatNumber(m.cacheReadTokens)}</td>
                  <td className="token-reasoning">{formatNumber(m.reasoningTokens)}</td>
                  <td className="token-cost">{m.cost}</td>
                  <td className="token-api-cost">{formatCost(apiCost, isUnknown)}</td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr>
              <td><strong>Total</strong></td>
              <td><strong>{formatNumber(models.reduce((s, m) => s + m.sessions, 0))}</strong></td>
              <td><strong>{formatNumber(totalRequests)}</strong></td>
              <td className="token-input"><strong>{formatNumber(totalInput)}</strong></td>
              <td className="token-output"><strong>{formatNumber(totalOutput)}</strong></td>
              <td className="token-cache"><strong>{formatNumber(totalCache)}</strong></td>
              <td className="token-reasoning"><strong>{formatNumber(totalReasoning)}</strong></td>
              <td className="token-cost"><strong>{totalCost}</strong></td>
              <td className="token-api-cost"><strong>{hasAnyUnknown ? `~${formatCost(totalApiCost)}` : formatCost(totalApiCost)}</strong></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
