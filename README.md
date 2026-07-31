# MediQue.ph

Doctor appointment scheduling for Makati Medical Center. Patients find doctors by specialty, see how full each clinic day is, and reserve 15-minute slots onsite or via telemedicine. A role-gated admin side manages doctors, bookings, and daily capacity.

- **Backend:** Python FastAPI + SQLAlchemy + SQLite (`backend/`)
- **Frontend:** React 18 + Vite + TypeScript (`frontend/`)

## Prerequisites

- **Node.js 18+** (built with v24)
- **Python 3.11–3.13** (this repo's venv uses 3.13 — on this machine Homebrew's Python 3.14 has a broken C extension setup, so don't swap it in)

## Backend (API on http://localhost:8000)

> **Status:** `backend/` is a **starter scaffold** — plumbing, models, seed data, and the smoke-test harness are provided; every endpoint and the core logic are `TODO` stubs the team implements as Machine Problems. See `backend/README.md` for the provided-vs-yours map, `../BACKEND-SPRINT-PLAN.md` for phases and assignments, and `../design_handoff_medique/MediQue-Claude-Code-Spec.md` for the exact API contract. A complete reference solution is archived at `../backend-reference-solution.zip` (QA answer key — verify against it, don't copy from it). Until Phase 1 lands, the frontend runs but its API calls will fail.

First-time setup:

```bash
cd backend
python3.13 -m venv .venv          # skip if .venv already exists
./.venv/bin/pip install -r requirements.txt
cp .env.example .env              # then set a random SECRET_KEY

--WINDOWS--
cd backend
py -3.13 -m venv .venv            
.\.venv\Scripts\pip install -r requirements.txt
copy .env.example .env            # then set a random SECRET_KEY
```

Run:

```bash
cd backend
./.venv/bin/uvicorn main:app --reload

--WINDOWS--
cd backend
.\.venv\Scripts\uvicorn main:app --reload
```

On startup the server creates `medique.db` and seeds it (doctors, specialties, demo users, sample bookings) — only when the file doesn't exist yet. Config lives in `.env` (`SECRET_KEY`, `DATABASE_URL`, `TZ=Asia/Manila`).

**Reset demo data:** seed dates are anchored to "today" (Manila), so refresh them by stopping the server, deleting the DB, and starting again:

```bash
rm backend/medique.db
```

**Smoke test** (58 checks; needs the server running; mutates data — reset the DB after):

```bash
cd backend && ./smoke.sh
```

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