from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from typing import List
from datetime import datetime

from core.database import get_db, PMConfig

router = APIRouter()


class PMConfigIn(BaseModel):
    vehicle: str
    last_pm_km: float
    pm_interval_km: float
    pm_name: str = "PM3"


@router.get("/pm-config")
async def get_pm_config(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(PMConfig).order_by(PMConfig.vehicle))
    configs = result.scalars().all()
    return {
        "configs": [
            {
                "vehicle":        c.vehicle,
                "last_pm_km":     c.last_pm_km,
                "pm_interval_km": c.pm_interval_km,
                "pm_name":        c.pm_name,
                "next_pm_target": c.next_pm_target,
                "updated_at":     str(c.updated_at)[:19],
            }
            for c in configs
        ]
    }


@router.post("/pm-config")
async def upsert_pm_config(configs: List[PMConfigIn], db: AsyncSession = Depends(get_db)):
    for cfg in configs:
        existing = await db.execute(
            select(PMConfig).where(PMConfig.vehicle == cfg.vehicle.upper())
        )
        row = existing.scalar_one_or_none()
        target = cfg.last_pm_km + cfg.pm_interval_km

        if row:
            row.last_pm_km     = cfg.last_pm_km
            row.pm_interval_km = cfg.pm_interval_km
            row.pm_name        = cfg.pm_name
            row.next_pm_target = target
            row.updated_at     = datetime.utcnow()
        else:
            db.add(PMConfig(
                vehicle=cfg.vehicle.upper(),
                last_pm_km=cfg.last_pm_km,
                pm_interval_km=cfg.pm_interval_km,
                pm_name=cfg.pm_name,
                next_pm_target=target,
            ))

    await db.commit()
    return {"message": f"Saved {len(configs)} PM configurations."}
