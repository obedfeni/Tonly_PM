"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Truck, ChevronRight } from "lucide-react";
import { useLang } from "@/lib/lang-context";
import { api, type Truck as TruckType } from "@/lib/api";
import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { PageSpinner } from "@/components/ui/Spinner";
import { EmptyState } from "@/components/ui/EmptyState";
import { Table, Thead, Tbody, Th, Td, Tr } from "@/components/ui/Table";

export default function TrucksPage() {
  const { t } = useLang();
  const [trucks, setTrucks] = useState<TruckType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    api.listTrucks()
      .then(r => setTrucks(r.trucks))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const filtered = trucks.filter(t =>
    t.vehicle.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="p-8"><PageSpinner /></div>;

  return (
    <div className="p-8">
      <PageHeader
        title={t("nav_trucks")}
        subtitle={`${trucks.length} vehicles in fleet`}
      />

      {error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">{error}</div>
      )}

      <div className="mb-4">
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search vehicle (e.g. ET007)..."
          className="w-64 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
        />
      </div>

      <Card>
        {filtered.length === 0 ? (
          <EmptyState
            icon={<Truck className="w-12 h-12" />}
            title={t("no_data")}
            description="Upload a charging log to see truck data."
          />
        ) : (
          <Table>
            <Thead>
              <tr>
                <Th>{t("vehicle")}</Th>
                <Th>{t("current_km")}</Th>
                <Th>{t("pm_target")}</Th>
                <Th>{t("km_remaining")}</Th>
                <Th>Records</Th>
                <Th>Last Seen</Th>
                <Th></Th>
              </tr>
            </Thead>
            <Tbody>
              {filtered.map(truck => {
                const remaining = truck.pm_target_km
                  ? Math.max(0, truck.pm_target_km - truck.current_km)
                  : null;
                return (
                  <Tr key={truck.vehicle}>
                    <Td>
                      <span className="font-bold text-blue-400">{truck.vehicle}</span>
                    </Td>
                    <Td>{truck.current_km.toLocaleString()} km</Td>
                    <Td>
                      {truck.pm_target_km
                        ? <span className="text-white">{truck.pm_target_km.toLocaleString()} km</span>
                        : <span className="text-gray-600">—</span>
                      }
                    </Td>
                    <Td>
                      {remaining !== null
                        ? <span className={remaining < 1000 ? "text-orange-400 font-semibold" : "text-gray-300"}>
                            {remaining.toLocaleString()} km
                          </span>
                        : <span className="text-gray-600">—</span>
                      }
                    </Td>
                    <Td className="text-gray-500">{truck.total_records}</Td>
                    <Td className="text-gray-500">{truck.last_seen}</Td>
                    <Td>
                      <Link
                        href={`/predictions/${truck.vehicle}`}
                        className="inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300"
                      >
                        {t("view_detail")} <ChevronRight className="w-3 h-3" />
                      </Link>
                    </Td>
                  </Tr>
                );
              })}
            </Tbody>
          </Table>
        )}
      </Card>
    </div>
  );
}
