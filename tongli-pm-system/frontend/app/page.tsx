"use client";
import { useEffect, useState, useCallback } from "react";
import { Truck, AlertTriangle, Clock, CheckCircle, BrainCircuit, RefreshCw, Upload } from "lucide-react";
import Link from "next/link";
import { useLang } from "@/lib/lang-context";
import { api, type PredRow, type DataStatus } from "@/lib/api";
import { StatCard } from "@/components/ui/StatCard";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/Button";
import { PageSpinner } from "@/components/ui/Spinner";

export default function DashboardPage() {
  const { t } = useLang();
  const [preds, setPreds]   = useState<PredRow[]>([]);
  const [status, setStatus] = useState<DataStatus | null>(null);
  const [loading, setLoading]   = useState(true);
  const [running, setRunning]   = useState(false);
  const [error, setError]   = useState("");

  const load = useCallback(async () => {
    try {
      const [p, s] = await Promise.all([api.allPredictions(), api.dataStatus()]);
      setPreds(p.predictions);
      setStatus(s);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const runPredictions = async () => {
    setRunning(true);
    try {
      await api.runPredictions();
      await load();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setRunning(false);
    }
  };

  const byStatus = (s: string) => preds.filter(p => p.status === s).length;
  const upcoming = preds.filter(p => ["red","orange"].includes(p.status))
                        .sort((a, b) => (a.predicted_days ?? 999) - (b.predicted_days ?? 999))
                        .slice(0, 8);

  if (loading) return <div className="p-8"><PageSpinner /></div>;

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">{t("nav_dashboard")}</h1>
          <p className="text-gray-400 mt-1">{t("app_subtitle")}</p>
          {status && (
            <p className="text-xs text-gray-500 mt-1">
              {t("last_updated")}: {status.date_to} · {status.total_records.toLocaleString()} records
            </p>
          )}
        </div>
        <div className="flex gap-3">
          <Link href="/data">
            <Button variant="secondary" size="md">
              <Upload className="w-4 h-4" />
              {t("upload_data")}
            </Button>
          </Link>
          <Button onClick={runPredictions} loading={running} size="md">
            <BrainCircuit className="w-4 h-4" />
            {running ? t("running") : t("run_predictions")}
          </Button>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
          {error}
          <button onClick={() => setError("")} className="ml-3 underline text-xs">Dismiss</button>
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          label={t("total_trucks")}
          value={status?.trucks ?? preds.length}
          icon={<Truck className="w-5 h-5" />}
          color="blue"
        />
        <StatCard
          label={t("critical_7d")}
          value={byStatus("red")}
          icon={<AlertTriangle className="w-5 h-5" />}
          color="red"
        />
        <StatCard
          label={t("warning_14d")}
          value={byStatus("orange")}
          icon={<Clock className="w-5 h-5" />}
          color="orange"
        />
        <StatCard
          label={t("normal")}
          value={byStatus("green") + byStatus("yellow")}
          icon={<CheckCircle className="w-5 h-5" />}
          color="green"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Upcoming PM Table */}
        <div className="xl:col-span-2">
          <Card>
            <CardHeader>
              <h2 className="text-base font-semibold text-white">{t("upcoming_pm")}</h2>
            </CardHeader>
            <CardBody className="p-0">
              {upcoming.length === 0 ? (
                <div className="py-12 text-center text-gray-500 text-sm">{t("no_data")}</div>
              ) : (
                <table className="w-full text-sm">
                  <thead className="text-xs text-gray-500 uppercase border-b border-gray-800">
                    <tr>
                      <th className="px-5 py-3 text-left">{t("vehicle")}</th>
                      <th className="px-5 py-3 text-right">{t("km_remaining")}</th>
                      <th className="px-5 py-3 text-right">{t("predicted_date")}</th>
                      <th className="px-5 py-3 text-center">{t("model_used")}</th>
                      <th className="px-5 py-3 text-center">{t("status")}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {upcoming.map(p => (
                      <tr key={p.vehicle} className="hover:bg-gray-800/40 transition-colors">
                        <td className="px-5 py-3">
                          <Link href={`/predictions/${p.vehicle}`} className="text-blue-400 hover:text-blue-300 font-semibold">
                            {p.vehicle}
                          </Link>
                        </td>
                        <td className="px-5 py-3 text-right text-gray-300">
                          {p.km_remaining.toLocaleString()} km
                        </td>
                        <td className="px-5 py-3 text-right text-gray-300">{p.predicted_date}</td>
                        <td className="px-5 py-3 text-center">
                          <span className="text-xs bg-gray-800 px-2 py-0.5 rounded text-gray-400">
                            {p.model_used}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-center">
                          <StatusBadge status={p.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </CardBody>
          </Card>
        </div>

        {/* Fleet Status Summary */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <h2 className="text-base font-semibold text-white">{t("fleet_status")}</h2>
            </CardHeader>
            <CardBody>
              {[
                { key: "red",    label: t("critical_7d"),  color: "bg-red-500"    },
                { key: "orange", label: t("warning_14d"),  color: "bg-orange-500" },
                { key: "yellow", label: t("watch_30d"),    color: "bg-yellow-500" },
                { key: "green",  label: t("normal"),       color: "bg-green-500"  },
              ].map(({ key, label, color }) => {
                const count = byStatus(key);
                const total = preds.length || 1;
                const pct   = Math.round((count / total) * 100);
                return (
                  <div key={key} className="mb-4 last:mb-0">
                    <div className="flex justify-between text-sm mb-1.5">
                      <span className="text-gray-400">{label}</span>
                      <span className="text-white font-semibold">{count}</span>
                    </div>
                    <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                      <div className={`h-full ${color} rounded-full transition-all duration-700`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </CardBody>
          </Card>

          {status && (
            <Card>
              <CardHeader>
                <h2 className="text-base font-semibold text-white">{t("data_status")}</h2>
              </CardHeader>
              <CardBody className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">{t("total_records")}</span>
                  <span className="text-white font-medium">{status.total_records.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">{t("date_range")}</span>
                  <span className="text-white font-medium text-xs">{status.date_from} → {status.date_to}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">{t("anomalies")}</span>
                  <span className={`font-medium ${status.anomalies > 0 ? "text-orange-400" : "text-green-400"}`}>
                    {status.anomalies}
                  </span>
                </div>
              </CardBody>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
