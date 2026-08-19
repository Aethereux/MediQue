"""Booking lifecycle: create, list mine, cancel (/api/bookings).

Creation re-checks everything server-side (clinic day, mode, slot free,
capacity) — never trust what the booking page showed. A lock plus the
unique index on doctor+date+slot guarantees two rapid requests for the
same slot end as one 201 and one 409.
"""
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


@router.get("/mine")
def my_bookings(db=Depends(get_db), user=Depends(get_current_user)):
    rows = db.query(Booking).filter(Booking.user_id == user.id).all()

    t = today()
    changed = False
    for b in rows:
        if b.status == "confirmed" and b.date < t:
            b.status = "completed"
            changed = True
    if changed:
        db.commit()

    def item(b):
        doc = db.get(Doctor, b.doctor_id)
        specialty = db.get(Specialty, doc.specialty_id) if doc else None
        return {
            "id": b.id,
            "doctor_id": b.doctor_id,
            "doctor_name": doc.name if doc else b.doctor_id,
            "specialty": specialty.name if specialty else (doc.specialty_id if doc else ""),
            "date_label": date_label(b.date),
            "time": b.time_label,
            "mode": b.mode,
            "room": doc.room if doc else "",
            "position": b.position,
            "status": b.status,
            "color": doc.color if doc else "#0E8C8C",
        }

    upcoming = sorted(
        (b for b in rows if b.status == "confirmed" and b.date >= t),
        key=lambda b: (b.date, b.slot_index),
    )
    past = sorted(
        (b for b in rows if not (b.status == "confirmed" and b.date >= t)),
        key=lambda b: b.date,
        reverse=True,
    )

    return {
        "upcoming": [item(b) for b in upcoming],
        "past": [item(b) for b in past],
        "counts": {"upcoming": len(upcoming), "past": len(past)},
    }


@router.post("/{booking_id}/cancel")
def cancel_booking(booking_id: str, db=Depends(get_db), user=Depends(get_current_user)):
    booking = db.get(Booking, booking_id)
    if booking is None:
        raise HTTPException(404, "Booking not found.")

    if booking.user_id != user.id:
        raise HTTPException(403, "You can only cancel your own bookings.")

    if booking.status != "confirmed" or booking.date < today():
        raise HTTPException(409, "This booking can no longer be cancelled.")

    booking.status = "cancelled"
    db.commit()

    return {
        "id": booking.id,
        "status": "cancelled",
        "message": "Appointment cancelled. You can book again anytime.",
    }