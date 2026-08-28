"""
Anomaly Detection for Odometer Data
Detects: impossible daily jumps, decreasing odometer, frozen odometer.
"""

import pandas as pd
import numpy as np
from typing import List, Dict
from core.config import settings


def detect_anomalies(df: pd.DataFrame) -> pd.DataFrame:
    """
    Add 'is_anomaly' and 'anomaly_reason' columns to a per-truck sorted DataFrame.
    Input: must have columns [date, vehicle, odometer_km], sorted by vehicle + date.
    """
    df = df.copy().sort_values(["vehicle", "date"]).reset_index(drop=True)
    df["daily_km"] = np.nan
    df["is_anomaly"] = False
    df["anomaly_reason"] = ""

    for vehicle, group in df.groupby("vehicle"):
        idx = group.index
        odo = group["odometer_km"].values
        dates = group["date"].values

        for i in range(1, len(idx)):
            curr = odo[i]
            prev = odo[i - 1]
            days_gap = max(1, (pd.Timestamp(dates[i]) - pd.Timestamp(dates[i - 1])).days)
            delta = curr - prev
            daily = delta / days_gap

            df.loc[idx[i], "daily_km"] = daily

            if delta < 0:
                df.loc[idx[i], "is_anomaly"] = True
                df.loc[idx[i], "anomaly_reason"] = (
                    f"Odometer decreased by {abs(delta):.0f} km"
                )
            elif daily > settings.ANOMALY_THRESHOLD_KM:
                df.loc[idx[i], "is_anomaly"] = True
                df.loc[idx[i], "anomaly_reason"] = (
                    f"Daily jump {daily:.0f} km/day exceeds threshold {settings.ANOMALY_THRESHOLD_KM:.0f}"
                )
            elif daily == 0 and days_gap == 1:
                # Frozen odometer on consecutive day
                df.loc[idx[i], "is_anomaly"] = True
                df.loc[idx[i], "anomaly_reason"] = "Odometer unchanged on consecutive day"

    return df


def anomaly_summary(df: pd.DataFrame) -> List[Dict]:
    flagged = df[df["is_anomaly"]].copy()
    records = []
    for _, row in flagged.iterrows():
        records.append({
            "vehicle":      row["vehicle"],
            "date":         str(row["date"])[:10],
            "odometer_km":  row["odometer_km"],
            "daily_km":     round(row["daily_km"], 1) if not pd.isna(row["daily_km"]) else None,
            "reason":       row["anomaly_reason"],
        })
    return records
