/* MediQue.ph — reusable components (design brief §6), ported from the prototype. */

import { useState } from 'react';
import type { ButtonHTMLAttributes, CSSProperties, InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from 'react';
import { I, LogoMark, SpecIcon } from './icons';
import type { IconProps } from './icons';
import type { BookingStatus, Doctor, MineBooking, Mode, Slot, Specialty } from './types';

export const cx = (...a: unknown[]) => a.filter(Boolean).join(' ');

/* ---------- Logo wordmark ---------- */
export function Logo({ size = 'md', onClick }: { size?: 'sm' | 'md' | 'lg'; onClick?: () => void }) {
  const fs = size === 'lg' ? 26 : size === 'sm' ? 18 : 21;
  const mk = size === 'lg' ? 40 : size === 'sm' ? 28 : 34;
  return (
    <div className="row" onClick={onClick} style={{ gap: 10, cursor: onClick ? 'pointer' : 'default' }}>
      <LogoMark size={mk} />
      <div style={{ lineHeight: 1.04 }}>
        <div style={{ fontFamily: 'var(--font-head)', fontWeight: 600, fontSize: fs, letterSpacing: '-0.02em', color: 'var(--c-text)' }}>
          MediQue<span style={{ color: 'var(--c-accent)', fontWeight: 500 }}>.ph</span>
        </div>
        <div className="cobrand" style={{ fontSize: size === 'lg' ? 11 : 9.5, color: 'var(--c-text-2)', fontWeight: 500, marginTop: 2, letterSpacing: '.005em' }}>by Makati Medical Center</div>
      </div>
    </div>
  );
}

/* ---------- Avatar ---------- */
export function Avatar({ name, color, size = 44, initials }: { name?: string; color?: string; size?: number; initials?: string }) {
  const init = initials || (name || '?').replace(/^Dr\.\s*/, '').split(' ').map((w) => w[0]).slice(0, 2).join('');
  return (
    <span className="avatar" style={{ width: size, height: size, background: color || 'var(--c-primary)', fontSize: size * 0.38 }}>
      <span>{init}</span>
    </span>
  );
}

/* ---------- Availability / booking badge (signature) ---------- */
export function QueueBadge({ booked, limit, full, position, slotsLeft, today, solid, size }: {
  booked?: number;
  limit?: number;
  full?: boolean;
  position?: number | null;
  slotsLeft?: number | null;
  today?: boolean;
  solid?: boolean;
  size?: 'lg';
}) {
  let txt: string, mod = '', ic = I.users;
  if (full) { txt = 'Fully booked'; mod = 'full'; ic = I.alertCircle; }
  else if (position != null) { txt = `#${position} of the day`; ic = I.calendarCheck; }
  else if (slotsLeft != null) { txt = `${slotsLeft} slot${slotsLeft === 1 ? '' : 's'} left`; mod = 'green'; ic = I.checkCircle; }
  else { txt = `${booked} of ${limit} booked${today ? ' today' : ''}`; ic = I.users; }
  const lg = size === 'lg';
  return (
    <span className={cx('queue-badge', mod, solid && 'solid')} style={lg ? { fontSize: 15, padding: '7px 15px 7px 13px' } : undefined}>
      {ic({ size: lg ? 17 : 15 })}{txt}
    </span>
  );
}

/* ---------- Capacity bar ---------- */
export function CapacityBar({ booked, limit, height = 8 }: { booked: number; limit: number; height?: number }) {
  const pct = limit ? Math.min(100, Math.round((booked / limit) * 100)) : 0;
  const full = booked >= limit;
  return (
    <div style={{ height, background: '#E7EEEE', borderRadius: 999, overflow: 'hidden', width: '100%' }}>
      <div style={{ height: '100%', width: pct + '%', borderRadius: 999, background: full ? 'var(--c-error)' : 'linear-gradient(90deg, var(--c-accent), #F7B43A)', transition: 'width .55s cubic-bezier(.22,.61,.36,1)' }} />
    </div>
  );
}

/* ---------- Mode tag ---------- */
export function ModeTag({ mode }: { mode: Mode }) {
  if (mode === 'tele') return <span className="tag tag-tele">{I.video({ size: 13 })} Telemedicine</span>;
  return <span className="tag tag-onsite">{I.building({ size: 13 })} Onsite</span>;
}

export function StatusPill({ status }: { status: BookingStatus }) {
  const m: Record<BookingStatus, string> = {
    confirmed: 'Confirmed',
    completed: 'Completed',
    cancelled: 'Cancelled',
    no_show: 'Did not attend',
  };
  return <span className={cx('status-pill', 'status-' + status)}>{m[status] || status}</span>;
}

/* ---------- Banner ---------- */
export function Banner({ kind = 'info', icon, children, style }: {
  kind?: 'info' | 'warning' | 'success' | 'error';
  icon?: ReactNode | ((p?: IconProps) => ReactNode);
  children?: ReactNode;
  style?: CSSProperties;
}) {
  const fallback = kind === 'warning' ? I.alertTriangle : kind === 'success' ? I.checkCircle : kind === 'error' ? I.alertCircle : I.info;
  const node = icon == null ? fallback({ size: 19 }) : (typeof icon === 'function' ? icon({ size: 19 }) : icon);
  return <div className={cx('banner', 'banner-' + kind)} style={style}>{node}<div>{children}</div></div>;
}

/* ---------- Buttons ---------- */
interface BtnProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'text' | 'danger';
  size?: 'sm' | 'lg';
  block?: boolean;
  icon?: ReactNode;
  trail?: ReactNode;
}

export function Btn({ variant = 'primary', size, block, icon, trail, children, className, ...rest }: BtnProps) {
  return (
    <button className={cx('btn', 'btn-' + variant, size && 'btn-' + size, block && 'btn-block', className)} {...rest}>
      {icon}{children}{trail}
    </button>
  );
}

/* ---------- Form fields ---------- */
export function Field({ label, hint, error, children, htmlFor }: {
  label?: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  children?: ReactNode;
  htmlFor?: string;
}) {
  return (
    <div className="field">
      {label && <label htmlFor={htmlFor}>{label}</label>}
      {children}
      {hint && !error && <span className="hint">{hint}</span>}
      {error && <span className="err-msg">{I.alertCircle({ size: 14 })}{error}</span>}
    </div>
  );
}

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  icon?: ReactNode;
  error?: ReactNode;
}

export function Input({ icon, error, className, ...rest }: InputProps) {
  const el = <input className={cx('input', error && 'err', className)} {...rest} />;
  if (!icon) return el;
  return <div className="input-wrap"><span className="lead-icon">{icon}</span>{el}</div>;
}

export function PasswordInput({ icon, error, className, ...rest }: InputProps) {
  const [show, setShow] = useState(false);
  return (
    <div className="input-wrap">
      {icon && <span className="lead-icon">{icon}</span>}
      <input className={cx('input', error && 'err', className)} {...rest} type={show ? 'text' : 'password'} />
      <button type="button" className="pw-toggle" onClick={() => setShow((s) => !s)} tabIndex={-1} aria-label="Toggle password">
        {show ? I.eyeOff({ size: 18 }) : I.eye({ size: 18 })}
      </button>
    </div>
  );
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  error?: ReactNode;
}

export function Select({ error, children, className, ...rest }: SelectProps) {
  return (
    <div style={{ position: 'relative' }}>
      <select className={cx('select', error && 'err', className)} style={{ appearance: 'none', paddingRight: 38 }} {...rest}>{children}</select>
      <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--c-text-2)', display: 'flex' }}>{I.chevronDown({ size: 18 })}</span>
    </div>
  );
}

/* ---------- Chip ---------- */
interface ChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  selected?: boolean;
  icon?: ReactNode;
}

export function Chip({ selected, icon, children, className, ...rest }: ChipProps) {
  return <button className={cx('chip', selected && 'selected', className)} {...rest}>{icon}{children}</button>;
}

/* ---------- Specialty card ---------- */
export function SpecialtyCard({ spec, onClick, compact }: { spec: Specialty; onClick?: () => void; compact?: boolean }) {
  return (
    <button className="card card-hover" onClick={onClick}
      style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: compact ? 8 : 12, padding: compact ? '14px 14px' : '18px 16px', textAlign: 'left', cursor: 'pointer', background: 'var(--c-surface)' }}>
      <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: compact ? 38 : 46, height: compact ? 38 : 46, borderRadius: 12, background: 'var(--c-primary-tint)', color: 'var(--c-primary-dark)' }}>
        <SpecIcon name={spec.icon} size={compact ? 20 : 24} />
      </span>
      <span style={{ fontWeight: 600, fontFamily: 'var(--font-head)', fontSize: compact ? 14 : 15.5 }}>{spec.name}</span>
    </button>
  );
}

/* ---------- Doctor card ---------- */
export function DoctorCard({ doctor, onClick }: { doctor: Doctor; onClick?: () => void }) {
  const d = doctor;
  return (
    <div className="card card-hover" style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 14, cursor: 'pointer' }} onClick={onClick}>
      <div className="row" style={{ gap: 14, alignItems: 'flex-start' }}>
        <Avatar name={d.name} color={d.color} size={56} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="row" style={{ justifyContent: 'space-between', gap: 8, alignItems: 'flex-start' }}>
            <div style={{ minWidth: 0 }}>
              <h4 style={{ fontSize: 17, marginBottom: 2 }}>{d.name}</h4>
              <div style={{ color: 'var(--c-primary-dark)', fontWeight: 600, fontSize: 13.5 }}>{d.specialty}</div>
            </div>
            <span className="row" style={{ gap: 4, color: 'var(--c-text-2)', fontSize: 13, fontWeight: 600, flexShrink: 0 }}>
              <span style={{ color: 'var(--c-accent)', display: 'flex' }}>{I.star({ size: 14 })}</span>{d.rating}
            </span>
          </div>
        </div>
      </div>
      <div className="row muted" style={{ gap: 7, fontSize: 13, alignItems: 'flex-start' }}>
        {I.calendar({ size: 15, style: { marginTop: 1 } })}<span>{d.schedule_text}</span>
      </div>
      <div className="row muted" style={{ gap: 7, fontSize: 13 }}>
        {I.mapPin({ size: 15 })}<span>Room {d.room} · {d.floor}</span>
      </div>
      <div className="divider"></div>
      <div className="row" style={{ justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
        <div className="row" style={{ gap: 6 }}>
          {d.modes.map((m) => <ModeTag key={m} mode={m} />)}
        </div>
        <QueueBadge booked={d.availability.booked} limit={d.availability.limit} full={d.availability.is_full} today />
      </div>
      <Btn variant="secondary" block size="sm" trail={I.arrowRight({ size: 16 })}>View &amp; book</Btn>
    </div>
  );
}

/* ---------- Appointment card ---------- */
export function AppointmentCard({ appt, past, onView, onCancel, onRebook }: {
  appt: MineBooking;
  past: boolean;
  onView?: () => void;
  onCancel?: () => void;
  onRebook?: () => void;
}) {
  return (
    <div className="card" style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 14, opacity: appt.status === 'cancelled' ? 0.75 : 1 }}>
      <div className="row" style={{ gap: 14, alignItems: 'flex-start' }}>
        <Avatar name={appt.doctor_name} color={appt.color} size={50} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="row" style={{ justifyContent: 'space-between', gap: 8, alignItems: 'flex-start' }}>
            <div>
              <h4 style={{ fontSize: 16.5 }}>{appt.doctor_name}</h4>
              <div style={{ color: 'var(--c-primary-dark)', fontWeight: 600, fontSize: 13 }}>{appt.specialty}</div>
            </div>
            <StatusPill status={appt.status} />
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px 18px', fontSize: 13.5, color: 'var(--c-text-2)' }}>
        <span className="row" style={{ gap: 6 }}>{I.calendar({ size: 15 })}{appt.date_label}</span>
        <span className="row" style={{ gap: 6 }}>{I.clock({ size: 15 })}{appt.time}</span>
        <span className="row" style={{ gap: 6 }}>{appt.mode === 'tele' ? I.video({ size: 15 }) : I.mapPin({ size: 15 })}{appt.mode === 'tele' ? 'Telemedicine' : 'Room ' + appt.room}</span>
      </div>
      <div className="row" style={{ justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
        {!past ? <QueueBadge position={appt.position} /> : <span className="muted" style={{ fontSize: 13 }}>Ref {appt.id}</span>}
        <div className="row" style={{ gap: 8 }}>
          {past
            ? <Btn variant="secondary" size="sm" onClick={onRebook} icon={I.refresh({ size: 15 })}>Book again</Btn>
            : <>
                <Btn variant="ghost" size="sm" onClick={onView}>View details</Btn>
                {appt.status === 'confirmed' && <Btn variant="danger" size="sm" onClick={onCancel}>Cancel</Btn>}
              </>}
        </div>
      </div>
    </div>
  );
}

/* ---------- Person glyph for capacity viz ---------- */
export function PersonGlyph({ size = 22, color }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} aria-hidden="true">
      <circle cx="12" cy="7.5" r="3.6" />
      <path d="M4.5 20.5a7.5 7.5 0 0 1 15 0Z" />
    </svg>
  );
}

/* ---------- Capacity panel (signature, doctor profile — booking count, not a live queue) ---------- */
export function CapacityPanel({ booked, limit, slots, selectedIdx, position, date, full }: {
  booked: number;
  limit: number;
  slots: Slot[];
  selectedIdx?: number | null;
  position?: number | null;
  date: string;
  full?: boolean;
}) {
  const left = Math.max(0, limit - booked);
  const C_BOOKED = 'var(--c-primary)';
  const C_YOU = 'var(--c-accent)';
  const C_OPEN = '#D2E2E2';
  const colorOf = (s: Slot) => (s.index === selectedIdx ? C_YOU : s.booked ? C_BOOKED : C_OPEN);

  if (full) {
    return (
      <div style={{ background: 'var(--c-error-soft)', border: '1px solid #F0CFCF', borderRadius: 'var(--r-card)', padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div className="row" style={{ justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <div className="row" style={{ gap: 14 }}>
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 48, height: 48, borderRadius: 14, background: '#fff', color: 'var(--c-error)', flexShrink: 0 }}>{I.alertCircle({ size: 26 })}</span>
            <div>
              <div style={{ fontFamily: 'var(--font-head)', fontWeight: 600, fontSize: 18, color: '#B91C1C' }}>Fully booked</div>
              <div style={{ fontSize: 13.5, color: '#B45050' }}>{limit} of {limit} slots booked for {date}</div>
            </div>
          </div>
          <QueueBadge full />
        </div>
        <CapacityBar booked={limit} limit={limit} />
        <div className="row" style={{ gap: 7, fontSize: 13.5, color: '#B91C1C', fontWeight: 500 }}>{I.alertTriangle({ size: 15 })}Fully booked for this date — please pick another day.</div>
      </div>
    );
  }

  const viz = (
    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', gap: 3, maxWidth: 430 }}>
      {slots.map((s, i) => {
        const you = s.index === selectedIdx;
        return (
          <span key={i} style={{ position: 'relative', animation: 'pop .4s ease both', animationDelay: i * 20 + 'ms' }}>
            <PersonGlyph size={you ? 30 : 24} color={colorOf(s)} />
            {you && <span style={{ position: 'absolute', top: -15, left: '50%', transform: 'translateX(-50%)', fontSize: 9.5, fontWeight: 800, color: '#92500A', background: 'var(--c-accent-soft)', border: '1px solid #F4D99B', borderRadius: 999, padding: '1px 6px', whiteSpace: 'nowrap' }}>YOU</span>}
          </span>
        );
      })}
    </div>
  );

  return (
    <div style={{ background: 'linear-gradient(135deg, var(--c-primary-tint), #fff 80%)', border: '1px solid #CBE6E6', borderRadius: 'var(--r-card)', padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 15 }}>
      <div className="row" style={{ justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div className="row" style={{ gap: 14, alignItems: 'baseline' }}>
          <div style={{ fontFamily: 'var(--font-head)', fontWeight: 600, fontSize: 38, lineHeight: 1, color: 'var(--c-primary-dark)' }}>{booked}<span style={{ fontSize: 20, color: 'var(--c-text-2)' }}> / {limit}</span></div>
          <div style={{ lineHeight: 1.3 }}>
            <div style={{ fontWeight: 600, fontSize: 15 }}>slots booked</div>
            <div className="muted" style={{ fontSize: 13.5 }}>for {date}</div>
          </div>
        </div>
        {position != null ? <QueueBadge position={position} solid size="lg" /> : <QueueBadge slotsLeft={left} size="lg" />}
      </div>
      <CapacityBar booked={booked} limit={limit} />
      <div style={{ paddingTop: selectedIdx != null ? 12 : 2 }}>{viz}</div>
      <div className="muted" style={{ fontSize: 12.5, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <span className="row" style={{ gap: 6 }}><span style={{ width: 10, height: 10, borderRadius: 3, background: 'var(--c-primary)' }} />Booked</span>
        {selectedIdx != null && <span className="row" style={{ gap: 6 }}><span style={{ width: 10, height: 10, borderRadius: 3, background: 'var(--c-accent)' }} />Your slot</span>}
        <span className="row" style={{ gap: 6 }}><span style={{ width: 10, height: 10, borderRadius: 3, background: '#D2E2E2' }} />Open</span>
      </div>
    </div>
  );
}

/* ---------- Empty state ---------- */
export function EmptyState({ icon, title, body, action }: {
  icon?: ReactNode;
  title: ReactNode;
  body?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="card" style={{ padding: '44px 28px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, textAlign: 'center' }}>
      <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 64, height: 64, borderRadius: 18, background: 'var(--c-primary-tint)', color: 'var(--c-primary)' }}>{icon}</span>
      <h4 style={{ fontSize: 17 }}>{title}</h4>
      {body && <p className="muted" style={{ fontSize: 14, maxWidth: 320 }}>{body}</p>}
      {action}
    </div>
  );
}

/* ---------- Modal ---------- */
export function Modal({ open, onClose, children, maxw = 460 }: {
  open: boolean;
  onClose?: () => void;
  children?: ReactNode;
  maxw?: number;
}) {
  if (!open) return null;
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(31,42,46,.42)', backdropFilter: 'blur(2px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, animation: 'fadeIn .2s ease' }}>
      <div className="card rise-in" onClick={(e) => e.stopPropagation()} style={{ maxWidth: maxw, width: '100%', boxShadow: 'var(--sh-lg)', padding: 26 }}>{children}</div>
    </div>
  );
}

/* ---------- Toast ---------- */
export function Toast({ toast }: { toast: string | null }) {
  if (!toast) return null;
  return (
    <div style={{ position: 'fixed', bottom: 'calc(env(safe-area-inset-bottom, 0) + 22px)', left: '50%', transform: 'translateX(-50%)', zIndex: 300 }}>
      <div className="rise-in row" style={{ gap: 10, background: 'var(--c-text)', color: '#fff', padding: '12px 18px', borderRadius: 12, boxShadow: 'var(--sh-lg)', fontSize: 14, fontWeight: 500, maxWidth: 'calc(100vw - 32px)' }}>
        <span style={{ color: 'var(--c-success)', display: 'flex' }}>{I.checkCircle({ size: 18 })}</span>{toast}
      </div>
    </div>
  );
}
