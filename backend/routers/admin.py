"""Admin console (/api/admin) — every route requires an admin token.

Doctor and specialty management, the clinic day board, the bookings overview
with outcome actions, and the weekly capacity report.
"""
from datetime import date as date_cls, timedelta

from fastapi import APIRouter, Depends, HTTPException

from auth import require_admin
from database import get_db
from models import (Booking, Doctor, Specialty, User, fmt_time, initials_of,
                    occupied_set, real_bookings_by_slot, today)
from schemas import DoctorIn, SpecialtyIn

router = APIRouter(prefix="/api/admin", dependencies=[Depends(require_admin)])

PALETTE = ["#0E8C8C", "#2563EB", "#9333EA", "#0891B2",
           "#DB2777", "#E11D48", "#D97706", "#16A34A"]
VALID_DAYS = {"Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"}


def _parse_date(s):
    try:
        return date_cls.fromisoformat(s)
    except ValueError:
        raise HTTPException(422, "Invalid date.")


def _spec_name(db, doc):
    spec = db.get(Specialty, doc.specialty_id)
    return spec.name if spec else doc.specialty_id


def _derive_schedule(days, start_min, limit):
    return " · ".join(days) + f", {fmt_time(start_min)}–{fmt_time(start_min + limit * 15)}"


def admin_doctor(db, doc):
    return {"id": doc.id, "name": doc.name, "specialty": _spec_name(db, doc),
            "specialty_id": doc.specialty_id, "room": doc.room, "floor": doc.floor,
            "days": doc.days, "modes": doc.modes, "start_min": doc.start_min,
            "slot_limit": doc.slot_limit, "is_active": doc.is_active, "bio": doc.bio,
            "color": doc.color, "rating": doc.rating, "reviews": doc.reviews,
            "years": doc.years, "schedule_text": doc.schedule_text}


@router.get("/ping")
def ping(admin: User = Depends(require_admin)):
    return {"ok": True, "admin": admin.full_name}


# ---- doctor management ----

@router.get("/doctors")
def list_doctors(db=Depends(get_db)):
    return [admin_doctor(db, doc) for doc in db.query(Doctor).all()]


@router.post("/doctors", status_code=201)
def create_doctor(body: DoctorIn, db=Depends(get_db)):
    name = (body.name or "").strip()
    days = body.days or []
    if not name or not days or not all(x in VALID_DAYS for x in days):
        raise HTTPException(422, "Pick at least one clinic day.")
    if not body.specialty_id or db.get(Specialty, body.specialty_id) is None:
        raise HTTPException(422, "Unknown specialty.")
    limit = body.slot_limit if body.slot_limit is not None else 12
    if not 1 <= limit <= 48:
        raise HTTPException(422, "Slot limit must be between 1 and 48.")
    slug = "d-" + name.split()[-1].lower()
    if db.get(Doctor, slug):
        raise HTTPException(409, "A doctor with a similar name already exists.")
    start = body.start_min if body.start_min is not None else 540
    modes = [m for m in (body.modes or []) if m in ("onsite", "tele")] or ["onsite"]
    doc = Doctor(id=slug, name=name, specialty_id=body.specialty_id,
                 bio=(body.bio or "").strip(),
                 schedule_text=_derive_schedule(days, start, limit), days=days,
                 room=(body.room or "").strip(), floor=(body.floor or "").strip(),
                 modes=modes, start_min=start, slot_limit=limit, base_booked=0,
                 is_full=False, is_active=True, rating=5.0, reviews=0, years=0,
                 color=PALETTE[db.query(Doctor).count() % len(PALETTE)])
    db.add(doc)
    db.commit()
    return admin_doctor(db, doc)


@router.patch("/doctors/{doctor_id}")
def update_doctor(doctor_id: str, body: DoctorIn, db=Depends(get_db)):
    doc = db.get(Doctor, doctor_id)
    if doc is None:
        raise HTTPException(404, "Doctor not found.")
    if body.name is not None:
        if not body.name.strip():
            raise HTTPException(422, "Pick at least one clinic day.")
        doc.name = body.name.strip()  # slug/id stays stable on rename
    if body.specialty_id is not None:
        if db.get(Specialty, body.specialty_id) is None:
            raise HTTPException(422, "Unknown specialty.")
        doc.specialty_id = body.specialty_id
    if body.days is not None:
        if not body.days or not all(x in VALID_DAYS for x in body.days):
            raise HTTPException(422, "Pick at least one clinic day.")
        doc.days = body.days
    if body.slot_limit is not None:
        if not 1 <= body.slot_limit <= 48:
            raise HTTPException(422, "Slot limit must be between 1 and 48.")
        doc.slot_limit = body.slot_limit
    if body.start_min is not None:
        doc.start_min = body.start_min
    if body.room is not None:
        doc.room = body.room.strip()
    if body.floor is not None:
        doc.floor = body.floor.strip()
    if body.modes is not None:
        modes = [m for m in body.modes if m in ("onsite", "tele")]
        if modes:
            doc.modes = modes
    if body.bio is not None:
        doc.bio = body.bio.strip()
    doc.schedule_text = _derive_schedule(doc.days, doc.start_min, doc.slot_limit)
    db.commit()
    return admin_doctor(db, doc)


@router.post("/doctors/{doctor_id}/deactivate")
def deactivate_doctor(doctor_id: str, db=Depends(get_db)):
    doc = db.get(Doctor, doctor_id)
    if doc is None:
        raise HTTPException(404, "Doctor not found.")
    doc.is_active = False
    db.commit()
    return {"id": doc.id, "is_active": False,
            "message": f"{doc.name} is now hidden from booking."}


@router.post("/doctors/{doctor_id}/activate")
def activate_doctor(doctor_id: str, db=Depends(get_db)):
    doc = db.get(Doctor, doctor_id)
    if doc is None:
        raise HTTPException(404, "Doctor not found.")
    doc.is_active = True
    db.commit()
    return {"id": doc.id, "is_active": True,
            "message": f"{doc.name} is now accepting bookings."}


@router.delete("/doctors/{doctor_id}")
def delete_doctor(doctor_id: str, db=Depends(get_db)):
    doc = db.get(Doctor, doctor_id)
    if doc is None:
        raise HTTPException(404, "Doctor not found.")
    if db.query(Booking).filter(Booking.doctor_id == doc.id).first():
        raise HTTPException(409, "This doctor has booking history — deactivate instead.")
    db.delete(doc)
    db.commit()
    return {"id": doctor_id, "deleted": True}


# ---- day board, bookings overview, outcomes ----

@router.get("/dayboard")
def dayboard(date: str = "", db=Depends(get_db)):
    d = _parse_date(date)
    lanes, full_ids = [], []
    booked_sum = cap_sum = 0
    for doc in db.query(Doctor).all():
        base = {"doctor_id": doc.id, "name": doc.name, "specialty": _spec_name(db, doc),
                "room": doc.room, "floor": doc.floor, "color": doc.color,
                "schedule_text": doc.schedule_text, "limit": doc.slot_limit}
        if not doc.is_active or d.strftime("%a") not in (doc.days or []):
            lanes.append({**base, "open": False, "booked": 0, "slots": []})
            continue
        occ = occupied_set(db, doc, d)
        real = real_bookings_by_slot(db, doc.id, d)
        slots = []
        for i in range(doc.slot_limit):
            patient = None
            if i in real:
                u = db.get(User, real[i].user_id)
                patient = {"initials": initials_of(u.full_name), "name": u.full_name,
                           "ref": real[i].id}
            slots.append({"index": i, "time": fmt_time(doc.start_min + i * 15),
                          "booked": i in occ, "patient": patient})
        booked = len(occ)
        booked_sum += booked
        cap_sum += doc.slot_limit
        if doc.is_full or booked >= doc.slot_limit:
            full_ids.append(doc.id)
        lanes.append({**base, "open": True, "booked": booked, "slots": slots})
    cancels = (db.query(Booking)
               .filter(Booking.date == d, Booking.status == "cancelled").count())
    return {"date": d.isoformat(), "weekday": d.strftime("%A"),
            "summary": {"booked": booked_sum, "capacity": cap_sum,
                        "percent": round(booked_sum * 100 / cap_sum) if cap_sum else 0,
                        "fully_booked_doctors": full_ids,
                        "cancellations_today": cancels},
            "lanes": lanes}


@router.get("/bookings")
def admin_bookings(date: str = "", status: str = "all", db=Depends(get_db)):
    d = _parse_date(date)
    rows = db.query(Booking).filter(Booking.date == d).all()
    counts = {"all": len(rows), "confirmed": 0, "completed": 0, "cancelled": 0}
    for b in rows:
        counts[b.status] = counts.get(b.status, 0) + 1
    show = rows if status in ("", "all") else [b for b in rows if b.status == status]
    by_doc = {}
    for b in show:
        by_doc.setdefault(b.doctor_id, []).append(b)

    def row(b):
        u = db.get(User, b.user_id)
        return {"id": b.id, "time": b.time_label, "position": b.position,
                "patient_name": u.full_name, "patient_initials": initials_of(u.full_name),
                "mode": b.mode, "status": b.status,
                "created_at": b.created_at.strftime("%Y-%m-%dT%H:%M:%S") + "+08:00"}

    groups = []
    for doc_id, items in by_doc.items():
        doc = db.get(Doctor, doc_id)
        groups.append({"doctor_id": doc.id, "doctor_name": doc.name,
                       "specialty": _spec_name(db, doc), "room": doc.room,
                       "floor": doc.floor, "color": doc.color,
                       "schedule": doc.schedule_text,
                       "booked": len(occupied_set(db, doc, d)), "limit": doc.slot_limit,
                       "bookings": [row(b) for b in
                                    sorted(items, key=lambda b: b.slot_index)]})
    return {"date": d.isoformat(), "counts": counts, "groups": groups}


def _get_booking(db, booking_id):
    b = db.get(Booking, booking_id)
    if b is None:
        raise HTTPException(404, "Booking not found.")
    return b


def _set_outcome(db, booking_id, status):
    b = _get_booking(db, booking_id)
    if b.status != "confirmed":
        raise HTTPException(409, "This booking's outcome is already set.")
    if b.date > today():
        raise HTTPException(422, "Outcomes can only be set on or after the appointment date.")
    b.status = status
    db.commit()
    return {"id": b.id, "status": b.status}


@router.post("/bookings/{booking_id}/complete")
def complete_booking(booking_id: str, db=Depends(get_db)):
    return _set_outcome(db, booking_id, "completed")


@router.post("/bookings/{booking_id}/no-show")
def no_show_booking(booking_id: str, db=Depends(get_db)):
    return _set_outcome(db, booking_id, "no_show")


@router.post("/bookings/{booking_id}/cancel")
def admin_cancel_booking(booking_id: str, db=Depends(get_db)):
    b = _get_booking(db, booking_id)
    if b.status != "confirmed":
        raise HTTPException(409, "This booking can no longer be cancelled.")
    b.status = "cancelled"  # frees the slot (cancelled never occupies)
    db.commit()
    return {"id": b.id, "status": "cancelled",
            "message": "Appointment cancelled. You can book again anytime."}


# ---- weekly capacity report ----

@router.get("/reports/capacity")
def capacity_report(week_of: str = "", db=Depends(get_db)):
    d = _parse_date(week_of)
    monday = d - timedelta(days=d.weekday())
    week = [monday + timedelta(days=i) for i in range(7)]
    doctors = []
    for doc in db.query(Doctor).all():
        days, total_booked, total_cap = [], 0, 0
        for day in week:
            if day.strftime("%a") not in (doc.days or []):
                continue
            booked = len(occupied_set(db, doc, day))
            total_booked += booked
            total_cap += doc.slot_limit
            days.append({"date": day.isoformat(), "weekday": day.strftime("%a"),
                         "booked": booked, "limit": doc.slot_limit,
                         "full": doc.is_full or booked >= doc.slot_limit})
        cancels = (db.query(Booking)
                   .filter(Booking.doctor_id == doc.id, Booking.date >= monday,
                           Booking.date <= week[-1],
                           Booking.status == "cancelled").count())
        doctors.append({"doctor_id": doc.id, "name": doc.name, "days": days,
                        "cancellations": cancels,
                        "fill_rate": round(total_booked / total_cap, 2) if total_cap else 0.0})
    return {"week_of": monday.isoformat(), "doctors": doctors}


# ---- specialty management ----

@router.post("/specialties", status_code=201)
def create_specialty(body: SpecialtyIn, db=Depends(get_db)):
    name = body.name.strip()
    if not name:
        raise HTTPException(422, "Please enter a specialty name.")
    slug = name.lower().replace(" ", "-")
    if db.get(Specialty, slug) or db.query(Specialty).filter(Specialty.name.ilike(name)).first():
        raise HTTPException(409, "That specialty already exists.")
    s = Specialty(id=slug, name=name, icon=(body.icon or "stethoscope").strip() or "stethoscope")
    db.add(s)
    db.commit()
    return {"id": s.id, "name": s.name, "icon": s.icon}


@router.patch("/specialties/{specialty_id}")
def rename_specialty(specialty_id: str, body: SpecialtyIn, db=Depends(get_db)):
    s = db.get(Specialty, specialty_id)
    if s is None:
        raise HTTPException(404, "Specialty not found.")
    name = body.name.strip()
    if not name:
        raise HTTPException(422, "Please enter a specialty name.")
    slug = name.lower().replace(" ", "-")
    clash = (db.query(Specialty)
             .filter(Specialty.id != s.id)
             .filter((Specialty.name.ilike(name)) | (Specialty.id == slug)).first())
    if clash:
        raise HTTPException(409, "That specialty already exists.")
    s.name = name  # id stays stable so doctors remain linked
    if body.icon is not None and body.icon.strip():
        s.icon = body.icon.strip()
    db.commit()
    return {"id": s.id, "name": s.name, "icon": s.icon}
