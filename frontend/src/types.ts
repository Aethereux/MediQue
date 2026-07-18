/* MediQue.ph — API shapes, field-for-field with the backend (spec §4, §6). */

export type Mode = 'onsite' | 'tele';
export type BookingStatus = 'confirmed' | 'completed' | 'cancelled' | 'no_show';
export type Role = 'patient' | 'admin';

export interface AuthUser {
  id: number;
  full_name: string;
  email: string;
  mobile?: string;
  first_name: string;
  initials: string;
  role: Role;
}

export interface Me {
  id: number;
  full_name: string;
  email: string;
  mobile: string | null;
  birthday: string | null;
  sex: string | null;
  age: number | null;
  address: string | null;
  first_name: string;
  initials: string;
  role: Role;
}

export interface Specialty {
  id: string;
  name: string;
  icon: string;
}

export interface AvailabilitySummary {
  booked: number;
  limit: number;
  slots_left: number;
  is_full: boolean;
}

export interface Doctor {
  id: string;
  name: string;
  specialty: string;
  specialty_id: string;
  schedule_text: string;
  days: string[];
  room: string;
  floor: string;
  modes: Mode[];
  rating: number;
  reviews: number;
  years: number;
  color: string;
  bio: string;
  availability: AvailabilitySummary;
}

export interface Slot {
  index: number;
  time: string;
  booked: boolean;
}

export interface DayAvailability {
  doctor_id: string;
  date: string;
  weekday: string;
  open: boolean;
  limit: number;
  booked: number;
  slots_left: number;
  is_full: boolean;
  slots: Slot[];
}

export interface BookingConfirmation {
  id: string;
  doctor: {
    id: string;
    name: string;
    specialty: string;
    room: string;
    floor: string;
    color: string;
  };
  date: string;
  date_label: string;
  time: string;
  mode: Mode;
  position: number;
  position_label: string;
  status: BookingStatus;
  video_link: string | null;
  note: string;
}

export interface MineBooking {
  id: string;
  doctor_id: string;
  doctor_name: string;
  specialty: string;
  date_label: string;
  time: string;
  mode: Mode;
  room: string;
  position: number;
  status: BookingStatus;
  color: string;
}

export interface BookingsMine {
  upcoming: MineBooking[];
  past: MineBooking[];
  counts: { upcoming: number; past: number };
}

export interface BookingDraft {
  doctor: Doctor;
  dateIso: string;
  dow: string;
  weekday: string;
  monthFull: string;
  day: number;
  year: number;
  slotIndex: number;
  slotTime: string;
  mode: Mode;
  position: number;
  booked: number;
  limit: number;
}

export interface AdminDoctor {
  id: string;
  name: string;
  specialty: string;
  specialty_id: string;
  room: string;
  floor: string;
  days: string[];
  modes: Mode[];
  start_min: number;
  slot_limit: number;
  is_active: boolean;
  bio: string;
  color: string;
  rating: number;
  reviews: number;
  years: number;
  schedule_text: string;
}

export interface BoardPatient {
  initials: string;
  name: string;
  ref: string;
}

export interface BoardSlot {
  index: number;
  time: string;
  booked: boolean;
  patient: BoardPatient | null;
}

export interface BoardLane {
  doctor_id: string;
  name: string;
  specialty: string;
  room: string;
  floor: string;
  color: string;
  schedule_text: string;
  open: boolean;
  booked: number;
  limit: number;
  slots: BoardSlot[];
}

export interface DayBoard {
  date: string;
  weekday: string;
  summary: {
    booked: number;
    capacity: number;
    percent: number;
    fully_booked_doctors: string[];
    cancellations_today: number;
  };
  lanes: BoardLane[];
}

export interface AdminBookingRow {
  id: string;
  time: string;
  position: number;
  patient_name: string;
  patient_initials: string;
  mode: Mode;
  status: BookingStatus;
  created_at: string;
}

export interface AdminBookingGroup {
  doctor_id: string;
  doctor_name: string;
  specialty: string;
  room: string;
  floor: string;
  color: string;
  hours: string;
  booked: number;
  limit: number;
  bookings: AdminBookingRow[];
}

export interface AdminBookings {
  date: string;
  counts: Record<string, number>;
  groups: AdminBookingGroup[];
}
