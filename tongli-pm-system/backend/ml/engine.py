"""
ML Engine: trains Linear Regression, Random Forest, and XGBoost per truck.
Selects the best model by MAE, then projects future odometer to predict PM date.
"""

import pandas as pd
import numpy as np
import joblib
import os
import logging
from datetime import datetime, timedelta
from typing import Dict, Optional, Tuple, List
from dataclasses import dataclass, field, asdict

from sklearn.linear_model import LinearRegression
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.model_selection import TimeSeriesSplit
from xgboost import XGBRegressor

from ml.features import build_features, prepare_X_y, FEATURE_COLS
from core.config import settings

logger = logging.getLogger(__name__)

MODEL_DIR = os.path.join(os.path.dirname(__file__), "saved_models")
os.makedirs(MODEL_DIR, exist_ok=True)


@dataclass
class ModelResult:
    model_name: str
    mae_km: float
    rmse_km: float
    r2: float
    mae_days: float
    n_samples: int


@dataclass
class PMPrediction:
    vehicle: str
    current_km: float
    pm_target_km: float
    km_remaining: float
    avg_daily_km: float
    predicted_days: float
    predicted_date: str
    lower_date: str
    upper_date: str
    model_used: str
    model_mae_days: float
    confidence: str
    status: str
    model_results: List[Dict] = field(default_factory=list)
    daily_km_history: List[Dict] = field(default_factory=list)
    future_odometer: List[Dict] = field(default_factory=list)


def _build_models():
    return {
        "LinearRegression": LinearRegression(),
        "RandomForest": RandomForestRegressor(
            n_estimators=200, max_depth=8, min_samples_leaf=2,
            random_state=42, n_jobs=-1
        ),
        "XGBoost": XGBRegressor(
            n_estimators=300, learning_rate=0.05, max_depth=6,
            subsample=0.8, colsample_bytree=0.8,
            random_state=42, verbosity=0, n_jobs=-1
        ),
    }


def _evaluate_model(model, X, y, tscv: TimeSeriesSplit) -> Tuple[float, float, float]:
    maes, rmses, r2s = [], [], []
    for train_idx, test_idx in tscv.split(X):
        Xtr, Xte = X.iloc[train_idx], X.iloc[test_idx]
        ytr, yte = y.iloc[train_idx], y.iloc[test_idx]
        if len(Xtr) < 3:
            continue
        model.fit(Xtr, ytr)
        pred = model.predict(Xte)
        pred = np.clip(pred, 0, None)
        maes.append(mean_absolute_error(yte, pred))
        rmses.append(np.sqrt(mean_squared_error(yte, pred)))
        r2s.append(r2_score(yte, pred))

    return (
        float(np.mean(maes))  if maes  else 9999.0,
        float(np.mean(rmses)) if rmses else 9999.0,
        float(np.mean(r2s))   if r2s   else 0.0,
    )


def train_and_predict(
    df: pd.DataFrame,
    vehicle: str,
    pm_target_km: float,
    pm_name: str = "PM3",
) -> Optional[PMPrediction]:
    """
    Train all three models on the truck's history, pick the best by MAE,
    then project forward until the truck reaches pm_target_km.
    """
    feat_df = build_features(df, vehicle)
    if feat_df.empty or len(feat_df) < settings.MIN_DATA_POINTS:
        logger.warning(f"{vehicle}: insufficient data ({len(feat_df)} rows).")
        return None

    X, y = prepare_X_y(feat_df)
    current_km = feat_df["odometer_km"].iloc[-1]

    if current_km >= pm_target_km:
        km_remaining = 0.0
    else:
        km_remaining = pm_target_km - current_km

    tscv = TimeSeriesSplit(n_splits=min(5, max(2, len(X) // 3)))
    models = _build_models()
    results: List[ModelResult] = []

    for name, m in models.items():
        mae_km, rmse_km, r2 = _evaluate_model(m, X, y, tscv)
        # Rough conversion: divide km error by avg daily km
        avg_dk = float(y[y > 0].mean()) if (y > 0).any() else 100.0
        mae_days = mae_km / avg_dk if avg_dk > 0 else 99.9
        results.append(ModelResult(
            model_name=name, mae_km=mae_km, rmse_km=rmse_km,
            r2=r2, mae_days=mae_days, n_samples=len(X)
        ))

    # Select best by mae_km
    best_result = min(results, key=lambda r: r.mae_km)
    best_model = models[best_result.model_name]
    best_model.fit(X, y)  # retrain on full data

    # Save model
    model_path = os.path.join(MODEL_DIR, f"{vehicle}_{best_result.model_name}.pkl")
    joblib.dump(best_model, model_path)

    # ── Project future odometer ───────────────────────────────────────────────
    avg_daily_km = float(feat_df["rolling_30"].iloc[-1]) if feat_df["rolling_30"].iloc[-1] > 0 \
                   else float(y[y > 0].mean()) if (y > 0).any() else 100.0

    # Build synthetic future feature rows
    last_row = feat_df.iloc[-1]
    last_date = pd.Timestamp(last_row["date"])
    future_records = []
    simulated_km = current_km
    days_ahead = 0
    max_days = 365

    while simulated_km < pm_target_km and days_ahead < max_days:
        days_ahead += 1
        future_date = last_date + timedelta(days=days_ahead)
        future_feat = {
            "day_of_week":    future_date.dayofweek,
            "month":          future_date.month,
            "days_elapsed":   float(last_row["days_elapsed"]) + days_ahead,
            "rolling_7":      avg_daily_km,
            "rolling_14":     avg_daily_km,
            "rolling_30":     avg_daily_km,
            "trend_7":        float(last_row["trend_7"]),
            "trend_30":       float(last_row["trend_30"]),
            "cumulative_km":  float(last_row["cumulative_km"]) + (days_ahead * avg_daily_km),
            "days_since_last": 1.0,
            "utilization_30d": float(last_row["utilization_30d"]),
        }
        Xf = pd.DataFrame([future_feat])[FEATURE_COLS]
        pred_daily = float(np.clip(best_model.predict(Xf)[0], 0, None))
        simulated_km += pred_daily
        future_records.append({
            "date": future_date.strftime("%Y-%m-%d"),
            "odometer_km": round(simulated_km, 1),
            "predicted": True,
        })

    predicted_days = float(days_ahead)
    predicted_date = (datetime.utcnow() + timedelta(days=predicted_days)).strftime("%Y-%m-%d")

    # Confidence interval: ± mae_days
    mae_d = best_result.mae_days
    lower_date = (datetime.utcnow() + timedelta(days=max(0, predicted_days - mae_d))).strftime("%Y-%m-%d")
    upper_date = (datetime.utcnow() + timedelta(days=predicted_days + mae_d)).strftime("%Y-%m-%d")

    # Status
    if predicted_days <= settings.PM_ALERT_DAYS_RED:
        status = "red"
        confidence = "High" if mae_d < 2 else "Medium"
    elif predicted_days <= settings.PM_ALERT_DAYS_ORANGE:
        status = "orange"
        confidence = "High" if mae_d < 3 else "Medium"
    elif predicted_days <= settings.PM_ALERT_DAYS_YELLOW:
        status = "yellow"
        confidence = "Medium"
    else:
        status = "green"
        confidence = "Medium" if mae_d < 5 else "Low"

    # Historical odometer for chart
    history = [
        {"date": str(r["date"])[:10], "odometer_km": round(r["odometer_km"], 1), "predicted": False}
        for _, r in feat_df.iterrows()
    ]

    return PMPrediction(
        vehicle=vehicle,
        current_km=round(current_km, 1),
        pm_target_km=round(pm_target_km, 1),
        km_remaining=round(km_remaining, 1),
        avg_daily_km=round(avg_daily_km, 1),
        predicted_days=round(predicted_days, 1),
        predicted_date=predicted_date,
        lower_date=lower_date,
        upper_date=upper_date,
        model_used=best_result.model_name,
        model_mae_days=round(mae_d, 2),
        confidence=confidence,
        status=status,
        model_results=[asdict(r) for r in results],
        daily_km_history=[
            {"date": str(r["date"])[:10], "daily_km": round(float(r["daily_km"]), 1)}
            for _, r in feat_df.iterrows()
            if r["daily_km"] > 0
        ],
        future_odometer=history + future_records[:90],  # 90-day horizon in chart
    )


def run_all_predictions(df: pd.DataFrame, pm_configs: Dict[str, Dict]) -> Dict[str, PMPrediction]:
    """
    pm_configs: { "ET007": {"pm_target_km": 80000, "pm_name": "PM3"}, ... }
    """
    results = {}
    trucks = df["vehicle"].unique()
    for vehicle in trucks:
        cfg = pm_configs.get(vehicle, {})
        target_km = cfg.get("pm_target_km")
        pm_name   = cfg.get("pm_name", "PM3")
        if not target_km:
            continue
        pred = train_and_predict(df, vehicle, float(target_km), pm_name)
        if pred:
            results[vehicle] = pred
    return results
