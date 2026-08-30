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

app = FastAPI(
    title="Tongli EV Fleet PM Prediction API",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
)

# ── CORS — must be added FIRST before any routes ──────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["*"],
)


# ── Routes — imported after middleware ────────────────────────────────────────
from api.routes import trucks, predictions, data_ingestion, model_performance, anomalies, settings

app.include_router(trucks.router,            prefix="/api/trucks",            tags=["Trucks"])
app.include_router(predictions.router,       prefix="/api/predictions",       tags=["Predictions"])
app.include_router(data_ingestion.router,    prefix="/api/data",              tags=["Data Ingestion"])
app.include_router(model_performance.router, prefix="/api/model-performance", tags=["ML Performance"])
app.include_router(anomalies.router,         prefix="/api/anomalies",         tags=["Anomalies"])
app.include_router(settings.router,          prefix="/api/settings",          tags=["Settings"])


@app.on_event("startup")
async def startup():
    try:
        from core.database import init_db
        await init_db()
        logger.info("Database initialised.")
    except Exception as e:
        logger.error(f"Database init error (non-fatal): {e}")


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled error: {traceback.format_exc()}")
    return JSONResponse(
        status_code=500,
        content={"detail": str(exc)},
        headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
            "Access-Control-Allow-Headers": "*",
        },
    )


@app.get("/")
async def root():
    return {"status": "ok", "message": "Tongli PM API is running"}


@app.get("/api/health")
async def health():
    return {"status": "ok", "service": "Tongli PM Prediction API", "version": "1.0.0"}


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
