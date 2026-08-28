"use client";
import { useEffect, useState } from "react";
import { Settings, Plus, Save, Trash2, Info } from "lucide-react";
import { useLang } from "@/lib/lang-context";
import { api, type PMConfigRow, type PMConfigIn } from "@/lib/api";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { PageSpinner } from "@/components/ui/Spinner";

interface EditRow extends PMConfigIn { id: number; }

const FLEET = Array.from({ length: 30 }, (_, i) => `ET${String(i + 1).padStart(3, "0")}`);

export default function SettingsPage() {
  const { t } = useLang();
  const [rows, setRows]       = useState<EditRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [saved, setSaved]     = useState(false);
  const [error, setError]     = useState("");

  useEffect(() => {
    api.pmConfig()
      .then(r => {
        setRows(r.configs.map((c, i) => ({
          id: i,
          vehicle:        c.vehicle,
          last_pm_km:     c.last_pm_km,
          pm_interval_km: c.pm_interval_km,
          pm_name:        c.pm_name,
        })));
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const addRow = () => {
    const used = new Set(rows.map(r => r.vehicle));
    const next = FLEET.find(v => !used.has(v)) ?? "ET001";
    setRows(prev => [...prev, { id: Date.now(), vehicle: next, last_pm_km: 15000, pm_interval_km: 5000, pm_name: "PM3" }]);
  };

  const removeRow = (id: number) => setRows(prev => prev.filter(r => r.id !== id));

  const updateRow = (id: number, field: keyof PMConfigIn, value: string | number) => {
    setRows(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r));
  };

  const save = async () => {
    setSaving(true);
    setError("");
    setSaved(false);
    try {
      const payload: PMConfigIn[] = rows.map(({ id, ...rest }) => rest);
      await api.savePmConfig(payload);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8"><PageSpinner /></div>;

  return (
    <div className="p-8">
      <PageHeader
        title={t("nav_settings")}
        subtitle={t("configure_pm")}
        action={
          <div className="flex gap-3">
            <Button variant="secondary" onClick={addRow}>
              <Plus className="w-4 h-4" /> {t("add_truck")}
            </Button>
            <Button onClick={save} loading={saving}>
              <Save className="w-4 h-4" />
              {saving ? t("saving") : t("save")}
            </Button>
          </div>
        }
      />

      {saved && (
        <div className="mb-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg text-green-400 text-sm">
          ✓ Configuration saved successfully.
        </div>
      )}
      {error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">{error}</div>
      )}

      {/* Info box */}
      <div className="mb-5 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg flex gap-2 text-sm text-blue-300">
        <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
        <span>
          Enter each truck&apos;s last completed PM odometer reading and the interval.
          The system calculates <strong>Next PM Target = Last PM + Interval</strong>.
          After saving, go to the Dashboard and click <strong>Run AI Predictions</strong>.
        </span>
      </div>

      <Card>
        <CardHeader>
          <div className="grid grid-cols-12 gap-3 text-xs text-gray-500 uppercase tracking-wider">
            <div className="col-span-3">{t("vehicle")}</div>
            <div className="col-span-2">{t("pm_name")}</div>
            <div className="col-span-3">{t("last_pm")} (km)</div>
            <div className="col-span-3">{t("pm_interval")} (km)</div>
            <div className="col-span-1">Next Target</div>
          </div>
        </CardHeader>
        <CardBody className="divide-y divide-gray-800 py-0">
          {rows.length === 0 && (
            <div className="py-12 text-center text-gray-500 text-sm">
              No trucks configured. Click &quot;Add Truck&quot; to start.
            </div>
          )}
          {rows.map(row => {
            const target = (row.last_pm_km || 0) + (row.pm_interval_km || 0);
            return (
              <div key={row.id} className="grid grid-cols-12 gap-3 py-3 items-center">
                {/* Vehicle */}
                <div className="col-span-3">
                  <select
                    value={row.vehicle}
                    onChange={e => updateRow(row.id, "vehicle", e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 rounded-md px-3 py-1.5 text-sm text-white focus:outline-none focus:border-blue-500"
                  >
                    {FLEET.map(v => <option key={v} value={v}>{v}</option>)}
                  </select>
                </div>
                {/* PM Name */}
                <div className="col-span-2">
                  <input
                    value={row.pm_name}
                    onChange={e => updateRow(row.id, "pm_name", e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 rounded-md px-3 py-1.5 text-sm text-white focus:outline-none focus:border-blue-500"
                    placeholder="PM3"
                  />
                </div>
                {/* Last PM KM */}
                <div className="col-span-3">
                  <input
                    type="number"
                    value={row.last_pm_km}
                    onChange={e => updateRow(row.id, "last_pm_km", Number(e.target.value))}
                    className="w-full bg-gray-800 border border-gray-700 rounded-md px-3 py-1.5 text-sm text-white focus:outline-none focus:border-blue-500"
                    placeholder="15000"
                  />
                </div>
                {/* Interval */}
                <div className="col-span-3">
                  <input
                    type="number"
                    value={row.pm_interval_km}
                    onChange={e => updateRow(row.id, "pm_interval_km", Number(e.target.value))}
                    className="w-full bg-gray-800 border border-gray-700 rounded-md px-3 py-1.5 text-sm text-white focus:outline-none focus:border-blue-500"
                    placeholder="5000"
                  />
                </div>
                {/* Target (read-only) */}
                <div className="col-span-1 flex items-center justify-between gap-2">
                  <span className="text-xs text-blue-300 font-semibold">{target.toLocaleString()}</span>
                  <button onClick={() => removeRow(row.id)} className="text-gray-600 hover:text-red-400 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </CardBody>
      </Card>
    </div>
  );
}
