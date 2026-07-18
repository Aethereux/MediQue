# MediQue.ph Back-End — Your Build

The **setup is already implemented** — the server boots, seeds itself, and answers a health check out of the box. Everything on top of it (every endpoint, the auth/JWT logic, the slot math) is yours to build, machine problem by machine problem. **`../MP-GUIDE.md` is your instruction manual**: start with its Setup Check, then follow your assigned MPs in order. Who does what: `../../BACKEND-SPRINT-PLAN.md`. The formal API contract: `../../design_handoff_medique/MediQue-Claude-Code-Spec.md`.

## Provided (read it, import from it, don't rewrite it)

- `database.py` — engine, sessions, `.env` loading
- `models.py` — the four SQLAlchemy models (spec §4), date/format helpers, and the `uq_active_slot` unique index
- `schemas.py` — permissive request bodies (your endpoints do the real validation)
- `auth.py` — password hashing (you'll add the JWT/identity functions in MP-02/03)
- `main.py` — app wiring: CORS, create-tables + seed-once on startup, the global error handler, and `GET /api/health`
- `seed.py` — the clinic's data (never edit)
- `smoke.sh` — 58 curl checks across all MPs; your scoreboard (never edit). `rm medique.db`, restart, `./smoke.sh` — green means done.

## Yours to build (the machine problems)

Everything in `routers/` (registration, login, doctors, availability, bookings, history, cancel, account, contact, the whole admin API), the JWT + `get_current_user` + `require_admin` functions in `auth.py`, and the slot-math and reference-id helpers in `models.py` — each in its MP, in sprint order. One branch + one pull request per MP.

## Setup (each member, once)

```bash
python3 -m venv .venv            # Python 3.11–3.13
./.venv/bin/pip install -r requirements.txt
cp .env.example .env             # set a random SECRET_KEY
```

Run: `./.venv/bin/uvicorn main:app --reload` → http://localhost:8000. Delete `medique.db` anytime to reseed fresh.
