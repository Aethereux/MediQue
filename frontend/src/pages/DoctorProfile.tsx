/* MediQue.ph — doctor profile & slot picking (spec §3 p8, MP-04). */

import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getAvailability, getDoctor } from '../api';
import { Avatar, Btn, CapacityPanel, EmptyState, ModeTag } from '../components';
import { buildDates } from '../dates';
import type { DateOpt } from '../dates';
import { I } from '../icons';
import { useApp } from '../store';
import type { BookingDraft, DayAvailability, Doctor, Mode } from '../types';

/* ---------- Date selector ---------- */
function DateSelector({ dates, value, onChange, clinicDays }: {
  dates: DateOpt[];
  value: string;
  onChange: (iso: string) => void;
  clinicDays: string[];
}) {
  return (
    <div className="scroll-row" style={{ gap: 10 }}>
      {dates.map((d) => {
        const open = clinicDays.includes(d.dow);
        const active = value === d.iso;
        return (
          <button key={d.iso} disabled={!open} onClick={() => open && onChange(d.iso)}
            style={{
              flexShrink: 0, width: 66, padding: '10px 0', borderRadius: 14, cursor: open ? 'pointer' : 'not-allowed',
              border: '1.5px solid ' + (active ? 'var(--c-primary)' : 'var(--c-border)'),
              background: active ? 'var(--c-primary)' : open ? 'var(--c-surface)' : '#F3F6F6',
              color: active ? '#fff' : open ? 'var(--c-text)' : '#AEBCBC',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, transition: 'all .14s ease',
            }}>
            <span style={{ fontSize: 11.5, fontWeight: 600, opacity: .85 }}>{d.isToday ? 'Today' : d.dow}</span>
            <span style={{ fontFamily: 'var(--font-head)', fontWeight: 600, fontSize: 19 }}>{d.day}</span>
            <span style={{ fontSize: 10.5, opacity: .7 }}>{open ? d.month : 'closed'}</span>
          </button>
        );
      })}
    </div>
  );
}

/* ---------- Mode toggle (segmented) ---------- */
function ModeToggle({ modes, value, onChange }: {
  modes: Mode[];
  value: Mode | null;
  onChange: (m: Mode) => void;
}) {
  const all = [
    { id: 'onsite' as Mode, label: 'Onsite', icon: I.building },
    { id: 'tele' as Mode, label: 'Telemedicine', icon: I.video },
  ];
  const opts = all.filter((m) => modes.includes(m.id));
  return (
    <div style={{ display: 'inline-flex', background: '#EEF3F3', borderRadius: 12, padding: 4, gap: 4, width: '100%' }}>
      {opts.map((m) => {
        const active = value === m.id;
        return (
          <button key={m.id} onClick={() => onChange(m.id)}
            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '11px 14px', borderRadius: 9, border: 'none', cursor: 'pointer',
              background: active ? 'var(--c-surface)' : 'transparent', color: active ? (m.id === 'tele' ? '#92500A' : 'var(--c-primary-dark)') : 'var(--c-text-2)',
              fontWeight: 600, fontSize: 14.5, fontFamily: 'var(--font-body)', boxShadow: active ? 'var(--sh-sm)' : 'none', transition: 'all .14s ease' }}>
            {m.icon({ size: 17 })}{m.label}
          </button>
        );
      })}
    </div>
  );
}

function SubLabel({ n, t, inline }: { n: string; t: string; inline?: boolean }) {
  return (
    <div className="row" style={{ gap: 10, marginBottom: inline ? 0 : 14 }}>
      <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 24, height: 24, borderRadius: '50%', background: 'var(--c-primary-tint)', color: 'var(--c-primary-dark)', fontSize: 13, fontWeight: 700, flexShrink: 0 }}>{n}</span>
      <h3 style={{ fontSize: 17 }}>{t}</h3>
    </div>
  );
}

/* ---------- DoctorProfile (KEY SCREEN) ---------- */
export default function DoctorProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, setDraft } = useApp();
  const authed = !!user;
  const dates = useMemo(() => buildDates(), []);

  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [dateIso, setDateIso] = useState<string | null>(null);
  const [avail, setAvail] = useState<DayAvailability | null>(null);
  const [slotIdx, setSlotIdx] = useState<number | null>(null);
  const [mode, setMode] = useState<Mode | null>(null);

  useEffect(() => {
    if (!id) { setNotFound(true); return; }
    let stale = false;
    getDoctor(id)
      .then((doc) => {
        if (stale) return;
        setDoctor(doc);
        setMode(doc.modes.length === 1 ? doc.modes[0] : null);
        const firstClinic = dates.find((x) => doc.days.includes(x.dow)) || dates[0];
        setDateIso(firstClinic.iso);
      })
      .catch(() => { if (!stale) setNotFound(true); });
    return () => { stale = true; };
  }, [id, dates]);

  useEffect(() => {
    if (!id || !dateIso) return;
    let stale = false;
    setSlotIdx(null);
    getAvailability(id, dateIso)
      .then((a) => { if (!stale) setAvail(a); })
      .catch(() => { /* keep previous availability */ });
    return () => { stale = true; };
  }, [id, dateIso]);

  if (notFound) {
    return (
      <div className="screen-body fade-in app-pad">
        <div className="container" style={{ maxWidth: 880, paddingTop: 22, paddingBottom: 120 }}>
          <button className="btn btn-ghost btn-sm" style={{ marginBottom: 14, paddingLeft: 6 }} onClick={() => navigate('/doctors')}>{I.arrowLeft({ size: 17 })} Back to search</button>
          <EmptyState icon={I.search({ size: 30 })} title="Doctor not found" />
        </div>
      </div>
    );
  }

  if (!doctor || !dateIso || !avail) return null;

  const d = doctor;
  const dateObj = dates.find((x) => x.iso === dateIso);
  const slots = avail.open ? avail.slots : [];
  const booked = avail.booked;
  const limit = avail.limit;
  const isFull = !avail.open || avail.is_full;
  const slotObj = slotIdx != null ? slots.find((s) => s.index === slotIdx) || null : null;
  const position = slotIdx != null ? slots.filter((s) => s.index < slotIdx && s.booked).length + 1 : null;
  const ready = !!(slotObj && mode && !isFull);

  const cont = () => {
    if (!slotObj || !mode || !dateObj || position == null) return;
    const draft: BookingDraft = {
      doctor: d,
      dateIso,
      dow: dateObj.dow,
      weekday: dateObj.weekday,
      monthFull: dateObj.monthFull,
      day: dateObj.day,
      year: dateObj.year,
      slotIndex: slotObj.index,
      slotTime: slotObj.time,
      mode,
      position,
      booked,
      limit,
    };
    setDraft(draft);
    if (authed) navigate('/book/review');
    else navigate('/login', { state: { next: '/book/review', intent: true } });
  };

  return (
    <div className="screen-body fade-in app-pad">
      <div className="container" style={{ maxWidth: 880, paddingTop: 22, paddingBottom: 120 }}>
        <button className="btn btn-ghost btn-sm" style={{ marginBottom: 14, paddingLeft: 6 }} onClick={() => navigate('/doctors')}>{I.arrowLeft({ size: 17 })} Back to search</button>

        {/* header */}
        <div className="card" style={{ padding: 'clamp(18px, 3vw, 26px)', marginBottom: 20 }}>
          <div className="profile-head" style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
            <Avatar name={d.name} color={d.color} size={84} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="row" style={{ gap: 10, flexWrap: 'wrap', marginBottom: 6 }}>
                <h1 style={{ fontSize: 'clamp(22px, 3vw, 28px)' }}>{d.name}</h1>
                <span className="row" style={{ gap: 4, color: 'var(--c-text-2)', fontSize: 14, fontWeight: 600 }}><span style={{ color: 'var(--c-accent)', display: 'flex' }}>{I.star({ size: 15 })}</span>{d.rating} <span style={{ fontWeight: 400 }}>({d.reviews})</span></span>
              </div>
              <div style={{ color: 'var(--c-primary-dark)', fontWeight: 600, fontSize: 15.5, marginBottom: 10 }}>{d.specialty}</div>
              <p className="muted" style={{ fontSize: 14.5, maxWidth: 520, marginBottom: 14 }}>{d.bio}</p>
              <div className="row" style={{ gap: 18, flexWrap: 'wrap', fontSize: 13.5, color: 'var(--c-text-2)' }}>
                <span className="row" style={{ gap: 6 }}>{I.mapPin({ size: 16 })}Room {d.room} · {d.floor}</span>
                <span className="row" style={{ gap: 6 }}>{I.calendar({ size: 16 })}{d.schedule_text}</span>
                <span className="row" style={{ gap: 6 }}>{I.zap({ size: 16, style: { color: 'var(--c-accent)' } })}{d.years} yrs experience</span>
              </div>
              <div className="row" style={{ gap: 8, marginTop: 14 }}>{d.modes.map((m) => <ModeTag key={m} mode={m} />)}</div>
            </div>
          </div>
        </div>

        <div className="booking-grid" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 20 }}>
          {/* date + availability + slots */}
          <div className="card card-pad stack" style={{ gap: 22 }}>
            <div>
              <SubLabel n="1" t="Choose a date" />
              <DateSelector dates={dates} value={dateIso} onChange={setDateIso} clinicDays={d.days} />
            </div>

            <div>
              <div className="row" style={{ gap: 8, marginBottom: 12 }}>
                <SubLabel n="2" t="The day's availability" inline />
              </div>
              <CapacityPanel booked={booked} limit={limit} slots={slots} selectedIdx={slotIdx} position={position} full={isFull} date={dateObj ? `${dateObj.weekday}, ${dateObj.monthFull} ${dateObj.day}` : ''} />
            </div>

            <div>
              <SubLabel n="3" t={isFull ? 'No times available' : 'Pick an available time'} />
              <div className="slot-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(94px, 1fr))', gap: 10 }}>
                {slots.map((s) => {
                  const sel = slotIdx === s.index;
                  return (
                    <button key={s.time} disabled={s.booked} onClick={() => setSlotIdx(s.index)}
                      style={{ padding: '12px 6px', borderRadius: 11, cursor: s.booked ? 'not-allowed' : 'pointer', fontWeight: 600, fontSize: 14.5, fontFamily: 'var(--font-body)',
                        border: '1.5px solid ' + (sel ? 'var(--c-primary)' : s.booked ? 'transparent' : 'var(--c-border)'),
                        background: sel ? 'var(--c-primary)' : s.booked ? '#F1F4F4' : 'var(--c-surface)',
                        color: sel ? '#fff' : s.booked ? '#AEBCBC' : 'var(--c-text)',
                        textDecoration: s.booked ? 'line-through' : 'none', transition: 'all .13s ease', position: 'relative' }}>
                      {s.time}
                    </button>
                  );
                })}
              </div>
              {slotObj && (
                <div className="row rise-in" style={{ gap: 8, marginTop: 14, padding: '11px 14px', background: 'var(--c-accent-soft)', border: '1px solid #F4D99B', borderRadius: 11, fontSize: 14, fontWeight: 600, color: '#92500A' }}>
                  {I.calendarCheck({ size: 17, style: { color: 'var(--c-accent)' } })}Slot {slotObj.time} — appointment #{position} of the day.
                </div>
              )}
              <div className="row" style={{ gap: 16, marginTop: 14, fontSize: 12.5, color: 'var(--c-text-2)' }}>
                <span className="row" style={{ gap: 6 }}><span style={{ width: 13, height: 13, borderRadius: 4, border: '1.5px solid var(--c-border)', background: '#fff' }} />Available</span>
                <span className="row" style={{ gap: 6 }}><span style={{ width: 13, height: 13, borderRadius: 4, background: '#F1F4F4' }} />Booked</span>
              </div>
            </div>

            {d.modes.length > 1 && (
              <div>
                <SubLabel n="4" t="Consultation mode" />
                <ModeToggle modes={d.modes} value={mode} onChange={setMode} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* sticky action bar */}
      <div className="sticky-bar" style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 80, background: 'rgba(255,255,255,.95)', backdropFilter: 'blur(10px)', borderTop: '1px solid var(--c-border)', padding: '14px 0', paddingBottom: 'calc(14px + env(safe-area-inset-bottom, 0))' }}>
        <div className="container row" style={{ maxWidth: 880, justifyContent: 'space-between', gap: 16 }}>
          <div className="sticky-summary" style={{ minWidth: 0 }}>
            {slotObj && mode && !isFull
              ? <div><div style={{ fontWeight: 600, fontSize: 14.5 }}>{slotObj.time} · {mode === 'tele' ? 'Telemedicine' : 'Onsite'}</div><div className="muted" style={{ fontSize: 12.5 }}>Appointment #{position} of the day</div></div>
              : <div className="muted" style={{ fontSize: 13.5 }}>{isFull ? 'Fully booked — pick another day' : `Pick a time${d.modes.length > 1 ? ' and mode' : ''} to continue`}</div>}
            {!authed && !isFull && <div className="row" style={{ gap: 6, fontSize: 12, fontWeight: 600, color: 'var(--c-primary-dark)', marginTop: 3 }}>{I.lock({ size: 13 })}You'll be asked to log in to finish booking</div>}
          </div>
          <Btn variant="primary" size="lg" disabled={!ready} trail={I.arrowRight({ size: 18 })} onClick={cont}>{authed ? 'Continue to book' : 'Log in to book'}</Btn>
        </div>
      </div>
    </div>
  );
}
