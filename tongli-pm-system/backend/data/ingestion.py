"""
Data Ingestion Layer
Supports: Google Sheets API, CSV upload, Excel upload
Always normalises to the same internal DataFrame schema.
"""

import pandas as pd
import numpy as np
import io
import logging
from datetime import datetime
from typing import Optional
from core.config import settings

logger = logging.getLogger(__name__)

# ── Internal column schema ─────────────────────────────────────────────────────
SCHEMA = {
    "date":        "datetime64[ns]",
    "vehicle":     "object",
    "odometer_km": "float64",
    "kwh":         "float64",
    "person":      "object",
    "smu":         "float64",
    "end_soc":     "object",
    "remark":      "object",
}

# Possible column name aliases in the source spreadsheet
COL_ALIASES = {
    "date":        ["date", "日期", "日期\ndate", "日期 date"],
    "vehicle":     ["vehicle", "vehicle number", "车辆编号", "truck", "truck no", "truck id",
                    "车辆编号vehicle number"],
    "odometer_km": ["kilometers", "km", "odometer", "odometer_km", "kilometers\n(odometer) ★",
                    "\nkilometers"],
    "kwh":         ["kwh", "total electricity consumption (kwh)", "总耗电（kwh)\ntotal electricity consumption (kwh)",
                    "energy (kwh)"],
    "person":      ["person", "operator", "person in charge", "充电负责人person in charge of charging"],
    "smu":         ["smu", "service meter unit", "service meter unit (smu)", "service meter unit"],
    "end_soc":     ["end soc", "end soc (%)", "end battery level when finish charging(%)",
                    "车辆结束充电时结束电量(%)"],
    "remark":      ["remark", "remarks", "备注remark", "备注"],
}


def _find_col(df: pd.DataFrame, target: str) -> Optional[str]:
    """Find the actual column name in df for the given target key."""
    aliases = [a.lower().strip() for a in COL_ALIASES.get(target, [target])]
    for col in df.columns:
        if col.lower().strip() in aliases:
            return col
    return None


def normalise(df: pd.DataFrame, source: str = "upload") -> pd.DataFrame:
    """
    Map raw column names → internal schema.
    Returns clean DataFrame with columns: date, vehicle, odometer_km, ...
    """
    result = {}

    for field in SCHEMA:
        col = _find_col(df, field)
        if col:
            result[field] = df[col]
        else:
            result[field] = np.nan

    out = pd.DataFrame(result)
    out["source"] = source

    # ── Coerce types ──────────────────────────────────────────────────────────
    out["date"] = pd.to_datetime(out["date"], errors="coerce", dayfirst=True)
    out["odometer_km"] = pd.to_numeric(out["odometer_km"], errors="coerce")
    out["kwh"] = pd.to_numeric(out["kwh"], errors="coerce")
    out["smu"] = pd.to_numeric(out["smu"], errors="coerce")
    out["vehicle"] = out["vehicle"].astype(str).str.strip().str.upper()

    # Drop rows with no date or vehicle or odometer
    out = out.dropna(subset=["date", "vehicle", "odometer_km"])
    out = out[out["odometer_km"] > 0]
    out = out[out["vehicle"].str.startswith("ET")]

    out = out.sort_values(["vehicle", "date"]).reset_index(drop=True)
    return out


def load_csv(content: bytes) -> pd.DataFrame:
    df = pd.read_csv(io.BytesIO(content))
    return normalise(df, source="csv")


def load_excel(content: bytes) -> pd.DataFrame:
    # Try each sheet; pick the one with the most truck rows
    xf = pd.ExcelFile(io.BytesIO(content))
    best = None
    best_count = 0
    for sheet in xf.sheet_names:
        try:
            raw = pd.read_excel(io.BytesIO(content), sheet_name=sheet)
            norm = normalise(raw, source="excel")
            if len(norm) > best_count:
                best = norm
                best_count = len(norm)
        except Exception:
            continue
    if best is None or best_count == 0:
        raise ValueError("No valid truck data found in the Excel file.")
    return best


def load_google_sheets(sheet_id: str, worksheet_name: Optional[str] = None) -> pd.DataFrame:
    """
    Fetch live data from Google Sheets via the gspread library.
    Requires GOOGLE_SHEETS_CREDENTIALS_JSON env var (service-account JSON).
    """
    import gspread
    from google.oauth2.service_account import Credentials
    import json

    creds_json = settings.GOOGLE_SHEETS_CREDENTIALS_JSON
    if not creds_json:
        raise RuntimeError("GOOGLE_SHEETS_CREDENTIALS_JSON is not configured.")

    creds_dict = json.loads(creds_json)
    scopes = [
        "https://www.googleapis.com/auth/spreadsheets.readonly",
        "https://www.googleapis.com/auth/drive.readonly",
    ]
    creds = Credentials.from_service_account_info(creds_dict, scopes=scopes)
    gc = gspread.authorize(creds)
    sh = gc.open_by_key(sheet_id)

    ws = sh.worksheet(worksheet_name) if worksheet_name else sh.get_worksheet(0)
    records = ws.get_all_records()
    df = pd.DataFrame(records)
    return normalise(df, source="google_sheets")
