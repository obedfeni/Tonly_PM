from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from core.database import get_db, ModelMetrics

router = APIRouter()


@router.get("/")
async def model_performance(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(ModelMetrics).order_by(ModelMetrics.vehicle, ModelMetrics.mae_days))
    metrics = result.scalars().all()

    # Aggregate across all trucks
    from collections import defaultdict
    agg = defaultdict(lambda: {"mae_km": [], "rmse_km": [], "mae_days": [], "r2": [], "wins": 0})
    best_per_truck = {}

    for m in metrics:
        agg[m.model_name]["mae_km"].append(m.mae_km)
        agg[m.model_name]["rmse_km"].append(m.rmse_km)
        agg[m.model_name]["mae_days"].append(m.mae_days)
        agg[m.model_name]["r2"].append(m.r2)

    # Count wins
    truck_metrics = defaultdict(list)
    for m in metrics:
        truck_metrics[m.vehicle].append(m)
    for truck, ms in truck_metrics.items():
        if ms:
            winner = min(ms, key=lambda x: x.mae_km)
            agg[winner.model_name]["wins"] += 1
            best_per_truck[truck] = winner.model_name

    import numpy as np
    summary = []
    for name, vals in agg.items():
        summary.append({
            "model_name":    name,
            "avg_mae_km":    round(float(np.mean(vals["mae_km"])), 2),
            "avg_rmse_km":   round(float(np.mean(vals["rmse_km"])), 2),
            "avg_mae_days":  round(float(np.mean(vals["mae_days"])), 2),
            "avg_r2":        round(float(np.mean(vals["r2"])), 3),
            "wins":          vals["wins"],
        })

    summary.sort(key=lambda x: x["avg_mae_km"])

    return {
        "model_summary":  summary,
        "best_per_truck": best_per_truck,
        "total_trucks":   len(truck_metrics),
    }
