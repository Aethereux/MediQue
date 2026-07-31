import re
from datetime import datetime
from zoneinfo import ZoneInfo

from sqlalchemy import JSON, Date, DateTime, ForeignKey, Index
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column

MANILA = ZoneInfo("Asia/Manila")
EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


def now_manila():
    return datetime.now(MANILA).replace(tzinfo=None)


def today():
    return datetime.now(MANILA).date()


def fmt_time(minutes):
    h, m = divmod(minutes, 60)
    return f"{h % 12 or 12}:{m:02d} {'PM' if h >= 12 else 'AM'}"


def date_label(d):
    return f"{d:%a}, {d:%B} {d.day}, {d.year}"


def valid_email(s):
    return bool(EMAIL_RE.match(s or ""))


def compute_age(birthday):
    if not birthday:
        return None
    t = today()
    return t.year - birthday.year - ((t.month, t.day) < (birthday.month, birthday.day))

def first_name_of(name):
    name_part = (name or "").split()
    return name_part[0] if name_part else ""


def initials_of(name):
    name_part = (name or "").split()
    capital = [c for c in name_part if c[0].isupper()]
    picks = capital if len(capital) >= 2 else name_part
    return "".join(w[0].upper() for w in picks[:2])


class Base(DeclarativeBase):
    pass


class User(Base):
    __tablename__ = "users"
    id: Mapped[int] = mapped_column(primary_key=True)
    full_name: Mapped[str]
    email: Mapped[str] = mapped_column(unique=True)
    mobile: Mapped[str] = mapped_column(default="")
    password_hash: Mapped[str]
    birthday = mapped_column(Date, nullable=True)
    sex: Mapped[str | None]
    address: Mapped[str | None]
    role: Mapped[str] = mapped_column(default="patient")
    created_at = mapped_column(DateTime, default=now_manila)


class Specialty(Base):
    __tablename__ = "specialties"
    id: Mapped[str] = mapped_column(primary_key=True)
    name: Mapped[str]
    icon: Mapped[str] = mapped_column(default="stethoscope")


class Doctor(Base):
    __tablename__ = "doctors"
    id: Mapped[str] = mapped_column(primary_key=True)
    name: Mapped[str]
    specialty_id: Mapped[str] = mapped_column(ForeignKey("specialties.id"))
    bio: Mapped[str] = mapped_column(default="")
    schedule_text: Mapped[str] = mapped_column(default="")
    days = mapped_column(JSON, default=list)
    room: Mapped[str] = mapped_column(default="")
    floor: Mapped[str] = mapped_column(default="")
    modes = mapped_column(JSON, default=list)
    start_min: Mapped[int] = mapped_column(default=540)
    slot_limit: Mapped[int] = mapped_column(default=12)
    base_booked: Mapped[int] = mapped_column(default=0)
    is_full: Mapped[bool] = mapped_column(default=False)
    is_active: Mapped[bool] = mapped_column(default=True)
    rating: Mapped[float] = mapped_column(default=5.0)
    reviews: Mapped[int] = mapped_column(default=0)
    years: Mapped[int] = mapped_column(default=0)
    color: Mapped[str] = mapped_column(default="#0E8C8C")


class Booking(Base):
    __tablename__ = "bookings"
    id: Mapped[str] = mapped_column(primary_key=True)  # "MQ-2026-000413"
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    doctor_id: Mapped[str] = mapped_column(ForeignKey("doctors.id"))
    date = mapped_column(Date)
    slot_index: Mapped[int]
    time_label: Mapped[str]
    mode: Mapped[str]
    position: Mapped[int]
    status: Mapped[str] = mapped_column(default="confirmed")
    created_at = mapped_column(DateTime, default=now_manila)


# DB-level backstop: one non-cancelled booking per doctor+date+slot
Index("uq_active_slot", Booking.doctor_id, Booking.date, Booking.slot_index,
      unique=True, sqlite_where=Booking.status != "cancelled")
