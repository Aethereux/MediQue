import threading
from datetime import date

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.exc import IntegrityError

from auth import get_current_user
from database import get_db
from models import (
    Booking,
    Doctor,
    Specialty,
    date_label,
    fmt_time,
    next_ref,
    occupied_set,
    position_for,
    today,
)
from schemas import BookingIn

router = APIRouter(prefix="/api/bookings")
BOOK_LOCK = threading.Lock()


@router.post("", status_code=201)
def create_booking(payload: BookingIn, db=Depends(get_db), user=Depends(get_current_user)):
    # --- validation ladder (outside the lock) ---
    doc = db.get(Doctor, payload.doctor_id)
    if doc is None:
        raise HTTPException(404, "Doctor not found.")

    if not doc.is_active:
        raise HTTPException(422, "This doctor is not currently accepting bookings.")

    try:
        d = date.fromisoformat(payload.date)
    except ValueError:
        raise HTTPException(422, "Invalid date.")

    if d < today():
        raise HTTPException(422, "Date must be today or later.")

    if d.strftime("%a") not in doc.days:
        raise HTTPException(422, "The doctor has no clinic on this date.")

    if payload.mode not in doc.modes:
        raise HTTPException(422, "This doctor does not offer that consultation mode.")

    if not (0 <= payload.slot_index < doc.slot_limit):
        raise HTTPException(422, "Invalid slot index.")

    # --- atomic section ---
    with BOOK_LOCK:
        existing = (
            db.query(Booking)
            .filter(
                Booking.user_id == user.id,
                Booking.doctor_id == doc.id,
                Booking.date == d,
                Booking.status != "cancelled",
            )
            .first()
        )
        if existing is not None:
            raise HTTPException(
                409, "You already have a booking with this doctor on this date."
            )

        occ = occupied_set(db, doc, d)

        if doc.is_full or len(occ) >= doc.slot_limit:
            raise HTTPException(
                409, "Fully booked for this date — please pick another day."
            )

        if payload.slot_index in occ:
            raise HTTPException(409, "That slot was just taken. Please pick another time.")

        booking = Booking(
            id=next_ref(db),
            user_id=user.id,
            doctor_id=doc.id,
            date=d,
            slot_index=payload.slot_index,
            time_label=fmt_time(doc.start_min + payload.slot_index * 15),
            mode=payload.mode,
            position=position_for(occ, payload.slot_index),
            status="confirmed",
        )
        db.add(booking)
        try:
            db.commit()
        except IntegrityError:
            db.rollback()
            raise HTTPException(409, "That slot was just taken. Please pick another time.")

        db.refresh(booking)

    # --- build response payload ---
    specialty = db.get(Specialty, doc.specialty_id)
    specialty_name = specialty.name if specialty else doc.specialty_id

    if booking.mode == "tele":
        video_link = "https://medique.ph/visit/" + booking.id.lower()
        note = "Join the video link 5 minutes before your slot."
    else:
        video_link = None
        note = "Please arrive 15 minutes early."

    return {
        "id": booking.id,
        "doctor": {
            "id": doc.id,
            "name": doc.name,
            "specialty": specialty_name,
            "room": doc.room,
            "floor": doc.floor,
            "color": doc.color,
        },
        "date": booking.date.isoformat(),
        "date_label": date_label(booking.date),
        "time": booking.time_label,
        "mode": booking.mode,
        "position": booking.position,
        "position_label": f"#{booking.position} of the day",
        "status": booking.status,
        "video_link": video_link,
        "note": note,
    }
