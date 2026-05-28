import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(cors());

const COPILOT_DIR = path.join(process.env.USERPROFILE || "", ".copilot");
const SESSION_STATE_DIR = path.join(COPILOT_DIR, "session-state");

function parseEventsFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, "utf-8");
    const lines = content.split("\n").filter(Boolean);
    const events = [];
    for (const line of lines) {
      try {
        events.push(JSON.parse(line));
      } catch {
        // skip malformed lines
      }
    }
    return events;
  } catch {
    return [];
  }
}

function extractSessionData(sessionDir) {
  const eventsPath = path.join(sessionDir, "events.jsonl");
  if (!fs.existsSync(eventsPath)) return null;

  const events = parseEventsFile(eventsPath);

  const startEvent = events.find((e) => e.type === "session.start");
  const shutdownEvent = events.find((e) => e.type === "session.shutdown");

  if (!startEvent && !shutdownEvent) return null;

  const sessionId = path.basename(sessionDir);
  const startTime = startEvent?.data?.startTime || shutdownEvent?.data?.sessionStartTime;
  const selectedModel = startEvent?.data?.selectedModel || shutdownEvent?.data?.currentModel;

  // Extract workspace info
  const workspacePath = path.join(sessionDir, "workspace.yaml");
  let sessionName = null;
  let repository = null;
  let branch = null;
  if (fs.existsSync(workspacePath)) {
    const yaml = fs.readFileSync(workspacePath, "utf-8");
    const nameMatch = yaml.match(/^name:\s*(.+)$/m);
    const repoMatch = yaml.match(/^repository:\s*(.+)$/m);
    const branchMatch = yaml.match(/^branch:\s*(.+)$/m);
    sessionName = nameMatch?.[1]?.trim() || null;
    repository = repoMatch?.[1]?.trim() || null;
    branch = branchMatch?.[1]?.trim() || null;
  }

  // Extract model metrics from shutdown event
  const modelMetrics = shutdownEvent?.data?.modelMetrics || {};
  const totalPremiumRequests = shutdownEvent?.data?.totalPremiumRequests || 0;
  const totalApiDurationMs = shutdownEvent?.data?.totalApiDurationMs || 0;
  const codeChanges = shutdownEvent?.data?.codeChanges || null;

  // Also extract per-turn model info for more granularity
  const turnModels = events
    .filter((e) => e.type === "assistant.message" && e.data?.model)
    .map((e) => ({
      model: e.data.model,
      timestamp: e.timestamp || e.data?.timestamp,
    }));

  return {
    sessionId,
    sessionName,
    repository,
    branch,
    startTime,
    selectedModel,
    modelMetrics,
    totalPremiumRequests,
    totalApiDurationMs,
    codeChanges,
    turnCount: turnModels.length,
  };
}

app.get("/api/usage", (req, res) => {
  try {
    if (!fs.existsSync(SESSION_STATE_DIR)) {
      return res.json({ error: "Session state directory not found", sessions: [] });
    }

    const sessionDirs = fs.readdirSync(SESSION_STATE_DIR).filter((d) => {
      const full = path.join(SESSION_STATE_DIR, d);
      return fs.statSync(full).isDirectory();
    });

    const sessions = [];
    for (const dir of sessionDirs) {
      const data = extractSessionData(path.join(SESSION_STATE_DIR, dir));
      if (data && Object.keys(data.modelMetrics).length > 0) {
        sessions.push(data);
      }
    }

    // Aggregate by day and model
    const dailyUsage = {};
    const modelTotals = {};

    for (const session of sessions) {
      const date = session.startTime
        ? new Date(typeof session.startTime === "number" ? session.startTime : session.startTime).toISOString().split("T")[0]
        : "unknown";

      if (!dailyUsage[date]) {
        dailyUsage[date] = { date, inputTokens: 0, outputTokens: 0, cacheReadTokens: 0, reasoningTokens: 0, requests: 0, premiumRequests: 0, sessions: 0 };
      }

      dailyUsage[date].sessions += 1;
      dailyUsage[date].premiumRequests += session.totalPremiumRequests;

      for (const [model, metrics] of Object.entries(session.modelMetrics)) {
        const usage = metrics.usage || {};
        const requests = metrics.requests || {};

        dailyUsage[date].inputTokens += usage.inputTokens || 0;
        dailyUsage[date].outputTokens += usage.outputTokens || 0;
        dailyUsage[date].cacheReadTokens += usage.cacheReadTokens || 0;
        dailyUsage[date].reasoningTokens += usage.reasoningTokens || 0;
        dailyUsage[date].requests += requests.count || 0;

        if (!modelTotals[model]) {
          modelTotals[model] = { model, inputTokens: 0, outputTokens: 0, cacheReadTokens: 0, cacheWriteTokens: 0, reasoningTokens: 0, requests: 0, cost: 0, sessions: 0 };
        }
        modelTotals[model].inputTokens += usage.inputTokens || 0;
        modelTotals[model].outputTokens += usage.outputTokens || 0;
        modelTotals[model].cacheReadTokens += usage.cacheReadTokens || 0;
        modelTotals[model].cacheWriteTokens += usage.cacheWriteTokens || 0;
        modelTotals[model].reasoningTokens += usage.reasoningTokens || 0;
        modelTotals[model].requests += requests.count || 0;
        modelTotals[model].cost += requests.cost || 0;
        modelTotals[model].sessions += 1;
      }
    }

    // Sort daily usage by date
    const sortedDaily = Object.values(dailyUsage).sort((a, b) => a.date.localeCompare(b.date));

    // Build per-day per-model breakdown
    const dailyByModel = {};
    for (const session of sessions) {
      const date = session.startTime
        ? new Date(typeof session.startTime === "number" ? session.startTime : session.startTime).toISOString().split("T")[0]
        : "unknown";

      if (!dailyByModel[date]) dailyByModel[date] = {};

      for (const [model, metrics] of Object.entries(session.modelMetrics)) {
        const usage = metrics.usage || {};
        if (!dailyByModel[date][model]) {
          dailyByModel[date][model] = { inputTokens: 0, outputTokens: 0, cacheReadTokens: 0, reasoningTokens: 0, requests: 0 };
        }
        dailyByModel[date][model].inputTokens += usage.inputTokens || 0;
        dailyByModel[date][model].outputTokens += usage.outputTokens || 0;
        dailyByModel[date][model].cacheReadTokens += usage.cacheReadTokens || 0;
        dailyByModel[date][model].reasoningTokens += usage.reasoningTokens || 0;
        dailyByModel[date][model].requests += (metrics.requests?.count || 0);
      }
    }

    // Total summary
    const totalTokens = sessions.reduce((sum, s) => {
      return sum + Object.values(s.modelMetrics).reduce((mSum, m) => {
        return mSum + (m.usage?.inputTokens || 0) + (m.usage?.outputTokens || 0);
      }, 0);
    }, 0);

    const totalSessions = sessions.length;
    const totalRequests = Object.values(modelTotals).reduce((s, m) => s + m.requests, 0);

    res.json({
      summary: {
        totalSessions,
        totalRequests,
        totalTokens,
        totalPremiumRequests: sessions.reduce((s, sess) => s + sess.totalPremiumRequests, 0),
        firstSession: sortedDaily[0]?.date,
        lastSession: sortedDaily[sortedDaily.length - 1]?.date,
      },
      dailyUsage: sortedDaily,
      dailyByModel,
      modelTotals: Object.values(modelTotals).sort((a, b) => b.inputTokens - a.inputTokens),
      sessions: sessions
        .sort((a, b) => {
          const aTime = a.startTime ? new Date(typeof a.startTime === "number" ? a.startTime : a.startTime).getTime() : 0;
          const bTime = b.startTime ? new Date(typeof b.startTime === "number" ? b.startTime : b.startTime).getTime() : 0;
          return bTime - aTime;
        })
        .slice(0, 100), // Latest 100 sessions
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Serve static files in production
const distPath = path.join(__dirname, "dist");
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get("/{*splat}", (req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
}

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Copilot Usage API running on http://localhost:${PORT}`);
});
