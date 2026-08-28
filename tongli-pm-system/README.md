# Tongli EV Fleet PM Prediction System

AI-powered predictive maintenance platform for EV mining trucks.
Predicts PM dates using Linear Regression, Random Forest, and XGBoost.
Supports English and Chinese (中文).

---

## Architecture

```
frontend/   →  Next.js + TypeScript + Tailwind (deploy to Vercel)
backend/    →  FastAPI + SQLAlchemy + ML (deploy to Render/Railway)
```

---

## Local Development

### Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
# API docs: http://localhost:8000/api/docs
```

### Frontend
```bash
cd frontend
npm install
# Set NEXT_PUBLIC_API_URL in .env.local
echo "NEXT_PUBLIC_API_URL=http://localhost:8000" > .env.local
npm run dev
# App: http://localhost:3000
```

---

## Deploy to Vercel (Frontend)

1. Push to GitHub
2. Import repo in vercel.com
3. Set root directory: `frontend`
4. Set env var: `NEXT_PUBLIC_API_URL=https://your-backend.onrender.com`
5. Deploy

## Deploy to Render (Backend)

1. New → Web Service → connect GitHub repo
2. Root directory: `backend`
3. Build command: `pip install -r requirements.txt`
4. Start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
5. Add env vars from `.env`

---

## Usage Workflow

1. **Data** → Upload your charging log (xlsx/csv) or connect Google Sheets
2. **Settings** → Enter last PM odometer and interval for each truck
3. **Dashboard** → Click "Run AI Predictions"
4. **Predictions** → View per-truck PM dates with confidence ranges
5. **AI Performance** → See which model (Linear / RF / XGBoost) performs best
6. **Anomalies** → Review flagged odometer readings

---

## Column Names (Auto-detected)

| Field | Accepted Names |
|-------|---------------|
| Date | Date, 日期 |
| Vehicle | Vehicle, Vehicle Number, 车辆编号 |
| Odometer | Kilometers, KM, Odometer, 里程 |

---

## Google Sheets Setup

1. Create a Google Cloud Service Account
2. Download JSON credentials
3. Set `GOOGLE_SHEETS_CREDENTIALS_JSON` env var (paste entire JSON as one line)
4. Share your Google Sheet with the service account email
