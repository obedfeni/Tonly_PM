const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

async function req<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail ?? "API error");
  }
  return res.json() as Promise<T>;
}

export const api = {
  health:           ()          => req<{ status: string }>("/api/health"),
  dataStatus:       ()          => req<DataStatus>("/api/data/status"),
  listTrucks:       ()          => req<TrucksResponse>("/api/trucks/"),
  truckHistory:     (v: string) => req<TruckHistory>(`/api/trucks/${v}/history`),
  allPredictions:   ()          => req<PredictionsResponse>("/api/predictions/"),
  runPredictions:   ()          => req<RunResult>("/api/predictions/run", { method: "POST" }),
  predictionDetail: (v: string) => req<PredictionDetail>(`/api/predictions/${v}`),
  anomalies:        ()          => req<AnomalyResponse>("/api/anomalies/"),
  modelPerformance: ()          => req<ModelPerf>("/api/model-performance/"),
  pmConfig:         ()          => req<PMConfigResponse>("/api/settings/pm-config"),
  savePmConfig: (data: PMConfigIn[]) =>
    req("/api/settings/pm-config", { method: "POST", body: JSON.stringify(data) }),

  uploadFile: async (file: File, replace: boolean) => {
    const fd = new FormData();
    fd.append("file", file);
    fd.append("replace", String(replace));
    const res = await fetch(`${BASE}/api/data/upload`, { method: "POST", body: fd });
    if (!res.ok) { const e = await res.json(); throw new Error(e.detail ?? "Upload failed"); }
    return res.json();
  },

  connectSheets: async (sheetId: string, worksheet: string, replace: boolean) => {
    const fd = new FormData();
    fd.append("sheet_id", sheetId);
    fd.append("worksheet", worksheet);
    fd.append("replace", String(replace));
    const res = await fetch(`${BASE}/api/data/google-sheets`, { method: "POST", body: fd });
    if (!res.ok) { const e = await res.json(); throw new Error(e.detail ?? "Connection failed"); }
    return res.json();
  },
};

export interface DataStatus { total_records: number; trucks: number; date_from: string; date_to: string; anomalies: number; }
export interface TrucksResponse { trucks: Truck[]; total: number; }
export interface Truck { vehicle: string; current_km: number; last_seen: string; total_records: number; pm_name: string; pm_target_km: number | null; last_pm_km: number | null; pm_interval_km: number | null; }
export interface TruckHistory { vehicle: string; records: HistoryRecord[]; }
export interface HistoryRecord { date: string; odometer_km: number; kwh: number | null; person: string | null; is_anomaly: boolean; remark: string | null; }
export interface PredictionsResponse { predictions: PredRow[]; total: number; }
export interface PredRow { vehicle: string; current_km: number; pm_target_km: number; km_remaining: number; avg_daily_km: number; predicted_days: number; predicted_date: string; lower_date: string; upper_date: string; model_used: string; model_mae_days: number; confidence: string; status: string; created_at: string; }
export interface RunResult { message: string; trucks: string[]; timestamp: string; }
export interface PredictionDetail extends PredRow { model_results: ModelResult[]; daily_km_history: DailyKm[]; future_odometer: OdometerPoint[]; }
export interface ModelResult { model_name: string; mae_km: number; rmse_km: number; mae_days: number; r2: number; n_samples: number; }
export interface DailyKm { date: string; daily_km: number; }
export interface OdometerPoint { date: string; odometer_km: number; predicted: boolean; }
export interface AnomalyResponse { anomalies: AnomalyRow[]; total: number; }
export interface AnomalyRow { vehicle: string; date: string; odometer_km: number; remark: string | null; source: string; }
export interface ModelPerf { model_summary: ModelSummary[]; best_per_truck: Record<string, string>; total_trucks: number; }
export interface ModelSummary { model_name: string; avg_mae_km: number; avg_rmse_km: number; avg_mae_days: number; avg_r2: number; wins: number; }
export interface PMConfigResponse { configs: PMConfigRow[]; }
export interface PMConfigRow { vehicle: string; last_pm_km: number; pm_interval_km: number; pm_name: string; next_pm_target: number; updated_at: string; }
export interface PMConfigIn { vehicle: string; last_pm_km: number; pm_interval_km: number; pm_name: string; }
