"""
Feature Engineering
Generates ML-ready features from cleaned odometer history.
"""

import pandas as pd
import numpy as np
from typing import Tuple


def build_features(df: pd.DataFrame, vehicle: str) -> pd.DataFrame:
    """
    Given full cleaned DataFrame for one truck, build feature matrix.
    Returns DataFrame with columns:
        day_of_week, month, days_elapsed,
        odometer_km (target: future odometer),
        daily_km, rolling_7, rolling_14, rolling_30,
        trend_7, trend_30,
        cumulative_km, days_since_last_charge,
        utilization_30d
    """
    g = df[df["vehicle"] == vehicle].copy()
    g = g.sort_values("date").reset_index(drop=True)

    # Remove anomalies from training features (keep for reporting)
    g_clean = g[~g["is_anomaly"]].copy()

    if len(g_clean) < 3:
        return pd.DataFrame()

    # Basic time features
    g_clean["day_of_week"]   = g_clean["date"].dt.dayofweek
    g_clean["month"]         = g_clean["date"].dt.month
    g_clean["days_elapsed"]  = (g_clean["date"] - g_clean["date"].min()).dt.days

    # Daily km (already computed in anomaly detection)
    if "daily_km" not in g_clean.columns or g_clean["daily_km"].isna().all():
        g_clean["daily_km"] = g_clean["odometer_km"].diff().clip(lower=0)

    # Rolling statistics
    g_clean["rolling_7"]  = g_clean["daily_km"].rolling(7,  min_periods=1).mean()
    g_clean["rolling_14"] = g_clean["daily_km"].rolling(14, min_periods=1).mean()
    g_clean["rolling_30"] = g_clean["daily_km"].rolling(30, min_periods=1).mean()

    # Trend: slope of km/day over window
    g_clean["trend_7"]  = g_clean["daily_km"].rolling(7,  min_periods=2).apply(
        lambda x: np.polyfit(range(len(x)), x, 1)[0] if len(x) > 1 else 0, raw=True)
    g_clean["trend_30"] = g_clean["daily_km"].rolling(30, min_periods=2).apply(
        lambda x: np.polyfit(range(len(x)), x, 1)[0] if len(x) > 1 else 0, raw=True)

    # Cumulative km since first record
    g_clean["cumulative_km"] = g_clean["odometer_km"] - g_clean["odometer_km"].iloc[0]

    # Days since last charge (gap detection)
    g_clean["days_since_last"] = g_clean["date"].diff().dt.days.fillna(1)

    # 30-day utilisation rate (fraction of days the truck was used)
    g_clean["utilization_30d"] = (
        g_clean["daily_km"].rolling(30, min_periods=1).apply(lambda x: (x > 0).mean(), raw=True)
    )

    feature_cols = [
        "date", "odometer_km", "daily_km",
        "day_of_week", "month", "days_elapsed",
        "rolling_7", "rolling_14", "rolling_30",
        "trend_7", "trend_30",
        "cumulative_km", "days_since_last", "utilization_30d",
    ]
    return g_clean[feature_cols].dropna(subset=["daily_km"]).reset_index(drop=True)


FEATURE_COLS = [
    "day_of_week", "month", "days_elapsed",
    "rolling_7", "rolling_14", "rolling_30",
    "trend_7", "trend_30",
    "cumulative_km", "days_since_last", "utilization_30d",
]


def prepare_X_y(feat_df: pd.DataFrame) -> Tuple[pd.DataFrame, pd.Series]:
    """Return X (features) and y (daily_km to predict)."""
    X = feat_df[FEATURE_COLS].fillna(0)
    y = feat_df["daily_km"].fillna(0)
    return X, y
