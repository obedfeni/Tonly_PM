"""
Tongli EV Fleet PM Prediction System — FastAPI Backend
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import logging

from api.routes import trucks, predictions, data_ingestion, model_performance, anomalies, settings
from core.config import settings as app_settings
from core.database import init_db

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Tongli EV Fleet PM Prediction API",
    description="AI-powered predictive maintenance for EV mining trucks",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
)

# ── CORS — allow all origins ──────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(trucks.router,            prefix="/api/trucks",            tags=["Trucks"])
app.include_router(predictions.router,       prefix="/api/predictions",       tags=["Predictions"])
app.include_router(data_ingestion.router,    prefix="/api/data",              tags=["Data Ingestion"])
app.include_router(model_performance.router, prefix="/api/model-performance", tags=["ML Performance"])
app.include_router(anomalies.router,         prefix="/api/anomalies",         tags=["Anomalies"])
app.include_router(settings.router,          prefix="/api/settings",          tags=["Settings"])


@app.on_event("startup")
async def startup():
    logger.info("Initialising database...")
    await init_db()
    logger.info("Tongli PM Prediction System ready.")


@app.get("/")
async def root():
    return {"status": "ok", "message": "Tongli PM API is running"}


@app.get("/api/health")
async def health():
    return {
        "status": "ok",
        "service": "Tongli PM Prediction API",
        "version": "1.0.0"
    }


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
