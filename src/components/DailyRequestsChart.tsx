import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { BarChart3 } from "lucide-react";
import type { DailyUsage } from "../types";

interface Props {
  data: DailyUsage[];
}

export function DailyRequestsChart({ data }: Props) {
  const chartData = data.map((d) => ({
    ...d,
    date: new Date(d.date).toLocaleDateString("en-AU", { day: "numeric", month: "short" }),
  }));

  return (
    <div className="chart-container">
      <div className="chart-header">
        <BarChart3 size={16} className="chart-header-icon" />
        <h2>Requests & Sessions by Day</h2>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData} margin={{ top: 10, right: 30, left: 10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#222222" vertical={false} />
          <XAxis dataKey="date" stroke="#666666" fontSize={11} tickLine={false} axisLine={false} />
          <YAxis stroke="#666666" fontSize={11} tickLine={false} axisLine={false} />
          <Tooltip
            contentStyle={{ backgroundColor: "#111111", border: "1px solid #222222", borderRadius: "6px", fontSize: "12px" }}
            labelStyle={{ color: "#ededed" }}
            itemStyle={{ color: "#888888" }}
          />
          <Legend wrapperStyle={{ fontSize: "12px" }} />
          <Bar dataKey="requests" name="API Requests" fill="#06b6d4" radius={[3, 3, 0, 0]} />
          <Bar dataKey="sessions" name="Sessions" fill="#10b981" radius={[3, 3, 0, 0]} />
          <Bar dataKey="premiumRequests" name="Premium Requests" fill="#eab308" radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
