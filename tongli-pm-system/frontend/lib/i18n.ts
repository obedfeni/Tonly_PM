export type Lang = "en" | "zh";

export const translations = {
  en: {
    // Nav
    nav_dashboard:       "Dashboard",
    nav_trucks:          "Trucks",
    nav_predictions:     "Predictions",
    nav_anomalies:       "Anomalies",
    nav_model:           "AI Performance",
    nav_settings:        "Settings",
    nav_data:            "Data",
    app_name:            "Tongli EV PM System",
    app_subtitle:        "AI-Powered Predictive Maintenance",

    // Dashboard
    total_trucks:        "Total Trucks",
    critical_7d:         "Due ≤ 7 days",
    warning_14d:         "Due 8–14 days",
    watch_30d:           "Due 15–30 days",
    normal:              "Normal (>30 days)",
    upcoming_pm:         "Upcoming PM Schedule",
    fleet_status:        "Fleet Status",
    avg_daily_km:        "Avg Daily KM",
    run_predictions:     "Run AI Predictions",
    running:             "Running...",
    upload_data:         "Upload Data",
    last_updated:        "Last updated",

    // Trucks
    vehicle:             "Vehicle",
    current_km:          "Current Odometer",
    pm_target:           "PM Target (km)",
    km_remaining:        "KM Remaining",
    predicted_date:      "Predicted PM Date",
    confidence:          "Confidence",
    status:              "Status",
    model_used:          "Model Used",
    view_detail:         "View Detail",
    daily_km:            "Daily KM",

    // Prediction
    prediction_detail:   "Prediction Detail",
    odometer_chart:      "Odometer Trend & Prediction",
    daily_km_chart:      "Daily KM Usage",
    pm_interval:         "PM Interval (km)",
    last_pm:             "Last PM at (km)",
    pm_name:             "PM Name",
    lower_bound:         "Lower bound",
    upper_bound:         "Upper bound",

    // Anomalies
    anomaly_detected:    "Anomaly Detected",
    anomaly_reason:      "Reason",
    anomaly_date:        "Date",
    no_anomalies:        "No anomalies detected",

    // Model perf
    model_performance:   "Model Comparison",
    model_name:          "Model",
    mae_km:              "MAE (km)",
    rmse_km:             "RMSE (km)",
    mae_days:            "MAE (days)",
    r2_score:            "R² Score",
    wins:                "Best for trucks",
    selected:            "Selected",

    // Settings
    pm_config:           "PM Configuration",
    save:                "Save",
    saving:              "Saving...",
    add_truck:           "Add Truck",
    configure_pm:        "Configure PM targets for each truck",

    // Data
    upload_title:        "Upload Charging Log",
    google_sheets:       "Connect Google Sheets",
    sheet_id:            "Google Sheet ID",
    worksheet:           "Worksheet name (optional)",
    connect:             "Connect",
    connecting:          "Connecting...",
    replace_data:        "Replace existing data",
    data_status:         "Data Status",
    total_records:       "Total Records",
    date_range:          "Date Range",
    anomalies:           "Anomalies",

    // Status labels
    status_red:          "Critical",
    status_orange:       "Upcoming",
    status_yellow:       "Watch",
    status_green:        "Normal",
    confidence_high:     "High",
    confidence_medium:   "Medium",
    confidence_low:      "Low",

    // Common
    no_data:             "No data available",
    loading:             "Loading...",
    error:               "Error",
    success:             "Success",
    cancel:              "Cancel",
    close:               "Close",
    days:                "days",
    km:                  "km",
  },

  zh: {
    nav_dashboard:       "仪表盘",
    nav_trucks:          "车辆",
    nav_predictions:     "预测",
    nav_anomalies:       "异常",
    nav_model:           "AI 性能",
    nav_settings:        "设置",
    nav_data:            "数据",
    app_name:            "铜力电动车预维护系统",
    app_subtitle:        "AI 驱动的预测性维护",

    total_trucks:        "车辆总数",
    critical_7d:         "7天内到期",
    warning_14d:         "8–14天到期",
    watch_30d:           "15–30天到期",
    normal:              "正常（>30天）",
    upcoming_pm:         "即将到来的维保",
    fleet_status:        "车队状态",
    avg_daily_km:        "日均里程",
    run_predictions:     "运行 AI 预测",
    running:             "运行中...",
    upload_data:         "上传数据",
    last_updated:        "上次更新",

    vehicle:             "车辆编号",
    current_km:          "当前里程",
    pm_target:           "维保目标（km）",
    km_remaining:        "剩余里程",
    predicted_date:      "预测维保日期",
    confidence:          "置信度",
    status:              "状态",
    model_used:          "使用模型",
    view_detail:         "查看详情",
    daily_km:            "日均里程",

    prediction_detail:   "预测详情",
    odometer_chart:      "里程趋势与预测",
    daily_km_chart:      "日均里程",
    pm_interval:         "维保间隔（km）",
    last_pm:             "上次维保里程",
    pm_name:             "维保名称",
    lower_bound:         "下界",
    upper_bound:         "上界",

    anomaly_detected:    "检测到异常",
    anomaly_reason:      "原因",
    anomaly_date:        "日期",
    no_anomalies:        "未检测到异常",

    model_performance:   "模型比较",
    model_name:          "模型",
    mae_km:              "MAE（km）",
    rmse_km:             "RMSE（km）",
    mae_days:            "MAE（天）",
    r2_score:            "R² 分数",
    wins:                "最佳车辆数",
    selected:            "已选择",

    pm_config:           "维保配置",
    save:                "保存",
    saving:              "保存中...",
    add_truck:           "添加车辆",
    configure_pm:        "为每台车配置维保目标",

    upload_title:        "上传充电日志",
    google_sheets:       "连接 Google Sheets",
    sheet_id:            "Google Sheet ID",
    worksheet:           "工作表名称（可选）",
    connect:             "连接",
    connecting:          "连接中...",
    replace_data:        "替换现有数据",
    data_status:         "数据状态",
    total_records:       "记录总数",
    date_range:          "日期范围",
    anomalies:           "异常",

    status_red:          "紧急",
    status_orange:       "临近",
    status_yellow:       "关注",
    status_green:        "正常",
    confidence_high:     "高",
    confidence_medium:   "中",
    confidence_low:      "低",

    no_data:             "暂无数据",
    loading:             "加载中...",
    error:               "错误",
    success:             "成功",
    cancel:              "取消",
    close:               "关闭",
    days:                "天",
    km:                  "公里",
  },
} as const;

export type TranslationKey = keyof typeof translations.en;

export function t(lang: Lang, key: TranslationKey): string {
  return translations[lang][key] ?? translations.en[key] ?? key;
}
