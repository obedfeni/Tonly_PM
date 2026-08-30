"""
Async SQLAlchemy database layer.
Supports SQLite (local) and PostgreSQL (production on Render).
"""

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, JSON
from datetime import datetime
import os
import logging

logger = logging.getLogger(__name__)

# ── Build database URL ─────────────────────────────────────────────────────────
# Render sets DATABASE_URL as postgres:// but SQLAlchemy needs postgresql+asyncpg://
# For local dev, falls back to SQLite

def _get_db_url() -> str:
    url = os.environ.get("DATABASE_URL", "sqlite:///./tongli_pm.db")

    # Render PostgreSQL uses postgres:// — fix it
    if url.startswith("postgres://"):
        url = url.replace("postgres://", "postgresql+asyncpg://", 1)
    elif url.startswith("postgresql://") and "+asyncpg" not in url:
        url = url.replace("postgresql://", "postgresql+asyncpg://", 1)
    # SQLite — use aiosqlite
    elif url.startswith("sqlite:///"):
        url = url.replace("sqlite:///", "sqlite+aiosqlite:///", 1)

    return url


DB_URL = _get_db_url()
IS_SQLITE = "sqlite" in DB_URL

engine = create_async_engine(
    DB_URL,
    echo=False,
    # PostgreSQL connection pool settings
    **({} if IS_SQLITE else {
        "pool_size": 5,
        "max_overflow": 10,
        "pool_pre_ping": True,
    })
)

AsyncSessionLocal = async_sessionmaker(engine, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


# ── ORM Models ────────────────────────────────────────────────────────────────

class ChargingRecord(Base):
    __tablename__ = "charging_records"
    id          = Column(Integer, primary_key=True, autoincrement=True)
    date        = Column(DateTime, nullable=False)
    vehicle     = Column(String(20), nullable=False, index=True)
    odometer_km = Column(Float, nullable=False)
    kwh         = Column(Float, nullable=True)
    person      = Column(String(100), nullable=True)
    smu         = Column(Float, nullable=True)
    end_soc     = Column(String(10), nullable=True)
    remark      = Column(String(200), nullable=True)
    is_anomaly  = Column(Boolean, default=False)
    source      = Column(String(50), default="upload")
    created_at  = Column(DateTime, default=datetime.utcnow)


class PMConfig(Base):
    __tablename__ = "pm_config"
    id              = Column(Integer, primary_key=True, autoincrement=True)
    vehicle         = Column(String(20), unique=True, nullable=False)
    last_pm_km      = Column(Float, nullable=False)
    pm_interval_km  = Column(Float, nullable=False)
    pm_name         = Column(String(20), default="PM3")
    next_pm_target  = Column(Float, nullable=False)
    updated_at      = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class Prediction(Base):
    __tablename__ = "predictions"
    id              = Column(Integer, primary_key=True, autoincrement=True)
    vehicle         = Column(String(20), nullable=False, index=True)
    current_km      = Column(Float)
    pm_target_km    = Column(Float)
    km_remaining    = Column(Float)
    avg_daily_km    = Column(Float)
    predicted_days  = Column(Float)
    predicted_date  = Column(DateTime)
    lower_date      = Column(DateTime)
    upper_date      = Column(DateTime)
    model_used      = Column(String(50))
    model_mae_days  = Column(Float)
    confidence      = Column(String(20))
    status          = Column(String(20))
    features        = Column(JSON, nullable=True)
    created_at      = Column(DateTime, default=datetime.utcnow)


class ModelMetrics(Base):
    __tablename__ = "model_metrics"
    id          = Column(Integer, primary_key=True, autoincrement=True)
    vehicle     = Column(String(20), nullable=False)
    model_name  = Column(String(50), nullable=False)
    mae_km      = Column(Float)
    rmse_km     = Column(Float)
    mae_days    = Column(Float)
    r2          = Column(Float)
    n_samples   = Column(Integer)
    trained_at  = Column(DateTime, default=datetime.utcnow)


class AnomalyRecord(Base):
    __tablename__ = "anomalies"
    id          = Column(Integer, primary_key=True, autoincrement=True)
    vehicle     = Column(String(20), nullable=False)
    date        = Column(DateTime, nullable=False)
    odometer_km = Column(Float)
    daily_km    = Column(Float)
    reason      = Column(String(200))
    resolved    = Column(Boolean, default=False)
    created_at  = Column(DateTime, default=datetime.utcnow)


async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    logger.info(f"Database ready: {'SQLite' if IS_SQLITE else 'PostgreSQL'}")


async def get_db():
    async with AsyncSessionLocal() as session:
        yield session
