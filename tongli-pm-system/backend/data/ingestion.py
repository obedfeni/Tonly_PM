"""
Data Ingestion Layer
Supports: Google Sheets API, CSV upload, Excel upload
Normalises to internal DataFrame schema regardless of source format.
"""

import pandas as pd
import numpy as np
import io
import logging
from typing import Optional
from core.config import settings

logger = logging.getLogger(__name__)

# ── Column aliases — covers all known variants across every log format ─────────
COL_ALIASES = {
    "date": [
        "date", "日期", "日期\ndate", "日期 date", "date 日期",
    ],
    "vehicle": [
        "vehicle", "vehicle number", "vehicle number\n", "车辆编号",
        "truck", "truck no", "truck id", "vehicle no",
        "车辆编号vehicle number", "车辆编号\nvehicle number",
    ],
    "odometer_km": [
        "kilometers", "km", "odometer", "odometer_km",
        "kilometers\n(odometer) ★", "kilometers (odometer)",
        "\nkilometers", "里程", "kilometers\nodometer",
        "odometer (km)", "current km",
    ],
    "kwh": [
        "kwh", "total electricity consumption (kwh)",
        "total electricity\nconsumption (kwh)",
        "总耗电（kwh)\ntotal electricity consumption (kwh)",
        "energy (kwh)", "electricity (kwh)",
        "total electricity consumption(kwh)",
    ],
    "person": [
        "person", "operator", "person in charge",
        "person in charge of charging",
        "person in charge\nof charging",
        "充电负责人person in charge of charging",
        "charging operator",
    ],
    "smu": [
        "smu", "service meter unit", "service meter unit (smu)",
        "service\nmeter unit",
    ],
    "end_soc": [
        "end soc", "end soc (%)", "final soc", "final soc (%)",
        "final soc\n(%)", "end battery level when finish charging(%)",
        "车辆结束充电时结束电量(%)", "soc", "final charge %",
    ],
    "remark": [
        "remark", "remarks", "备注remark", "备注",
        "note", "notes", "status",
    ],
}


def _find_col(df: pd.DataFrame, target: str) -> Optional[str]:
    aliases = [a.lower().strip() for a in COL_ALIASES.get(target, [target])]
    for col in df.columns:
        if str(col).lower().strip() in aliases:
            return col
    return None


def normalise(df: pd.DataFrame, source: str = "upload") -> pd.DataFrame:
    result = {}
    for field in ["date", "vehicle", "odometer_km", "kwh", "person", "smu", "end_soc", "remark"]:
        col = _find_col(df, field)
        result[field] = df[col] if col else np.nan

    out = pd.DataFrame(result)
    out["source"] = source

    # Coerce types
    out["date"]        = pd.to_datetime(out["date"], errors="coerce", dayfirst=True)
    out["odometer_km"] = pd.to_numeric(out["odometer_km"], errors="coerce")
    out["kwh"]         = pd.to_numeric(out["kwh"], errors="coerce")
    out["smu"]         = pd.to_numeric(out["smu"], errors="coerce")
    out["vehicle"]     = out["vehicle"].astype(str).str.strip().str.upper()

    # Fix typo: letter O instead of zero e.g. ETOO1 → ET001
    out["vehicle"] = out["vehicle"].str.replace(r"^ETOO", "ET00", regex=True)
    out["vehicle"] = out["vehicle"].str.replace(r"^ETO(\d)", r"ET0\1", regex=True)

    # Drop rows missing the three critical fields
    out = out.dropna(subset=["date", "vehicle", "odometer_km"])
    out = out[out["odometer_km"] > 0]
    out = out[out["vehicle"].str.match(r"^ET\d+$", na=False)]

    return out.sort_values(["vehicle", "date"]).reset_index(drop=True)


def _best_from_sheet(content: bytes, sheet: str) -> pd.DataFrame:
    """Try header rows 0-5, return the parse with the most valid truck rows."""
    best = pd.DataFrame()
    for header_row in range(6):
        try:
            raw  = pd.read_excel(io.BytesIO(content), sheet_name=sheet, header=header_row)
            norm = normalise(raw, source="excel")
            if len(norm) > len(best):
                best = norm
        except Exception:
            continue
    return best


def load_csv(content: bytes) -> pd.DataFrame:
    for sep in [",", "\t", ";"]:
        try:
            df   = pd.read_csv(io.BytesIO(content), sep=sep)
            norm = normalise(df, source="csv")
            if len(norm) > 0:
                return norm
        except Exception:
            continue
    raise ValueError("Could not parse CSV file.")


def load_excel(content: bytes) -> pd.DataFrame:
    try:
        xf = pd.ExcelFile(io.BytesIO(content))
    except Exception as e:
        raise ValueError(f"Cannot open Excel file: {e}")

    best = pd.DataFrame()
    for sheet in xf.sheet_names:
        norm = _best_from_sheet(content, sheet)
        if len(norm) > len(best):
            best = norm

    if len(best) == 0:
        raise ValueError(
            "No valid truck data found. "
            "File must contain columns: Date, Vehicle Number, Kilometers."
        )

    logger.info(f"Loaded {len(best)} records from Excel.")
    return best


def load_google_sheets(sheet_id: str, worksheet_name: Optional[str] = None) -> pd.DataFrame:
    import gspread
    from google.oauth2.service_account import Credentials
    import json

    creds_json = settings.GOOGLE_SHEETS_CREDENTIALS_JSON
    if not creds_json:
        raise RuntimeError("GOOGLE_SHEETS_CREDENTIALS_JSON is not configured.")

    creds = Credentials.from_service_account_info(
        json.loads(creds_json),
        scopes=[
            "https://www.googleapis.com/auth/spreadsheets.readonly",
            "https://www.googleapis.com/auth/drive.readonly",
        ],
    )
    gc  = gspread.authorize(creds)
    sh  = gc.open_by_key(sheet_id)
    ws  = sh.worksheet(worksheet_name) if worksheet_name else sh.get_worksheet(0)
    df  = pd.DataFrame(ws.get_all_records())
    return normalise(df, source="google_sheets")
