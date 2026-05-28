import { Clock } from "lucide-react";
import type { SessionInfo } from "../types";
import { formatNumber, formatDate, formatDuration } from "../utils";
import { calculateModelCost, formatCost } from "../pricing";

interface Props {
  sessions: SessionInfo[];
}

export function SessionsTable({ sessions }: Props) {
  return (
    <div className="table-container">
      <div className="table-header">
        <Clock size={16} className="table-header-icon" />
        <h2>Recent Sessions</h2>
      </div>
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Name</th>
              <th>Model</th>
              <th>Requests</th>
              <th>Input Tokens</th>
              <th>Output Tokens</th>
              <th>Duration</th>
              <th>Code Changes</th>
              <th>API Price Equiv.</th>
            </tr>
          </thead>
          <tbody>
            {sessions.map((s) => {
              const totalInput = Object.values(s.modelMetrics).reduce((sum, m) => sum + (m.usage?.inputTokens || 0), 0);
              const totalOutput = Object.values(s.modelMetrics).reduce((sum, m) => sum + (m.usage?.outputTokens || 0), 0);
              const totalReqs = Object.values(s.modelMetrics).reduce((sum, m) => sum + (m.requests?.count || 0), 0);

              // Calculate API cost across all models used in this session
              let sessionApiCost = 0;
              let hasUnknown = false;
              for (const [modelName, metrics] of Object.entries(s.modelMetrics)) {
                const { cost, isUnknown } = calculateModelCost(
                  modelName,
                  metrics.usage?.inputTokens || 0,
                  metrics.usage?.outputTokens || 0,
                  metrics.usage?.cacheReadTokens || 0,
                  metrics.usage?.cacheWriteTokens || 0,
                  metrics.usage?.reasoningTokens || 0,
                );
                sessionApiCost += cost;
                if (isUnknown) hasUnknown = true;
              }

              return (
                <tr key={s.sessionId}>
                  <td className="date-cell">{formatDate(s.startTime)}</td>
                  <td className="session-name">{s.sessionName || "Untitled"}</td>
                  <td>
                    <span className="model-badge">{s.selectedModel}</span>
                  </td>
                  <td>{formatNumber(totalReqs)}</td>
                  <td className="token-input">{formatNumber(totalInput)}</td>
                  <td className="token-output">{formatNumber(totalOutput)}</td>
                  <td>{formatDuration(s.totalApiDurationMs)}</td>
                  <td className="code-changes">
                    {s.codeChanges ? (
                      <>
                        <span className="lines-added">+{s.codeChanges.linesAdded}</span>
                        {" / "}
                        <span className="lines-removed">-{s.codeChanges.linesRemoved}</span>
                      </>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="token-api-cost">{formatCost(sessionApiCost, hasUnknown)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
