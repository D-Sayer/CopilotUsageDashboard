export interface UsageSummary {
  totalSessions: number;
  totalRequests: number;
  totalTokens: number;
  totalPremiumRequests: number;
  firstSession: string;
  lastSession: string;
}

export interface DailyUsage {
  date: string;
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens: number;
  reasoningTokens: number;
  requests: number;
  premiumRequests: number;
  sessions: number;
}

export interface ModelTotal {
  model: string;
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens: number;
  cacheWriteTokens: number;
  reasoningTokens: number;
  requests: number;
  cost: number;
  sessions: number;
}

export interface SessionInfo {
  sessionId: string;
  sessionName: string | null;
  repository: string | null;
  branch: string | null;
  startTime: string | number;
  selectedModel: string;
  modelMetrics: Record<string, {
    requests: { count: number; cost: number };
    usage: {
      inputTokens: number;
      outputTokens: number;
      cacheReadTokens: number;
      cacheWriteTokens: number;
      reasoningTokens: number;
    };
  }>;
  totalPremiumRequests: number;
  totalApiDurationMs: number;
  codeChanges: { linesAdded: number; linesRemoved: number; filesModified: string[] } | null;
  turnCount: number;
}

export interface UsageData {
  summary: UsageSummary;
  dailyUsage: DailyUsage[];
  dailyByModel: Record<string, Record<string, { inputTokens: number; outputTokens: number; cacheReadTokens: number; reasoningTokens: number; requests: number }>>;
  modelTotals: ModelTotal[];
  sessions: SessionInfo[];
  error?: string;
}
