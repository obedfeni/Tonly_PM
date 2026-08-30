"""
Tongli EV Fleet PM Prediction System — FastAPI Backend
"""

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn
import logging
import traceback

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ── App ───────────────────────────────────────────────────────────────────────
app = FastAPI(
    title="Tongli EV Fleet PM Prediction API",
    description="AI-powered predictive maintenance for EV mining trucks",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
)

# ── CORS — added FIRST, before routes ────────────────────────────────────────
# allow_credentials MUST be False when allow_origins=["*"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=3600,
)

# ── Routes ────────────────────────────────────────────────────────────────────
from api.routes import (
    trucks, predictions, data_ingestion,
    model_performance, anomalies, settings,
)

app.include_router(trucks.router,            prefix="/api/trucks",            tags=["Trucks"])
app.include_router(predictions.router,       prefix="/api/predictions",       tags=["Predictions"])
app.include_router(data_ingestion.router,    prefix="/api/data",              tags=["Data"])
app.include_router(model_performance.router, prefix="/api/model-performance", tags=["ML"])
app.include_router(anomalies.router,         prefix="/api/anomalies",         tags=["Anomalies"])
app.include_router(settings.router,          prefix="/api/settings",          tags=["Settings"])


# ── Startup ───────────────────────────────────────────────────────────────────
@app.on_event("startup")
async def startup():
    try:
        from core.database import init_db
        await init_db()
        logger.info("Tongli PM Prediction System ready.")
    except Exception as e:
        # Log but don't crash — CORS must stay alive even if DB fails
        logger.error(f"Startup error: {e}\n{traceback.format_exc()}")


# ── Global error handler — always returns CORS headers ───────────────────────
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(traceback.format_exc())
    return JSONResponse(
        status_code=500,
        content={"detail": str(exc)},
        headers={"Access-Control-Allow-Origin": "*"},
    )


# ── Health routes ─────────────────────────────────────────────────────────────
@app.get("/")
async def root():
    return {"status": "ok", "message": "Tongli PM API running"}


@app.get("/api/health")
async def health():
    try:
        from core.database import engine
        async with engine.connect() as conn:
            await conn.execute(__import__("sqlalchemy").text("SELECT 1"))
        db_status = "connected"
    except Exception as e:
        db_status = f"error: {str(e)}"

    return {
        "status": "ok",
        "service": "Tongli PM Prediction API",
        "version": "1.0.0",
        "database": db_status,
    }


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
