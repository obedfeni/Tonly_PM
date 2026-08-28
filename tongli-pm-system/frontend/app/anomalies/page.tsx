"use client";
import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle } from "lucide-react";
import { useLang } from "@/lib/lang-context";
import { api, type AnomalyRow } from "@/lib/api";
import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { PageSpinner } from "@/components/ui/Spinner";
import { EmptyState } from "@/components/ui/EmptyState";
import { Table, Thead, Tbody, Th, Td, Tr } from "@/components/ui/Table";

export default function AnomaliesPage() {
  const { t } = useLang();
  const [anomalies, setAnomalies] = useState<AnomalyRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.anomalies()
      .then(r => setAnomalies(r.anomalies))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8"><PageSpinner /></div>;

  return (
    <div className="p-8">
      <PageHeader
        title={t("nav_anomalies")}
        subtitle={`${anomalies.length} anomalies detected in dataset`}
      />

      {anomalies.length === 0 ? (
        <EmptyState
          icon={<CheckCircle className="w-16 h-16 text-green-500" />}
          title={t("no_anomalies")}
          description="All odometer readings look clean."
        />
      ) : (
        <Card>
          <Table>
            <Thead>
              <tr>
                <Th>{t("vehicle")}</Th>
                <Th>{t("anomaly_date")}</Th>
                <Th>Odometer</Th>
                <Th>{t("anomaly_reason")}</Th>
                <Th>Source</Th>
              </tr>
            </Thead>
            <Tbody>
              {anomalies.map((a, i) => (
                <Tr key={i}>
                  <Td><span className="font-bold text-orange-400">{a.vehicle}</span></Td>
                  <Td>{a.date}</Td>
                  <Td>{a.odometer_km.toLocaleString()} km</Td>
                  <Td>
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-3.5 h-3.5 text-orange-400 flex-shrink-0" />
                      <span className="text-xs text-orange-300">{a.remark || "—"}</span>
                    </div>
                  </Td>
                  <Td><span className="text-xs bg-gray-800 px-2 py-0.5 rounded text-gray-500">{a.source}</span></Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Card>
      )}
    </div>
  );
}
