"""Permissive request schemas — endpoints validate manually so every error is
one exact human message in {"detail": ...} (the global handler catches the rest)."""
from typing import Optional

from pydantic import BaseModel, ConfigDict


class Loose(BaseModel):
    model_config = ConfigDict(extra="ignore", coerce_numbers_to_str=True)


class RegisterIn(Loose):
    full_name: str = ""
    email: str = ""
    mobile: str = ""
    password: str = ""


class LoginIn(Loose):
    email: str = ""
    password: str = ""


class BookingIn(Loose):
    doctor_id: str = ""
    date: str = ""
    slot_index: int = -1
    mode: str = ""


class AccountIn(Loose):
    full_name: Optional[str] = None
    email: Optional[str] = None
    mobile: Optional[str] = None
    birthday: Optional[str] = None
    sex: Optional[str] = None
    address: Optional[str] = None


class ContactIn(Loose):
    name: str = ""
    email: str = ""
    message: str = ""


class DoctorIn(Loose):
    name: Optional[str] = None
    specialty_id: Optional[str] = None
    room: Optional[str] = None
    floor: Optional[str] = None
    days: Optional[list] = None
    start_min: Optional[int] = None
    slot_limit: Optional[int] = None
    modes: Optional[list] = None
    bio: Optional[str] = None


class SpecialtyIn(Loose):
    name: str = ""
    icon: Optional[str] = None
