"""Demo seed data — runs once, only when the DB is empty.

Booking dates are anchored to "today" in Manila (delete medique.db and restart
to refresh them). The `position` values are precomputed constants; if you ever
change the seed bookings, re-derive them with occupied_set/position_for from
models.py.
"""
from datetime import date, timedelta

from auth import hash_password
from database import SessionLocal
from models import Booking, Doctor, Specialty, User, fmt_time, now_manila, today

SPECIALTIES = [
    ("cardiology", "Cardiology", "heart"),
    ("pediatrics", "Pediatrics", "baby"),
    ("rheumatology", "Rheumatology", "bone"),
    ("internal", "Internal Medicine", "stethoscope"),
    ("dermatology", "Dermatology", "sparkle"),
    ("obgyne", "OB-GYNE", "flower"),
    ("orthopedics", "Orthopedics", "activity"),
    ("ent", "ENT", "ear"),
    ("neurology", "Neurology", "brain"),
    ("family", "Family Medicine", "users"),
]

DOCTORS = [
    dict(id="d-bautista", name="Dr. Andrea Bautista", specialty_id="cardiology",
         schedule_text="Mon · Wed · Fri, 9:00 AM–12:00 PM", days=["Mon", "Wed", "Fri"],
         room="304", floor="3rd floor", modes=["onsite", "tele"],
         start_min=540, slot_limit=12, base_booked=8, is_full=False,
         rating=4.9, reviews=212, years=14, color="#0E8C8C",
         bio="Adult cardiology, hypertension & heart-health screening. Gentle, thorough, listens well."),
    dict(id="d-reyes", name="Dr. Miguel Reyes", specialty_id="pediatrics",
         schedule_text="Tue · Thu, 1:00–5:00 PM", days=["Tue", "Thu"],
         room="210", floor="2nd floor", modes=["onsite"],
         start_min=780, slot_limit=12, base_booked=11, is_full=False,
         rating=4.8, reviews=340, years=11, color="#2563EB",
         bio="Newborn to teen care, immunizations, and well-child check-ups. Great with anxious kids."),
    dict(id="d-lim", name="Dr. Carmela Lim", specialty_id="rheumatology",
         schedule_text="Mon · Wed, 10:00 AM–1:00 PM", days=["Mon", "Wed"],
         room="415", floor="4th floor", modes=["onsite", "tele"],
         start_min=600, slot_limit=12, base_booked=5, is_full=False,
         rating=4.9, reviews=98, years=9, color="#9333EA",
         bio="Arthritis, lupus, and autoimmune joint care. Focused on long-term comfort and mobility."),
    dict(id="d-ramos", name="Dr. Joselito Ramos", specialty_id="internal",
         schedule_text="Mon–Fri, 8:00–11:00 AM", days=["Mon", "Tue", "Wed", "Thu", "Fri"],
         room="102", floor="1st floor", modes=["onsite", "tele"],
         start_min=480, slot_limit=12, base_booked=12, is_full=True,
         rating=4.7, reviews=410, years=18, color="#0891B2",
         bio="General adult medicine, chronic disease management, and annual physicals."),
    dict(id="d-gonzales", name="Dr. Patricia Gonzales", specialty_id="dermatology",
         schedule_text="Wed · Fri, 2:00–5:00 PM", days=["Wed", "Fri"],
         room="220", floor="2nd floor", modes=["tele"],
         start_min=840, slot_limit=9, base_booked=6, is_full=False,
         rating=4.9, reviews=176, years=8, color="#DB2777",
         bio="Acne, eczema, skin allergies and teledermatology consults from home."),
    dict(id="d-cruz", name="Dr. Ferdinand Cruz", specialty_id="obgyne",
         schedule_text="Tue · Thu · Sat, 9:00 AM–12:00 PM", days=["Tue", "Thu", "Sat"],
         room="318", floor="3rd floor", modes=["onsite"],
         start_min=540, slot_limit=9, base_booked=7, is_full=False,
         rating=4.8, reviews=254, years=16, color="#E11D48",
         bio="Prenatal care, women’s health screening, and family planning counsel."),
]


def _add_booking(db, ref, user, doctor, d, slot, position, mode, status, created_at):
    b = Booking(id=ref, user_id=user.id, doctor_id=doctor.id, date=d, slot_index=slot,
                time_label=fmt_time(doctor.start_min + slot * 15), mode=mode,
                position=position, status=status, created_at=created_at)
    db.add(b)
    db.flush()
    return b


def run():
    db = SessionLocal()
    try:
        if db.query(User).first():
            return  # already seeded

        for sid, name, icon in SPECIALTIES:
            db.add(Specialty(id=sid, name=name, icon=icon))
        docs = {}
        for row in DOCTORS:
            docs[row["id"]] = Doctor(**row)
            db.add(docs[row["id"]])

        pw = hash_password("password123")
        juan = User(full_name="Juan dela Cruz", email="juan.delacruz@email.com",
                    mobile="0917-555-0142", password_hash=pw,
                    birthday=date(1996, 3, 14), sex="Male",
                    address="Quezon City, Metro Manila", role="patient")
        rina = User(full_name="Rina Domingo", email="rina@medique.ph",
                    mobile="", password_hash=hash_password("admin123"), role="admin",
                    sex=None, address=None)
        maria = User(full_name="Maria Santos", email="maria.santos@email.com",
                     mobile="", password_hash=pw, sex=None, address=None)
        carlos = User(full_name="Carlos Mendoza", email="carlos.mendoza@email.com",
                      mobile="", password_hash=pw, sex=None, address=None)
        grace = User(full_name="Grace Uy", email="grace.uy@email.com",
                     mobile="", password_hash=pw, sex=None, address=None)
        liza = User(full_name="Liza Ferrer", email="liza.ferrer@email.com",
                    mobile="", password_hash=pw, sex=None, address=None)
        db.add_all([juan, rina, maria, carlos, grace, liza])
        db.flush()

        t = today()
        monday = t + timedelta(days=1)
        while monday.weekday() != 0:  # next Monday strictly after today
            monday += timedelta(days=1)
        wednesday = monday + timedelta(days=2)
        past = t - timedelta(days=60)
        while past.weekday() > 4:  # a Ramos clinic day (Mon-Fri)
            past -= timedelta(days=1)

        now = now_manila()

        def days_ago(n, hour, minute):
            return (now - timedelta(days=n)).replace(hour=hour, minute=minute,
                                                     second=0, microsecond=0)

        # Juan: upcoming Bautista (Wed, slot 3, 9:45 AM, #4) + past Ramos (completed)
        _add_booking(db, "MQ-2026-000412", juan, docs["d-bautista"], wednesday, 3, 4,
                     "onsite", "confirmed", days_ago(6, 10, 2))
        _add_booking(db, "MQ-2026-000188", juan, docs["d-ramos"], past, 2, 3,
                     "tele", "completed", days_ago(62, 9, 30))

        # Coming-Monday bookings for the admin pages
        _add_booking(db, "MQ-2026-000415", maria, docs["d-bautista"], monday, 0, 1,
                     "onsite", "confirmed", days_ago(5, 9, 12))
        _add_booking(db, "MQ-2026-000416", carlos, docs["d-ramos"], monday, 0, 1,
                     "onsite", "completed", days_ago(5, 14, 40))
        _add_booking(db, "MQ-2026-000417", grace, docs["d-lim"], monday, 0, 1,
                     "tele", "confirmed", days_ago(4, 11, 5))
        _add_booking(db, "MQ-2026-000418", liza, docs["d-bautista"], monday, 8, 7,
                     "onsite", "cancelled", days_ago(4, 16, 21))
        _add_booking(db, "MQ-2026-000419", grace, docs["d-lim"], monday, 9, 6,
                     "onsite", "cancelled", days_ago(3, 8, 55))

        db.commit()
    finally:
        db.close()
