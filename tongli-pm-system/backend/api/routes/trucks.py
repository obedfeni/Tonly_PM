from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import List
from core.database import get_db, ChargingRecord, PMConfig

router = APIRouter()


@router.get("/")
async def list_trucks(db: AsyncSession = Depends(get_db)):
    """List all trucks with their latest odometer and PM config."""
    result = await db.execute(
        select(
            ChargingRecord.vehicle,
            func.max(ChargingRecord.odometer_km).label("current_km"),
            func.max(ChargingRecord.date).label("last_seen"),
            func.count(ChargingRecord.id).label("total_records"),
        ).group_by(ChargingRecord.vehicle).order_by(ChargingRecord.vehicle)
    )
    rows = result.all()

    trucks = []
    for r in rows:
        pm_result = await db.execute(
            select(PMConfig).where(PMConfig.vehicle == r.vehicle)
        )
        pm = pm_result.scalar_one_or_none()

        trucks.append({
            "vehicle":       r.vehicle,
            "current_km":    round(r.current_km, 1),
            "last_seen":     str(r.last_seen)[:10],
            "total_records": r.total_records,
            "pm_name":       pm.pm_name if pm else "PM3",
            "pm_target_km":  pm.next_pm_target if pm else None,
            "last_pm_km":    pm.last_pm_km if pm else None,
            "pm_interval_km":pm.pm_interval_km if pm else None,
        })

    return {"trucks": trucks, "total": len(trucks)}


@router.get("/{vehicle}/history")
async def truck_history(vehicle: str, db: AsyncSession = Depends(get_db)):
    """Return full odometer history for a single truck."""
    result = await db.execute(
        select(ChargingRecord)
        .where(ChargingRecord.vehicle == vehicle.upper())
        .order_by(ChargingRecord.date)
    )
    records = result.scalars().all()
    if not records:
        raise HTTPException(status_code=404, detail=f"Truck {vehicle} not found.")

    return {
        "vehicle": vehicle.upper(),
        "records": [
            {
                "date":        str(r.date)[:10],
                "odometer_km": r.odometer_km,
                "kwh":         r.kwh,
                "person":      r.person,
                "is_anomaly":  r.is_anomaly,
                "remark":      r.remark,
            }
            for r in records
        ],
    }
