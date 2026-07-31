from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models import Doctor, Specialty, occupied_set, today


router = APIRouter(prefix="/api")


def doctor_item(db: Session, doc: Doctor) -> dict:
    specialty = db.get(Specialty, doc.specialty_id)
    specialty_name = specialty.name if specialty else doc.specialty_id

    booked = len(occupied_set(db, doc, today()))
    limit = doc.slot_limit
    slots_left = max(limit - booked, 0)
    is_full = doc.is_full or booked >= limit

    return {
        "id": doc.id,
        "name": doc.name,
        "specialty": specialty_name,
        "specialty_id": doc.specialty_id,
        "schedule_text": doc.schedule_text,
        "days": doc.days,
        "room": doc.room,
        "floor": doc.floor,
        "modes": doc.modes,
        "rating": doc.rating,
        "reviews": doc.reviews,
        "years": doc.years,
        "color": doc.color,
        "bio": doc.bio,
        "availability": {
            "booked": booked,
            "limit": limit,
            "slots_left": slots_left,
            "is_full": is_full,
        },
    }


@router.get("/specialties")
def list_specialties(db: Session = Depends(get_db)):
    rows = db.query(Specialty).all()
    return [{"id": s.id, "name": s.name, "icon": s.icon} for s in rows]


@router.get("/doctors")
def list_doctors(specialty: str = "", q: str = "", db: Session = Depends(get_db)):
    query = db.query(Doctor).filter(Doctor.is_active.is_(True))

    if specialty:
        query = query.filter(Doctor.specialty_id == specialty)

    doctors = query.all()

    if q:
        needle = q.lower()
        filtered = []
        for doc in doctors:
            specialty_row = db.get(Specialty, doc.specialty_id)
            specialty_name = specialty_row.name if specialty_row else doc.specialty_id
            if needle in doc.name.lower() or needle in specialty_name.lower():
                filtered.append(doc)
        doctors = filtered

    return [doctor_item(db, doc) for doc in doctors]


@router.get("/doctors/{doctor_id}")
def get_doctor(doctor_id: str, db: Session = Depends(get_db)):
    doc = db.get(Doctor, doctor_id)
    if doc is None or not doc.is_active:
        raise HTTPException(404, "Doctor not found.")
    return doctor_item(db, doc)