# MediQue.ph

Doctor appointment scheduling for Makati Medical Center. Patients find doctors by specialty, see how full each clinic day is, and reserve 15-minute slots onsite or via telemedicine. A role-gated admin side manages doctors, bookings, and daily capacity.

- **Backend:** Python FastAPI + SQLAlchemy + SQLite (`backend/`)
- **Frontend:** React 18 + Vite + TypeScript (`frontend/`)

## Prerequisites

- **Node.js 18+**
- **Python 3.11–3.13**

## Backend (API on http://localhost:8000)

First-time setup — macOS / Linux:

```bash
cd backend
python3 -m venv .venv
./.venv/bin/pip install -r requirements.txt
cp .env.example .env              # then set a random SECRET_KEY
```

First-time setup — Windows (PowerShell):

```powershell
cd backend
py -3.13 -m venv .venv
.venv\Scripts\pip install -r requirements.txt
copy .env.example .env            # then set a random SECRET_KEY
```

Run:

```bash
./.venv/bin/uvicorn main:app --reload      # Windows: .venv\Scripts\uvicorn main:app --reload
```

On first startup the server creates `medique.db` and seeds it (doctors, specialties, demo users, sample bookings). Config lives in `.env` (`SECRET_KEY`, `DATABASE_URL`, `TZ=Asia/Manila`).

**Reset demo data:** seed dates are anchored to "today" (Manila time), so refresh them by stopping the server and deleting the DB — it reseeds on the next start:

```bash
rm backend/medique.db              # Windows: del backend\medique.db
```

**Smoke test** — 58 end-to-end checks against a running server (mutates data, so reset the DB after). On Windows, run it from **Git Bash**:

```bash
cd backend && ./smoke.sh
```

A healthy build passes 58/58.

## Frontend (app on http://localhost:5173)

```bash
cd frontend
npm install        # first time only
npm run dev
```

Then open http://localhost:5173. The API base URL (`http://localhost:8000`) is set in `src/api.ts`.

Production build: `npm run build` (output in `dist/`), typecheck: `npx tsc --noEmit`.

## Demo accounts

| Role | Email | Password |
|---|---|---|
| Patient | `juan.delacruz@email.com` | `password123` |
| Admin | `rina@medique.ph` | `admin123` |

Admins land on `/admin` (day board · bookings · doctors). Extra seed patients (`maria.santos@`, `carlos.mendoza@`, `grace.uy@`, `liza.ferrer@` — all `@email.com`, password `password123`) exist to populate the admin pages.

Useful demo states: **Dr. Ramos** is always fully booked (red panel, booking blocked server-side); booking **Dr. Bautista's** Monday 9:45 AM slot shows "appointment #4 of the day".
