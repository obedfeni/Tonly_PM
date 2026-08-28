"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { BrainCircuit, ChevronRight } from "lucide-react";
import { useLang } from "@/lib/lang-context";
import { api, type PredRow } from "@/lib/api";
import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { PageSpinner } from "@/components/ui/Spinner";
import { EmptyState } from "@/components/ui/EmptyState";
import { Table, Thead, Tbody, Th, Td, Tr } from "@/components/ui/Table";

const CONF_COLOR: Record<string, string> = {
  High:   "text-green-400",
  Medium: "text-yellow-400",
  Low:    "text-red-400",
};

export default function PredictionsPage() {
  const { t } = useLang();
  const [preds, setPreds]   = useState<PredRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    api.allPredictions()
      .then(r => setPreds(r.predictions))
      .finally(() => setLoading(false));
  }, []);

  const filtered = filter === "all" ? preds : preds.filter(p => p.status === filter);

  if (loading) return <div className="p-8"><PageSpinner /></div>;

  return (
    <div className="p-8">
      <PageHeader title={t("nav_predictions")} subtitle={`${preds.length} trucks with AI predictions`} />

      {/* Filter Pills */}
      <div className="flex gap-2 mb-5">
        {["all","red","orange","yellow","green"].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors
              ${filter === f
                ? "bg-blue-600 text-white"
                : "bg-gray-800 text-gray-400 hover:text-white"}`}
          >
            {f === "all" ? "All" : t(`status_${f}` as any)} {f !== "all" && `(${preds.filter(p => p.status === f).length})`}
          </button>
        ))}
      </div>

      <Card>
        {filtered.length === 0 ? (
          <EmptyState
            icon={<BrainCircuit className="w-12 h-12" />}
            title={t("no_data")}
            description="Run AI predictions to see results here."
          />
        ) : (
          <Table>
            <Thead>
              <tr>
                <Th>{t("vehicle")}</Th>
                <Th>{t("current_km")}</Th>
                <Th>{t("km_remaining")}</Th>
                <Th>{t("avg_daily_km")}</Th>
                <Th>{t("predicted_date")}</Th>
                <Th>Range</Th>
                <Th>{t("model_used")}</Th>
                <Th>{t("confidence")}</Th>
                <Th>{t("status")}</Th>
                <Th></Th>
              </tr>
            </Thead>
            <Tbody>
              {filtered.map(p => (
                <Tr key={p.vehicle}>
                  <Td><span className="font-bold text-blue-400">{p.vehicle}</span></Td>
                  <Td>{p.current_km.toLocaleString()} km</Td>
                  <Td className={p.km_remaining < 1000 ? "text-orange-400 font-semibold" : ""}>
                    {p.km_remaining.toLocaleString()} km
                  </Td>
                  <Td>{p.avg_daily_km.toLocaleString()} km/day</Td>
                  <Td className="text-white font-medium">{p.predicted_date}</Td>
                  <Td className="text-gray-500 text-xs">{p.lower_date} – {p.upper_date}</Td>
                  <Td>
                    <span className="text-xs bg-gray-800 px-2 py-0.5 rounded text-gray-400">{p.model_used}</span>
                  </Td>
                  <Td>
                    <span className={`text-xs font-semibold ${CONF_COLOR[p.confidence] ?? "text-gray-400"}`}>
                      {t(`confidence_${p.confidence.toLowerCase()}` as any)}
                    </span>
                  </Td>
                  <Td><StatusBadge status={p.status} /></Td>
                  <Td>
                    <Link href={`/predictions/${p.vehicle}`} className="text-blue-400 hover:text-blue-300">
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        )}
      </Card>
    </div>
  );
}
