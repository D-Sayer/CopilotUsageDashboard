import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { TrendingUp } from "lucide-react";
import type { DailyUsage } from "../types";
import { formatTokens } from "../utils";

interface Props {
  data: DailyUsage[];
}

export function DailyTokenChart({ data }: Props) {
  const chartData = data.map((d) => ({
    ...d,
    date: new Date(d.date).toLocaleDateString("en-AU", { day: "numeric", month: "short" }),
    totalTokens: d.inputTokens + d.outputTokens,
  }));

  return (
    <div className="chart-container">
      <div className="chart-header">
        <TrendingUp size={16} className="chart-header-icon" />
        <h2>Token Usage by Day</h2>
      </div>
      <ResponsiveContainer width="100%" height={350}>
        <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 10, bottom: 0 }}>
          <defs>
            <linearGradient id="colorInput" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorOutput" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorReasoning" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#a78bfa" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#a78bfa" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#222222" vertical={false} />
          <XAxis dataKey="date" stroke="#666666" fontSize={11} tickLine={false} axisLine={false} />
          <YAxis stroke="#666666" fontSize={11} tickFormatter={formatTokens} tickLine={false} axisLine={false} />
          <Tooltip
            contentStyle={{ backgroundColor: "#111111", border: "1px solid #222222", borderRadius: "6px", fontSize: "12px" }}
            labelStyle={{ color: "#ededed" }}
            itemStyle={{ color: "#888888" }}
            formatter={(value, name) => [formatTokens(Number(value)), name as string]}
          />
          <Legend wrapperStyle={{ fontSize: "12px" }} />
          <Area
            type="monotone"
            dataKey="inputTokens"
            name="Input Tokens"
            stroke="#06b6d4"
            strokeWidth={1.5}
            fillOpacity={1}
            fill="url(#colorInput)"
            stackId="1"
          />
          <Area
            type="monotone"
            dataKey="outputTokens"
            name="Output Tokens"
            stroke="#10b981"
            strokeWidth={1.5}
            fillOpacity={1}
            fill="url(#colorOutput)"
            stackId="1"
          />
          <Area
            type="monotone"
            dataKey="reasoningTokens"
            name="Reasoning Tokens"
            stroke="#a78bfa"
            strokeWidth={1.5}
            fillOpacity={1}
            fill="url(#colorReasoning)"
            stackId="1"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
