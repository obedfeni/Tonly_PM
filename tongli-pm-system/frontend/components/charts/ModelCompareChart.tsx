"use client";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import type { ModelSummary } from "@/lib/api";

const COLORS: Record<string, string> = {
  LinearRegression: "#60A5FA",
  RandomForest:     "#34D399",
  XGBoost:          "#A78BFA",
};

export function ModelCompareChart({ data }: { data: ModelSummary[] }) {
  const chartData = data.map(d => ({
    name:        d.model_name.replace("LinearRegression", "Linear").replace("RandomForest", "RF"),
    "MAE (km)":  d.avg_mae_km,
    "MAE (days)":d.avg_mae_days,
    R2:          parseFloat((d.avg_r2 * 100).toFixed(1)),
  }));

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
        <XAxis dataKey="name" tick={{ fill: "#9CA3AF", fontSize: 12 }} />
        <YAxis tick={{ fill: "#9CA3AF", fontSize: 11 }} />
        <Tooltip
          contentStyle={{ background: "#1F2937", border: "1px solid #374151", borderRadius: 8 }}
          labelStyle={{ color: "#F9FAFB" }}
          itemStyle={{ color: "#D1D5DB" }}
        />
        <Legend formatter={v => <span className="text-xs text-gray-400">{v}</span>} />
        <Bar dataKey="MAE (km)"   fill="#3B82F6" radius={[4,4,0,0]} />
        <Bar dataKey="MAE (days)" fill="#10B981" radius={[4,4,0,0]} />
        <Bar dataKey="R2"         fill="#8B5CF6" radius={[4,4,0,0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
