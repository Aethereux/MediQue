/* MediQue.ph — admin Bookings (/admin/bookings). GET /api/admin/bookings + MP-13 actions. */

import { useEffect, useRef, useState } from 'react';
import type { MouseEvent } from 'react';
import {
  adminBookings, adminCancelBooking, adminCompleteBooking, adminNoShowBooking, ApiError,
} from '../../api';
import { useApp } from '../../store';
import type { AdminBookingRow, AdminBookings as AdminBookingsData, BookingStatus } from '../../types';
import { addDaysIso, docInitials, isoParts, MON, parseTimeLabel, todayIsoManila } from './AdminLayout';

type Filter = 'all' | BookingStatus;

const TABS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'confirmed', label: 'Confirmed' },
  { key: 'completed', label: 'Completed' },
  { key: 'cancelled', label: 'Cancelled' },
];

const STATUS_UI: Record<BookingStatus, { cls: string; label: string }> = {
  confirmed: { cls: 's-confirmed', label: 'Confirmed' },
  completed: { cls: 's-completed', label: 'Completed' },
  cancelled: { cls: 's-cancelled', label: 'Cancelled' },
  no_show: { cls: 's-completed', label: 'Did not attend' },
};

/* icons exactly as in the design file */
const icoCheck = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
);
const icoChevron = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
);
const icoNoShow = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="m17 8 5 5M22 8l-5 5" /></svg>
);
const icoX = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
);
const icoEye = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></svg>
);
const icoOnsiteTag = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="2" width="16" height="20" rx="2" /><path d="M9 22v-4h6v4" /></svg>
);
const icoTeleTag = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="m16 10 4.6-2.3A1 1 0 0 1 22 8.6v6.8a1 1 0 0 1-1.4.9L16 14" /><rect x="2" y="6" width="14" height="12" rx="2" /></svg>
);

function bookedLabel(createdAt: string): string {
  const [, m, d] = createdAt.slice(0, 10).split('-').map(Number);
  return MON[m - 1] + ' ' + d;
}

export default function AdminBookings() {
  const { showToast } = useApp();
  const today = todayIsoManila();
  const [dateIso, setDateIso] = useState(today);
  const [status, setStatus] = useState<Filter>('all');
  const [data, setData] = useState<AdminBookingsData | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set());
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const toastRef = useRef(showToast);
  toastRef.current = showToast;

  useEffect(() => {
    let live = true;
    adminBookings(dateIso, status)
      .then((d) => { if (live) setData(d); })
      .catch((e: unknown) => toastRef.current(e instanceof ApiError ? e.detail : 'Something went wrong. Please try again.'));
    return () => { live = false; };
  }, [dateIso, status]);

  useEffect(() => {
    const close = () => setOpenMenu(null);
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, []);

  const fail = (e: unknown) => showToast(e instanceof ApiError ? e.detail : 'Something went wrong. Please try again.');

  const act = async (id: string, o: 'completed' | 'noshow' | 'cancelled') => {
    setOpenMenu(null);
    try {
      if (o === 'completed') await adminCompleteBooking(id);
      else if (o === 'noshow') await adminNoShowBooking(id);
      else await adminCancelBooking(id);
      setData(await adminBookings(dateIso, status));
    } catch (e) {
      fail(e);
    }
  };

  const toggleExpanded = (doctorId: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(doctorId)) next.delete(doctorId);
      else next.add(doctorId);
      return next;
    });

  const days = Array.from({ length: 5 }, (_, i) => isoParts(addDaysIso(today, i - 2)));
  const sel = isoParts(dateIso);
  const count = (k: Filter) => (data ? data.counts[k] || 0 : 0);

  const renderRow = (b: AdminBookingRow) => {
    const cancelled = b.status === 'cancelled';
    const ui = STATUS_UI[b.status];
    return (
      <div className="bk" key={b.id} style={cancelled ? { opacity: 0.72 } : undefined}>
        <div className="time">
          <div className="t">{b.time}</div>
          {cancelled
            ? <div className="pos" style={{ color: '#B91C1C' }}>slot freed</div>
            : <div className="pos">#{b.position} of the day</div>}
        </div>
        <div className="who">
          <span className="avatar" style={{ width: 34, height: 34, background: '#5B6B70', fontSize: 12 }}>{b.patient_initials}</span>
          <div>
            <div className="pn" style={cancelled ? { textDecoration: 'line-through' } : undefined}>{b.patient_name}</div>
            <div className="ref">{b.id} · booked {bookedLabel(b.created_at)}</div>
          </div>
        </div>
        <span className={'tag ' + (b.mode === 'tele' ? 't-tele' : 't-onsite')}>
          {b.mode === 'tele' ? icoTeleTag : icoOnsiteTag}
          {b.mode === 'tele' ? 'Telemedicine' : 'Onsite'}
        </span>
        <span className={'status ' + ui.cls}>{ui.label}</span>
        <div className="acts">
          {b.status === 'confirmed' ? (
            <div className="outcome">
              <button
                className="btn-outcome"
                type="button"
                onClick={(e: MouseEvent<HTMLButtonElement>) => {
                  e.stopPropagation();
                  setOpenMenu((cur) => (cur === b.id ? null : b.id));
                }}
              >
                {icoCheck}Set outcome{icoChevron}
              </button>
              <div className={'omenu' + (openMenu === b.id ? ' open' : '')}>
                <button className="oitem" onClick={(e) => { e.stopPropagation(); void act(b.id, 'completed'); }}>{icoCheck}Completed</button>
                <button className="oitem" onClick={(e) => { e.stopPropagation(); void act(b.id, 'noshow'); }}>{icoNoShow}Did not attend</button>
                <button className="oitem red" onClick={(e) => { e.stopPropagation(); void act(b.id, 'cancelled'); }}>{icoX}Cancel booking</button>
              </div>
            </div>
          ) : (
            <button className="iconbtn" title="View">{icoEye}</button>
          )}
        </div>
      </div>
    );
  };

  return (
    <main className="wrap" style={{ maxWidth: 1180 }}>
      <div className="pagehead">
        <div>
          <h1>Bookings</h1>
          <div className="sub">{count('all')} bookings · {sel.weekday}, {sel.monthFull} {sel.day}, {sel.year} · grouped by doctor</div>
        </div>
        <div className="search" style={{ width: 290 }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
          Search patient or ref (MQ-…)
        </div>
      </div>

      <div className="filters">
        {days.map((w) => (
          <button key={w.iso} className={'day' + (w.iso === dateIso ? ' on' : '')} onClick={() => setDateIso(w.iso)}>
            {w.dow} {w.day}
          </button>
        ))}
        <span className="vr"></span>
        <div className="tabs">
          {TABS.map((t) => (
            <button key={t.key} className={'tab' + (status === t.key ? ' on' : '')} onClick={() => setStatus(t.key)}>
              {t.label} ({count(t.key)})
            </button>
          ))}
        </div>
      </div>

      {data && data.groups.map((g) => {
        const full = g.booked >= g.limit;
        const pct = g.limit ? Math.min(100, Math.round((g.booked / g.limit) * 100)) : 0;
        const rows = [...g.bookings].sort((a, b) => parseTimeLabel(a.time) - parseTimeLabel(b.time));
        const isOpen = expanded.has(g.doctor_id);
        const visible = rows.length > 4 && !isOpen ? rows.slice(0, 4) : rows;
        return (
          <div className="group" key={g.doctor_id}>
            <div className="ghead">
              <span className="avatar" style={{ width: 38, height: 38, background: g.color, fontSize: 13 }}>{docInitials(g.doctor_name)}</span>
              <div>
                <div className="nm">{g.doctor_name}</div>
                <div className="sp">{g.specialty} · Rm {g.room} · {g.hours}</div>
              </div>
              {full && <span className="pill p-full" style={{ marginLeft: 10 }}>Fully booked</span>}
              <div className="cap"><b>{g.booked} / {g.limit}</b>{!full && <> · {g.limit - g.booked} left</>}</div>
              <div className="capbar"><i className={full ? 'full' : undefined} style={{ width: pct + '%' }}></i></div>
            </div>
            {visible.map(renderRow)}
            {rows.length > 4 && (
              <button className="more" onClick={() => toggleExpanded(g.doctor_id)}>
                {isOpen ? 'Show less ↑' : `Show ${rows.length - 4} more bookings ↓`}
              </button>
            )}
          </div>
        );
      })}
    </main>
  );
}
