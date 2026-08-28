"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Target, Gauge, Calendar, Zap, TrendingUp } from "lucide-react";
import { useLang } from "@/lib/lang-context";
import { api, type PredictionDetail } from "@/lib/api";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { PageSpinner } from "@/components/ui/Spinner";
import { OdometerChart } from "@/components/charts/OdometerChart";
import { DailyKmChart } from "@/components/charts/DailyKmChart";

function InfoRow({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex justify-between py-3 border-b border-gray-800 last:border-0">
      <span className="text-gray-400 text-sm">{label}</span>
      <span className={`text-sm font-semibold ${highlight ? "text-white" : "text-gray-200"}`}>{value}</span>
    </div>
  );
}

const MODEL_COLORS: Record<string, string> = {
  LinearRegression: "text-blue-400",
  RandomForest:     "text-green-400",
  XGBoost:          "text-purple-400",
};

export default function PredictionDetailPage() {
  const { t } = useLang();
  const params = useParams();
  const vehicle = (params.vehicle as string).toUpperCase();
  const [pred, setPred]     = useState<PredictionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState("");

  useEffect(() => {
    api.predictionDetail(vehicle)
      .then(setPred)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [vehicle]);

  if (loading) return <div className="p-8"><PageSpinner /></div>;
  if (error)   return (
    <div className="p-8">
      <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">{error}</div>
      <Link href="/predictions" className="mt-4 inline-flex items-center gap-2 text-blue-400 text-sm">
        <ArrowLeft className="w-4 h-4" /> Back to predictions
      </Link>
    </div>
  );
  if (!pred) return null;

  const bestModel = pred.model_results.reduce((a, b) => a.mae_km < b.mae_km ? a : b, pred.model_results[0]);

  return (
    <div className="p-8">
      {/* Back */}
      <Link href="/predictions" className="inline-flex items-center gap-2 text-gray-400 hover:text-white text-sm mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" /> {t("nav_predictions")}
      </Link>

      {/* Title */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
          <Gauge className="w-6 h-6 text-blue-400" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-white">{vehicle}</h1>
          <p className="text-gray-400 text-sm">{t("prediction_detail")}</p>
        </div>
        <div className="ml-auto">
          <StatusBadge status={pred.status} />
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Key metrics */}
        <div className="xl:col-span-1 space-y-4">
          <Card>
            <CardHeader>
              <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">PM Summary</h2>
            </CardHeader>
            <CardBody className="py-2">
              <InfoRow label={t("current_km")} value={`${pred.current_km.toLocaleString()} km`} highlight />
              <InfoRow label={t("pm_target")} value={`${pred.pm_target_km.toLocaleString()} km`} />
              <InfoRow label={t("km_remaining")} value={`${pred.km_remaining.toLocaleString()} km`} highlight />
              <InfoRow label={t("avg_daily_km")} value={`${pred.avg_daily_km.toLocaleString()} km/day`} />
            </CardBody>
          </Card>

          <Card className="border-blue-500/30">
            <CardHeader className="bg-blue-500/5">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-400" />
                <h2 className="text-sm font-semibold text-blue-300">AI Prediction</h2>
              </div>
            </CardHeader>
            <CardBody className="py-2">
              <InfoRow label={t("predicted_date")} value={pred.predicted_date} highlight />
              <InfoRow label={t("lower_bound")} value={pred.lower_date} />
              <InfoRow label={t("upper_bound")} value={pred.upper_date} />
              <InfoRow label="Days until PM" value={`${pred.predicted_days.toFixed(0)} days`} highlight />
              <InfoRow label={t("model_used")} value={pred.model_used} />
              <InfoRow label={t("confidence")} value={pred.confidence} />
              <InfoRow label="Model MAE" value={`±${pred.model_mae_days.toFixed(1)} days`} />
            </CardBody>
          </Card>

          {/* Model comparison */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-purple-400" />
                <h2 className="text-sm font-semibold text-gray-300">Model Comparison</h2>
              </div>
            </CardHeader>
            <CardBody className="space-y-3">
              {pred.model_results.map(m => (
                <div key={m.model_name} className={`p-3 rounded-lg ${m.model_name === pred.model_used ? "bg-blue-500/10 border border-blue-500/30" : "bg-gray-800/50"}`}>
                  <div className="flex justify-between items-center mb-1.5">
                    <span className={`text-xs font-semibold ${MODEL_COLORS[m.model_name] ?? "text-gray-300"}`}>
                      {m.model_name}
                    </span>
                    {m.model_name === pred.model_used && (
                      <span className="text-xs bg-blue-500 text-white px-1.5 py-0.5 rounded">
                        {t("selected")}
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs text-gray-400">
                    <div>
                      <p className="text-gray-600">MAE km</p>
                      <p className="text-gray-300 font-medium">{m.mae_km.toFixed(0)}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">MAE days</p>
                      <p className="text-gray-300 font-medium">{m.mae_days.toFixed(1)}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">R²</p>
                      <p className="text-gray-300 font-medium">{m.r2.toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </CardBody>
          </Card>
        </div>

        {/* Charts */}
        <div className="xl:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <h2 className="text-base font-semibold text-white">{t("odometer_chart")}</h2>
              <p className="text-xs text-gray-500 mt-0.5">Blue = actual · Purple dashed = AI forecast · Red line = PM target</p>
            </CardHeader>
            <CardBody>
              {pred.future_odometer.length > 0 ? (
                <OdometerChart
                  data={pred.future_odometer}
                  pmTargetKm={pred.pm_target_km}
                  predictedDate={pred.predicted_date}
                />
              ) : (
                <div className="h-64 flex items-center justify-center text-gray-500 text-sm">{t("no_data")}</div>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="text-base font-semibold text-white">{t("daily_km_chart")}</h2>
              <p className="text-xs text-gray-500 mt-0.5">Historical daily distance travelled</p>
            </CardHeader>
            <CardBody>
              {pred.daily_km_history.length > 0 ? (
                <DailyKmChart data={pred.daily_km_history} />
              ) : (
                <div className="h-40 flex items-center justify-center text-gray-500 text-sm">{t("no_data")}</div>
              )}
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
