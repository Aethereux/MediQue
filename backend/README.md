# MediQue.ph Backend

FastAPI + SQLAlchemy + SQLite. Serves the whole API for the React frontend: auth, doctor directory, day availability, bookings, account settings, contact, and the admin console. All times run on Asia/Manila; every error response is a single human-readable message in `{"detail": "..."}`.

## Layout

| File | What it does |
|---|---|
| `main.py` | App wiring: CORS, create-tables + seed on first boot, error handler, health check, router registration |
| `database.py` | Engine, session factory, `.env` loading |
| `models.py` | The four tables (User, Specialty, Doctor, Booking) plus shared helpers — including the slot-occupancy logic every booking feature uses |
| `schemas.py` | Permissive request bodies; endpoints do the real validation so errors stay human |
| `auth.py` | Password hashing (bcrypt), JWT tokens, `get_current_user` / `require_admin` dependencies |
| `seed.py` | Demo data, inserted once when the DB is empty |
| `routers/` | One file per feature area: `auth`, `doctors`, `bookings`, `account`, `contact`, `admin` |
| `smoke.sh` | 58 end-to-end curl checks — the acceptance suite |

## Setup

macOS / Linux:

```bash
python3 -m venv .venv            # Python 3.11–3.13
./.venv/bin/pip install -r requirements.txt
cp .env.example .env             # set a random SECRET_KEY
```

Windows (PowerShell):

```powershell
py -3.13 -m venv .venv
.venv\Scripts\pip install -r requirements.txt
copy .env.example .env           # set a random SECRET_KEY
```

## Run

```bash
./.venv/bin/uvicorn main:app --reload      # Windows: .venv\Scripts\uvicorn main:app --reload
```

API at http://localhost:8000 (interactive docs at `/docs`). First boot creates and seeds `medique.db`.

## Reset & test

Seed dates anchor to today's date in Manila — delete the DB to reseed fresh:

```bash
rm medique.db                    # Windows: del medique.db
```

Smoke test (server must be running; it mutates data, so reset after). On Windows use Git Bash:

```bash
./smoke.sh                       # expect: passed 58, failed 0
```

## Notes

- `.env` is gitignored; never commit your `SECRET_KEY`.
- The `tzdata` package in `requirements.txt` is what makes `Asia/Manila` work on Windows — don't remove it.
- A slot is "taken" if it's in the doctor's seeded base pattern **or** has a real non-cancelled booking; see the slot-occupancy helpers at the bottom of `models.py` before touching anything booking-related.
