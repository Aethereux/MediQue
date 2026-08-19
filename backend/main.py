"""MediQue.ph API — app entry point.

Creates the tables and seeds demo data on first boot, allows the Vite dev
server through CORS, and wires up the feature routers. Every error response
is a single human-readable message: {"detail": "..."}.

Run with: uvicorn main:app --reload
"""
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from routers import account, admin, auth, bookings, contact, doctors
import seed
from database import engine
from models import Base, today


@asynccontextmanager
async def lifespan(app):
    Base.metadata.create_all(engine)
    seed.run()
    yield


app = FastAPI(title="MediQue.ph API", lifespan=lifespan)

app.add_middleware(CORSMiddleware, allow_origins=["http://localhost:5173"],
                   allow_credentials=True, allow_methods=["*"], allow_headers=["*"])


@app.exception_handler(RequestValidationError)
async def validation_handler(request, exc):
    # every error is one human message in "detail" — never Pydantic's list
    errs = exc.errors()
    msg = errs[0].get("msg", "Invalid request.") if errs else "Invalid request."
    return JSONResponse(status_code=422, content={"detail": msg})


@app.get("/api/health")
def health():
    return {"app": "MediQue.ph API", "version": "1.0.0", "status": "ok",
            "date": today().isoformat()}


app.include_router(auth.router)
app.include_router(doctors.router)
app.include_router(bookings.router)
app.include_router(account.router)
app.include_router(contact.router)
app.include_router(admin.router)