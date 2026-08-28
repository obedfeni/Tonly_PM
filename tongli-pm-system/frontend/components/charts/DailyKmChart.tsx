"use client";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import type { DailyKm } from "@/lib/api";

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-3 shadow-xl text-xs">
      <p className="text-gray-400 mb-1">{label}</p>
      <p className="text-white font-semibold">{Number(payload[0]?.value ?? 0).toLocaleString()} km/day</p>
    </div>
  );
};

export function DailyKmChart({ data }: { data: DailyKm[] }) {
  const step = Math.max(1, Math.floor(data.length / 60));
  const thinned = data.filter((_, i) => i % step === 0 || i === data.length - 1);

  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={thinned} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
        <XAxis
          dataKey="date"
          tick={{ fill: "#9CA3AF", fontSize: 11 }}
          tickFormatter={d => d?.slice(5)}
          interval="preserveStartEnd"
        />
        <YAxis tick={{ fill: "#9CA3AF", fontSize: 11 }} width={40} />
        <Tooltip content={<CustomTooltip />} />
        <Area
          type="monotone"
          dataKey="daily_km"
          stroke="#10B981"
          fill="#10B981"
          fillOpacity={0.15}
          strokeWidth={2}
          dot={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
