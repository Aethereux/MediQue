/* MediQue.ph — typed API client (base http://localhost:8000). */

import type {
  AdminBookings,
  AdminDoctor,
  AuthUser,
  BookingConfirmation,
  BookingsMine,
  BookingStatus,
  DayAvailability,
  DayBoard,
  Doctor,
  Me,
  Mode,
  Specialty,
} from './types';

const BASE = 'http://localhost:8000';
const TOKEN_KEY = 'mq_token';

export class ApiError extends Error {
  status: number;
  detail: string;
  constructor(status: number, detail: string) {
    super(detail);
    this.status = status;
    this.detail = detail;
  }
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}
export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}
export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const headers: Record<string, string> = {};
  if (init?.body) headers['Content-Type'] = 'application/json';
  const token = getToken();
  if (token) headers['Authorization'] = 'Bearer ' + token;
  const res = await fetch(BASE + path, { ...init, headers });
  if (!res.ok) {
    let detail = 'Something went wrong. Please try again.';
    try {
      const data: unknown = await res.json();
      if (
        typeof data === 'object' && data !== null &&
        typeof (data as { detail?: unknown }).detail === 'string'
      ) {
        detail = (data as { detail: string }).detail;
      }
    } catch {
      /* non-JSON error body — keep fallback detail */
    }
    if (res.status === 401 && token) {
      clearToken();
      window.dispatchEvent(new Event('mq:unauthorized'));
    }
    throw new ApiError(res.status, detail);
  }
  return res.json() as Promise<T>;
}

const get = <T>(path: string) => request<T>(path);
const post = <T>(path: string, body?: unknown) =>
  request<T>(path, { method: 'POST', body: body === undefined ? undefined : JSON.stringify(body) });
const patch = <T>(path: string, body: unknown) =>
  request<T>(path, { method: 'PATCH', body: JSON.stringify(body) });
const del = <T>(path: string) => request<T>(path, { method: 'DELETE' });

export interface AuthResponse {
  user: AuthUser;
  access_token: string;
  token_type: string;
}

export interface AdminDoctorPayload {
  name: string;
  specialty_id: string;
  room: string;
  floor: string;
  days: string[];
  start_min: number;
  slot_limit: number;
  modes: Mode[];
  bio: string;
}

/* ---------- auth ---------- */
export const apiRegister = (p: { full_name: string; email: string; mobile: string; password: string }) =>
  post<AuthResponse>('/api/auth/register', p);

export const apiLogin = (p: { email: string; password: string }) =>
  post<AuthResponse>('/api/auth/login', p);

export const apiMe = () => get<Me>('/api/auth/me');

/* ---------- directory ---------- */
export const getSpecialties = () => get<Specialty[]>('/api/specialties');

export const getDoctors = (p?: { specialty?: string; q?: string }) => {
  const qs = new URLSearchParams();
  if (p?.specialty) qs.set('specialty', p.specialty);
  if (p?.q) qs.set('q', p.q);
  const s = qs.toString();
  return get<Doctor[]>('/api/doctors' + (s ? '?' + s : ''));
};

export const getDoctor = (id: string) => get<Doctor>('/api/doctors/' + id);

export const getAvailability = (id: string, dateIso: string) =>
  get<DayAvailability>(`/api/doctors/${id}/availability?date=${dateIso}`);

/* ---------- bookings ---------- */
export const createBooking = (p: { doctor_id: string; date: string; slot_index: number; mode: Mode }) =>
  post<BookingConfirmation>('/api/bookings', p);

export const getMyBookings = () => get<BookingsMine>('/api/bookings/mine');

export const cancelBooking = (id: string) =>
  post<{ id: string; status: BookingStatus; message: string }>(`/api/bookings/${id}/cancel`);

/* ---------- account ---------- */
export const updateAccount = (
  p: Partial<{ full_name: string; email: string; mobile: string; birthday: string; sex: string; address: string }>,
) => patch<Me & { message: string }>('/api/account', p);

export const requestPasswordReset = () => post<{ message: string }>('/api/account/password-reset');

/* ---------- contact ---------- */
export const sendContact = (p: { name: string; email: string; message: string }) =>
  post<{ message: string }>('/api/contact', p);

/* ---------- admin ---------- */
export const adminDayboard = (dateIso: string) => get<DayBoard>('/api/admin/dayboard?date=' + dateIso);

export const adminBookings = (dateIso: string, status: 'all' | BookingStatus) =>
  get<AdminBookings>(`/api/admin/bookings?date=${dateIso}&status=${status}`);

export const adminCompleteBooking = (id: string) =>
  post<{ id: string; status: BookingStatus }>(`/api/admin/bookings/${id}/complete`);

export const adminNoShowBooking = (id: string) =>
  post<{ id: string; status: BookingStatus }>(`/api/admin/bookings/${id}/no-show`);

export const adminCancelBooking = (id: string) =>
  post<{ id: string; status: BookingStatus }>(`/api/admin/bookings/${id}/cancel`);

export const adminListDoctors = () => get<AdminDoctor[]>('/api/admin/doctors');

export const adminCreateDoctor = (p: AdminDoctorPayload) => post<AdminDoctor>('/api/admin/doctors', p);

export const adminUpdateDoctor = (id: string, p: Partial<AdminDoctorPayload>) =>
  patch<AdminDoctor>('/api/admin/doctors/' + id, p);

export const adminDeactivateDoctor = (id: string) =>
  post<{ id: string; is_active: boolean; message: string }>(`/api/admin/doctors/${id}/deactivate`);

export const adminActivateDoctor = (id: string) =>
  post<{ id: string; is_active: boolean; message: string }>(`/api/admin/doctors/${id}/activate`);

export const adminDeleteDoctor = (id: string) => del<{ message: string }>('/api/admin/doctors/' + id);

export const adminCreateSpecialty = (p: { name: string; icon?: string }) =>
  post<Specialty>('/api/admin/specialties', p);
