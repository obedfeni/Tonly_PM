from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, Form
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from typing import Optional
import pandas as pd
from datetime import datetime

from core.database import get_db, ChargingRecord
from data.ingestion import load_csv, load_excel, load_google_sheets
from data.anomaly import detect_anomalies

router = APIRouter()


async def _persist_df(df: pd.DataFrame, db: AsyncSession, replace: bool = False):
    """Save normalised DataFrame records to database."""
    if replace:
        await db.execute(delete(ChargingRecord))

    df = detect_anomalies(df)
    added = 0
    for _, row in df.iterrows():
        db.add(ChargingRecord(
            date=row["date"].to_pydatetime(),
            vehicle=row["vehicle"],
            odometer_km=float(row["odometer_km"]),
            kwh=float(row["kwh"]) if not pd.isna(row.get("kwh")) else None,
            person=str(row.get("person", "")) or None,
            smu=float(row["smu"]) if not pd.isna(row.get("smu")) else None,
            end_soc=str(row.get("end_soc", "")) or None,
            remark=str(row.get("remark", "")) or None,
            is_anomaly=bool(row.get("is_anomaly", False)),
            source=str(row.get("source", "upload")),
        ))
        added += 1

    await db.commit()
    return added


@router.post("/upload")
async def upload_file(
    file: UploadFile = File(...),
    replace: bool = Form(False),
    db: AsyncSession = Depends(get_db),
):
    """Upload CSV or Excel file."""
    content = await file.read()
    name = file.filename.lower()

    try:
        if name.endswith(".csv"):
            df = load_csv(content)
        elif name.endswith((".xlsx", ".xls")):
            df = load_excel(content)
        else:
            raise HTTPException(status_code=400, detail="Only .csv or .xlsx/.xls files are supported.")
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"Failed to parse file: {str(e)}")

    if df.empty:
        raise HTTPException(status_code=422, detail="No valid truck records found in file.")

    added = await _persist_df(df, db, replace=replace)
    trucks = df["vehicle"].unique().tolist()
    anomalies = int(df.get("is_anomaly", pd.Series([False])).sum()) if "is_anomaly" in df.columns else 0

    return {
        "message":        f"Loaded {added} records from {file.filename}.",
        "rows_added":     added,
        "trucks_found":   trucks,
        "anomalies_found": anomalies,
        "date_range": {
            "from": str(df["date"].min())[:10],
            "to":   str(df["date"].max())[:10],
        },
    }


@router.post("/google-sheets")
async def ingest_google_sheets(
    sheet_id: str = Form(...),
    worksheet: Optional[str] = Form(None),
    replace: bool = Form(False),
    db: AsyncSession = Depends(get_db),
):
    """Connect to Google Sheets and pull live data."""
    try:
        df = load_google_sheets(sheet_id, worksheet)
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"Google Sheets error: {str(e)}")

    if df.empty:
        raise HTTPException(status_code=422, detail="No valid truck records in the Google Sheet.")

    added = await _persist_df(df, db, replace=replace)

    return {
        "message":      f"Pulled {added} records from Google Sheets.",
        "rows_added":   added,
        "trucks_found": df["vehicle"].unique().tolist(),
    }


@router.get("/status")
async def data_status(db: AsyncSession = Depends(get_db)):
    from sqlalchemy import func
    result = await db.execute(
        select(
            func.count(ChargingRecord.id).label("total"),
            func.count(ChargingRecord.vehicle.distinct()).label("trucks"),
            func.min(ChargingRecord.date).label("earliest"),
            func.max(ChargingRecord.date).label("latest"),
            func.sum(ChargingRecord.is_anomaly.cast("integer")).label("anomalies"),
        )
    )
    r = result.one()
    return {
        "total_records": r.total,
        "trucks":        r.trucks,
        "date_from":     str(r.earliest)[:10] if r.earliest else None,
        "date_to":       str(r.latest)[:10] if r.latest else None,
        "anomalies":     r.anomalies or 0,
    }


@router.delete("/clear")
async def clear_data(db: AsyncSession = Depends(get_db)):
    await db.execute(delete(ChargingRecord))
    await db.commit()
    return {"message": "All charging records deleted."}
