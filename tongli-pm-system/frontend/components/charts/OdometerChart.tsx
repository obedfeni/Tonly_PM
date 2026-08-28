"use client";
import {
  ResponsiveContainer, ComposedChart, Line, ReferenceLine,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, Area,
} from "recharts";
import { useLang } from "@/lib/lang-context";
import type { OdometerPoint } from "@/lib/api";

interface OdometerChartProps {
  data: OdometerPoint[];
  pmTargetKm: number;
  predictedDate: string;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const pt = payload[0]?.payload as OdometerPoint;
  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-3 shadow-xl text-xs">
      <p className="text-gray-400 mb-1">{label}</p>
      <p className="text-white font-semibold">{Number(payload[0]?.value ?? 0).toLocaleString()} km</p>
      {pt?.predicted && <p className="text-blue-400 mt-0.5">Predicted</p>}
    </div>
  );
};

export function OdometerChart({ data, pmTargetKm, predictedDate }: OdometerChartProps) {
  const { t } = useLang();

  const historical = data.filter(d => !d.predicted);
  const predicted  = data.filter(d => d.predicted);

  // Join them: last historical point + all predicted
  const chartData = [
    ...historical.map(d => ({ date: d.date, actual: d.odometer_km, forecast: undefined })),
    ...(historical.length > 0
      ? [{ date: historical[historical.length - 1].date, actual: historical[historical.length - 1].odometer_km, forecast: historical[historical.length - 1].odometer_km }]
      : []),
    ...predicted.map(d => ({ date: d.date, actual: undefined, forecast: d.odometer_km })),
  ];

  // Thin out to max 80 points for performance
  const step = Math.max(1, Math.floor(chartData.length / 80));
  const thinned = chartData.filter((_, i) => i % step === 0 || i === chartData.length - 1);

  return (
    <ResponsiveContainer width="100%" height={320}>
      <ComposedChart data={thinned} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
        <XAxis
          dataKey="date"
          tick={{ fill: "#9CA3AF", fontSize: 11 }}
          tickFormatter={d => d?.slice(5)}
          interval="preserveStartEnd"
        />
        <YAxis
          tick={{ fill: "#9CA3AF", fontSize: 11 }}
          tickFormatter={v => `${(v / 1000).toFixed(0)}k`}
          width={45}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend
          formatter={(v) => <span className="text-xs text-gray-400">{v}</span>}
        />
        <ReferenceLine
          y={pmTargetKm}
          stroke="#EF4444"
          strokeDasharray="6 3"
          label={{ value: `PM Target ${(pmTargetKm / 1000).toFixed(0)}k km`, fill: "#EF4444", fontSize: 11 }}
        />
        <Area
          type="monotone"
          dataKey="actual"
          name="Actual Odometer"
          stroke="#3B82F6"
          fill="#3B82F6"
          fillOpacity={0.08}
          strokeWidth={2}
          dot={false}
          connectNulls={false}
        />
        <Line
          type="monotone"
          dataKey="forecast"
          name="AI Forecast"
          stroke="#A78BFA"
          strokeWidth={2}
          strokeDasharray="5 3"
          dot={false}
          connectNulls={false}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
