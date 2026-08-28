from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from typing import Optional
import pandas as pd
from datetime import datetime

from core.database import get_db, ChargingRecord, PMConfig, Prediction, ModelMetrics
from ml.engine import train_and_predict, run_all_predictions
from data.anomaly import detect_anomalies

router = APIRouter()


async def _load_df(db: AsyncSession) -> pd.DataFrame:
    """Load all charging records into a pandas DataFrame."""
    result = await db.execute(select(ChargingRecord).order_by(ChargingRecord.date))
    records = result.scalars().all()
    if not records:
        return pd.DataFrame()

    rows = [{
        "vehicle":      r.vehicle,
        "date":         pd.Timestamp(r.date),
        "odometer_km":  r.odometer_km,
        "daily_km":     None,
        "is_anomaly":   r.is_anomaly,
    } for r in records]

    df = pd.DataFrame(rows)
    df = detect_anomalies(df)
    return df


async def _load_pm_configs(db: AsyncSession):
    result = await db.execute(select(PMConfig))
    configs = result.scalars().all()
    return {c.vehicle: {"pm_target_km": c.next_pm_target, "pm_name": c.pm_name} for c in configs}


@router.get("/")
async def all_predictions(db: AsyncSession = Depends(get_db)):
    """Return cached predictions for all trucks."""
    result = await db.execute(
        select(Prediction).order_by(Prediction.predicted_date)
    )
    preds = result.scalars().all()

    return {
        "predictions": [
            {
                "vehicle":        p.vehicle,
                "current_km":     p.current_km,
                "pm_target_km":   p.pm_target_km,
                "km_remaining":   p.km_remaining,
                "avg_daily_km":   p.avg_daily_km,
                "predicted_days": p.predicted_days,
                "predicted_date": str(p.predicted_date)[:10] if p.predicted_date else None,
                "lower_date":     str(p.lower_date)[:10] if p.lower_date else None,
                "upper_date":     str(p.upper_date)[:10] if p.upper_date else None,
                "model_used":     p.model_used,
                "model_mae_days": p.model_mae_days,
                "confidence":     p.confidence,
                "status":         p.status,
                "created_at":     str(p.created_at)[:19],
            }
            for p in preds
        ],
        "total": len(preds),
    }


@router.post("/run")
async def run_predictions(
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
):
    """Trigger full prediction run for all configured trucks."""
    df = await _load_df(db)
    if df.empty:
        raise HTTPException(status_code=400, detail="No data loaded. Upload a file first.")

    pm_configs = await _load_pm_configs(db)
    if not pm_configs:
        raise HTTPException(status_code=400, detail="No PM configuration found. Configure trucks first.")

    results = run_all_predictions(df, pm_configs)

    # Persist predictions
    await db.execute(delete(Prediction))
    await db.execute(delete(ModelMetrics))

    for vehicle, pred in results.items():
        db.add(Prediction(
            vehicle=pred.vehicle,
            current_km=pred.current_km,
            pm_target_km=pred.pm_target_km,
            km_remaining=pred.km_remaining,
            avg_daily_km=pred.avg_daily_km,
            predicted_days=pred.predicted_days,
            predicted_date=datetime.strptime(pred.predicted_date, "%Y-%m-%d") if pred.predicted_date else None,
            lower_date=datetime.strptime(pred.lower_date, "%Y-%m-%d") if pred.lower_date else None,
            upper_date=datetime.strptime(pred.upper_date, "%Y-%m-%d") if pred.upper_date else None,
            model_used=pred.model_used,
            model_mae_days=pred.model_mae_days,
            confidence=pred.confidence,
            status=pred.status,
            features=pred.model_results,
        ))

        for mr in pred.model_results:
            db.add(ModelMetrics(
                vehicle=vehicle,
                model_name=mr["model_name"],
                mae_km=mr["mae_km"],
                rmse_km=mr["rmse_km"],
                mae_days=mr["mae_days"],
                r2=mr["r2"],
                n_samples=mr["n_samples"],
            ))

    await db.commit()

    return {
        "message":   f"Predictions complete for {len(results)} trucks.",
        "trucks":    list(results.keys()),
        "timestamp": datetime.utcnow().isoformat(),
    }


@router.get("/{vehicle}")
async def prediction_detail(vehicle: str, db: AsyncSession = Depends(get_db)):
    """Full prediction detail including chart data for one truck."""
    df = await _load_df(db)
    pm_configs = await _load_pm_configs(db)

    v = vehicle.upper()
    if v not in pm_configs:
        raise HTTPException(status_code=404, detail=f"No PM config for {v}.")

    cfg = pm_configs[v]
    pred = train_and_predict(df, v, cfg["pm_target_km"], cfg["pm_name"])
    if not pred:
        raise HTTPException(status_code=422, detail=f"Insufficient data to predict for {v}.")

    from dataclasses import asdict
    return asdict(pred)
