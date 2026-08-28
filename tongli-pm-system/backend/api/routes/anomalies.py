from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from core.database import get_db, ChargingRecord

router = APIRouter()


@router.get("/")
async def list_anomalies(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(ChargingRecord).where(ChargingRecord.is_anomaly == True).order_by(ChargingRecord.date.desc())
    )
    records = result.scalars().all()
    return {
        "anomalies": [
            {
                "vehicle":     r.vehicle,
                "date":        str(r.date)[:10],
                "odometer_km": r.odometer_km,
                "remark":      r.remark,
                "source":      r.source,
            }
            for r in records
        ],
        "total": len(records),
    }
