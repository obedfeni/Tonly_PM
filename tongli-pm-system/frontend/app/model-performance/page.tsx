"use client";
import { useEffect, useState } from "react";
import { BarChart3, Trophy, Cpu, TrendingUp } from "lucide-react";
import { useLang } from "@/lib/lang-context";
import { api, type ModelPerf, type ModelSummary } from "@/lib/api";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { PageSpinner } from "@/components/ui/Spinner";
import { Table, Thead, Tbody, Th, Td, Tr } from "@/components/ui/Table";
import { ModelCompareChart } from "@/components/charts/ModelCompareChart";

const MODEL_COLORS: Record<string, string> = {
  LinearRegression: "text-blue-400 bg-blue-500/10",
  RandomForest:     "text-green-400 bg-green-500/10",
  XGBoost:          "text-purple-400 bg-purple-500/10",
};

const RANK_ICONS = ["🥇", "🥈", "🥉"];

export default function ModelPerformancePage() {
  const { t } = useLang();
  const [perf, setPerf] = useState<ModelPerf | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api.modelPerformance()
      .then(setPerf)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8"><PageSpinner /></div>;

  const sorted = perf?.model_summary.slice().sort((a, b) => a.avg_mae_km - b.avg_mae_km) ?? [];
  const winner = sorted[0];

  return (
    <div className="p-8">
      <PageHeader
        title={t("nav_model")}
        subtitle="Cross-validated performance across all trucks — lower MAE is better"
      />

      {error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">{error}</div>
      )}

      {!perf || sorted.length === 0 ? (
        <Card>
          <CardBody>
            <div className="py-16 text-center text-gray-500">
              <Cpu className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No model metrics yet. Run predictions first.</p>
            </div>
          </CardBody>
        </Card>
      ) : (
        <>
          {/* Winner banner */}
          {winner && (
            <div className="mb-6 p-4 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-xl flex items-center gap-4">
              <div className="text-3xl">🏆</div>
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider mb-0.5">Best Overall Model</p>
                <p className="text-xl font-bold text-white">{winner.model_name}</p>
                <p className="text-sm text-gray-400">
                  Avg MAE {winner.avg_mae_km.toFixed(0)} km · {winner.avg_mae_days.toFixed(1)} days ·
                  Won on {winner.wins} of {perf.total_trucks} trucks
                </p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
            {/* Podium Cards */}
            <div className="space-y-3">
              {sorted.map((m, i) => (
                <Card key={m.model_name} className={i === 0 ? "border-blue-500/40" : ""}>
                  <CardBody>
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{RANK_ICONS[i] ?? "🔢"}</span>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`text-sm font-bold px-2 py-0.5 rounded ${MODEL_COLORS[m.model_name] ?? "text-gray-300 bg-gray-800"}`}>
                            {m.model_name}
                          </span>
                          {i === 0 && <span className="text-xs bg-blue-600 text-white px-1.5 py-0.5 rounded">Selected</span>}
                        </div>
                        <div className="grid grid-cols-4 gap-3 text-xs">
                          <div>
                            <p className="text-gray-500 mb-0.5">MAE (km)</p>
                            <p className="text-white font-semibold">{m.avg_mae_km.toFixed(0)}</p>
                          </div>
                          <div>
                            <p className="text-gray-500 mb-0.5">RMSE (km)</p>
                            <p className="text-white font-semibold">{m.avg_rmse_km.toFixed(0)}</p>
                          </div>
                          <div>
                            <p className="text-gray-500 mb-0.5">MAE (days)</p>
                            <p className="text-white font-semibold">{m.avg_mae_days.toFixed(1)}</p>
                          </div>
                          <div>
                            <p className="text-gray-500 mb-0.5">R²</p>
                            <p className="text-white font-semibold">{m.avg_r2.toFixed(3)}</p>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500">Wins</p>
                        <p className="text-2xl font-bold text-white">{m.wins}</p>
                        <p className="text-xs text-gray-600">trucks</p>
                      </div>
                    </div>
                  </CardBody>
                </Card>
              ))}
            </div>

            {/* Bar Chart */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-blue-400" />
                  <h2 className="text-sm font-semibold text-white">Visual Comparison</h2>
                </div>
              </CardHeader>
              <CardBody>
                <ModelCompareChart data={sorted} />
              </CardBody>
            </Card>
          </div>

          {/* Per-truck winner table */}
          {perf.best_per_truck && Object.keys(perf.best_per_truck).length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-yellow-400" />
                  <h2 className="text-sm font-semibold text-white">Best Model Per Truck</h2>
                </div>
              </CardHeader>
              <Table>
                <Thead>
                  <tr>
                    <Th>Vehicle</Th>
                    <Th>Best Model</Th>
                  </tr>
                </Thead>
                <Tbody>
                  {Object.entries(perf.best_per_truck).map(([v, m]) => (
                    <Tr key={v}>
                      <Td><span className="font-bold text-blue-400">{v}</span></Td>
                      <Td>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded ${MODEL_COLORS[m] ?? "text-gray-400 bg-gray-800"}`}>
                          {m}
                        </span>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
