"use client";
import { useState, useCallback } from "react";
import { Upload, Link2, Database, CheckCircle, AlertTriangle, FileText } from "lucide-react";
import { useLang } from "@/lib/lang-context";
import { api } from "@/lib/api";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";

type UploadState = "idle" | "loading" | "success" | "error";

interface UploadResult {
  message: string;
  rows_added: number;
  trucks_found: string[];
  anomalies_found: number;
  date_range?: { from: string; to: string };
}

export default function DataPage() {
  const { t } = useLang();

  // File upload state
  const [file, setFile]               = useState<File | null>(null);
  const [replace, setReplace]         = useState(false);
  const [fileState, setFileState]     = useState<UploadState>("idle");
  const [fileResult, setFileResult]   = useState<UploadResult | null>(null);
  const [fileError, setFileError]     = useState("");

  // Google Sheets state
  const [sheetId, setSheetId]         = useState("");
  const [worksheet, setWorksheet]     = useState("");
  const [sheetReplace, setSheetReplace] = useState(false);
  const [sheetState, setSheetState]   = useState<UploadState>("idle");
  const [sheetResult, setSheetResult] = useState<UploadResult | null>(null);
  const [sheetError, setSheetError]   = useState("");

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f) setFile(f);
  }, []);

  const uploadFile = async () => {
    if (!file) return;
    setFileState("loading");
    setFileError("");
    try {
      const result = await api.uploadFile(file, replace);
      setFileResult(result);
      setFileState("success");
    } catch (e: any) {
      setFileError(e.message);
      setFileState("error");
    }
  };

  const connectSheets = async () => {
    if (!sheetId.trim()) return;
    setSheetState("loading");
    setSheetError("");
    try {
      const result = await api.connectSheets(sheetId.trim(), worksheet.trim(), sheetReplace);
      setSheetResult(result);
      setSheetState("success");
    } catch (e: any) {
      setSheetError(e.message);
      setSheetState("error");
    }
  };

  const ResultBox = ({ result, onClose }: { result: UploadResult; onClose: () => void }) => (
    <div className="mt-4 p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-4 h-4 text-green-400" />
            <span className="text-sm font-semibold text-green-300">Success</span>
          </div>
          <p className="text-sm text-gray-300">{result.message}</p>
          <div className="grid grid-cols-2 gap-x-6 gap-y-1 mt-2 text-xs text-gray-400">
            <span>Rows loaded: <strong className="text-white">{result.rows_added}</strong></span>
            <span>Anomalies: <strong className={result.anomalies_found > 0 ? "text-orange-400" : "text-white"}>{result.anomalies_found}</strong></span>
            {result.date_range && (
              <span className="col-span-2">
                Date range: <strong className="text-white">{result.date_range.from} → {result.date_range.to}</strong>
              </span>
            )}
            <span className="col-span-2">
              Trucks: <strong className="text-white">{result.trucks_found?.slice(0, 10).join(", ")}{(result.trucks_found?.length ?? 0) > 10 ? "..." : ""}</strong>
            </span>
          </div>
        </div>
        <button onClick={onClose} className="text-gray-500 hover:text-white text-lg leading-none">×</button>
      </div>
    </div>
  );

  return (
    <div className="p-8">
      <PageHeader
        title={t("nav_data")}
        subtitle="Upload a charging log file or connect directly to Google Sheets"
      />

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* File Upload */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-400" />
              <h2 className="text-base font-semibold text-white">{t("upload_title")}</h2>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">Accepts .xlsx, .xls, or .csv files</p>
          </CardHeader>
          <CardBody>
            {/* Drop zone */}
            <div
              onDrop={onDrop}
              onDragOver={e => e.preventDefault()}
              onClick={() => document.getElementById("file-input")?.click()}
              className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors mb-4
                ${file ? "border-blue-500/60 bg-blue-500/5" : "border-gray-700 hover:border-gray-500 hover:bg-gray-800/50"}`}
            >
              <input
                id="file-input"
                type="file"
                accept=".csv,.xlsx,.xls"
                className="hidden"
                onChange={e => e.target.files?.[0] && setFile(e.target.files[0])}
              />
              <Upload className="w-8 h-8 mx-auto mb-3 text-gray-500" />
              {file ? (
                <div>
                  <p className="text-sm font-semibold text-blue-300">{file.name}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{(file.size / 1024).toFixed(0)} KB — click to change</p>
                </div>
              ) : (
                <div>
                  <p className="text-sm text-gray-400">Drop file here or click to browse</p>
                  <p className="text-xs text-gray-600 mt-1">.xlsx · .xls · .csv</p>
                </div>
              )}
            </div>

            <label className="flex items-center gap-2 text-sm text-gray-400 mb-4 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={replace}
                onChange={e => setReplace(e.target.checked)}
                className="w-4 h-4 rounded border-gray-700 bg-gray-800 accent-blue-500"
              />
              {t("replace_data")}
            </label>

            <Button
              onClick={uploadFile}
              loading={fileState === "loading"}
              disabled={!file}
              className="w-full justify-center"
            >
              <Upload className="w-4 h-4" />
              Upload File
            </Button>

            {fileState === "error" && (
              <div className="mt-3 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm flex gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                {fileError}
              </div>
            )}
            {fileState === "success" && fileResult && (
              <ResultBox result={fileResult} onClose={() => { setFileState("idle"); setFileResult(null); }} />
            )}
          </CardBody>
        </Card>

        {/* Google Sheets */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Link2 className="w-4 h-4 text-green-400" />
              <h2 className="text-base font-semibold text-white">{t("google_sheets")}</h2>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">Requires Google Service Account credentials configured on the server</p>
          </CardHeader>
          <CardBody className="space-y-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">{t("sheet_id")}</label>
              <input
                value={sheetId}
                onChange={e => setSheetId(e.target.value)}
                placeholder="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500"
              />
              <p className="text-xs text-gray-600 mt-1">Found in the Google Sheets URL between /d/ and /edit</p>
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1.5">{t("worksheet")} <span className="text-gray-600">(optional)</span></label>
              <input
                value={worksheet}
                onChange={e => setWorksheet(e.target.value)}
                placeholder="Charging Log"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500"
              />
            </div>

            <label className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={sheetReplace}
                onChange={e => setSheetReplace(e.target.checked)}
                className="w-4 h-4 rounded border-gray-700 bg-gray-800 accent-blue-500"
              />
              {t("replace_data")}
            </label>

            <Button
              onClick={connectSheets}
              loading={sheetState === "loading"}
              disabled={!sheetId.trim()}
              variant="secondary"
              className="w-full justify-center"
            >
              <Link2 className="w-4 h-4" />
              {sheetState === "loading" ? t("connecting") : t("connect")}
            </Button>

            {sheetState === "error" && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm flex gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                {sheetError}
              </div>
            )}
            {sheetState === "success" && sheetResult && (
              <ResultBox result={sheetResult} onClose={() => { setSheetState("idle"); setSheetResult(null); }} />
            )}

            {/* Setup guide */}
            <div className="p-3 bg-gray-800/50 rounded-lg text-xs text-gray-500 space-y-1">
              <p className="font-semibold text-gray-400">Setup instructions:</p>
              <p>1. Create a Google Cloud Service Account</p>
              <p>2. Download the JSON credentials file</p>
              <p>3. Set <code className="text-blue-300">GOOGLE_SHEETS_CREDENTIALS_JSON</code> env var on backend</p>
              <p>4. Share the Google Sheet with the service account email</p>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Required column format */}
      <Card className="mt-6">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-purple-400" />
            <h2 className="text-sm font-semibold text-white">Required Data Format</h2>
          </div>
        </CardHeader>
        <CardBody>
          <p className="text-xs text-gray-400 mb-3">
            The system auto-detects column names in English or Chinese. At minimum, your file needs these three columns:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { field: "Date", aliases: ["Date", "日期"], desc: "The charging date (any format)" },
              { field: "Vehicle Number", aliases: ["Vehicle", "Vehicle Number", "车辆编号"], desc: "Truck ID — must start with ET (e.g. ET007)" },
              { field: "Kilometers", aliases: ["Kilometers", "KM", "Odometer", "里程"], desc: "Odometer reading in km" },
            ].map(({ field, aliases, desc }) => (
              <div key={field} className="bg-gray-800/50 rounded-lg p-3">
                <p className="text-sm font-semibold text-blue-300 mb-1">{field}</p>
                <p className="text-xs text-gray-400 mb-2">{desc}</p>
                <div className="flex flex-wrap gap-1">
                  {aliases.map(a => (
                    <span key={a} className="text-xs bg-gray-700 text-gray-300 px-1.5 py-0.5 rounded font-mono">{a}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
