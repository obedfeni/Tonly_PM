from pydantic_settings import BaseSettings
from typing import Optional
import os


class Settings(BaseSettings):
    # App
    APP_NAME: str = "Tongli PM Prediction System"
    DEBUG: bool = False

    # Database
    DATABASE_URL: str = "sqlite:///./tongli_pm.db"

    # Google Sheets
    GOOGLE_SHEETS_CREDENTIALS_JSON: Optional[str] = None
    GOOGLE_SHEETS_ID: Optional[str] = None

    # ML
    MODEL_RETRAIN_INTERVAL_HOURS: int = 24
    ANOMALY_THRESHOLD_KM: float = 3000.0   # flag daily jump > 3000 km
    MIN_DATA_POINTS: int = 5               # minimum rows before ML trains

    # PM Defaults
    DEFAULT_PM_INTERVAL_KM: float = 5000.0
    PM_ALERT_DAYS_RED: int = 7
    PM_ALERT_DAYS_ORANGE: int = 14
    PM_ALERT_DAYS_YELLOW: int = 30

    class Config:
        env_file = ".env"


settings = Settings()
