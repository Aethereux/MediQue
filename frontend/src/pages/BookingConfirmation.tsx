/* MediQue.ph — booking confirmation (spec §3 p10, MP-06). */

import type { ReactElement } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Avatar, Banner, Btn } from '../components';
import { I } from '../icons';
import type { IconProps } from '../icons';
import { useApp } from '../store';

export default function BookingConfirmation() {
  const { lastBooked } = useApp();
  const navigate = useNavigate();

  if (!lastBooked) return <Navigate to="/dashboard" replace />;
  const b = lastBooked;
  const doctor = b.doctor;
  const tele = b.mode === 'tele';

  const rows: [string, string, (p?: IconProps) => ReactElement][] = [
    ['Date', b.date_label, I.calendar],
    ['Time', b.time, I.clock],
    ['Your slot', `${b.time} · ${b.note}`, I.calendarCheck],
    ['Appointment', `#${b.position} of the day`, I.users],
    ['Mode', tele ? 'Telemedicine' : 'Onsite', tele ? I.video : I.building],
    [tele ? 'Video link' : 'Location', tele ? (b.video_link ?? '').replace(/^https?:\/\//, '') : `Room ${doctor.room} · ${doctor.floor}`, tele ? I.external : I.mapPin],
    ['Reference ID', b.id, I.shield],
  ];

  return (
    <div className="screen-body fade-in app-pad">
      <div className="container" style={{ maxWidth: 540, paddingTop: 36, paddingBottom: 80 }}>
        <div className="stack center" style={{ gap: 14, marginBottom: 26 }}>
          <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 84, height: 84, borderRadius: '50%', background: 'var(--c-success-soft)', color: 'var(--c-success)', animation: 'pop .5s cubic-bezier(.22,.61,.36,1)' }}>{I.checkCircle({ size: 46 })}</span>
          <h1 style={{ fontSize: 28 }}>Your appointment is confirmed!</h1>
          <p className="muted" style={{ fontSize: 15.5, maxWidth: 380 }}>We've reserved your slot at Makati Medical Center. Here are your details.</p>
        </div>

        <div className="card" style={{ overflow: 'hidden', marginBottom: 18 }}>
          <div style={{ background: 'var(--c-primary)', color: '#fff', padding: '18px 22px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
            <div className="row" style={{ gap: 12 }}>
              <Avatar name={doctor.name} color="rgba(255,255,255,.2)" size={46} />
              <div><div style={{ fontWeight: 600, fontSize: 16, fontFamily: 'var(--font-head)' }}>{doctor.name}</div><div style={{ fontSize: 13, color: 'rgba(255,255,255,.85)' }}>{doctor.specialty}</div></div>
            </div>
            <span className="queue-badge solid" style={{ fontSize: 14 }}>{I.calendarCheck({ size: 16 })}{b.position_label}</span>
          </div>
          <div className="card-pad stack" style={{ gap: 0 }}>
            {rows.map(([k, v, ic], i, arr) => (
              <div key={k} className="row" style={{ gap: 13, padding: '13px 0', borderBottom: i < arr.length - 1 ? '1px solid var(--c-border)' : 'none' }}>
                <span style={{ color: 'var(--c-text-2)', display: 'flex', flexShrink: 0 }}>{ic({ size: 18 })}</span>
                <span className="muted" style={{ fontSize: 13.5, flexShrink: 0, whiteSpace: 'nowrap' }}>{k}</span>
                <span style={{ fontWeight: 600, fontSize: 14, textAlign: 'right', flex: 1, color: k === 'Video link' ? 'var(--c-primary)' : 'var(--c-text)' }}>{v}</span>
              </div>
            ))}
          </div>
        </div>

        <Banner kind="warning" style={{ marginBottom: 22 }}>Slot positions and arrival times are estimates and may change due to emergencies, delays, or cancellations. You'll be notified of any updates.</Banner>

        <div className="stack" style={{ gap: 10 }}>
          <Btn variant="primary" size="lg" block icon={I.calendarCheck({ size: 19 })} onClick={() => navigate('/appointments')}>View my appointments</Btn>
          <div className="row" style={{ gap: 10 }}>
            <Btn variant="secondary" block icon={I.calendarPlus({ size: 18 })}>Add to calendar</Btn>
            <Btn variant="ghost" block onClick={() => navigate('/dashboard')}>Back to dashboard</Btn>
          </div>
        </div>
      </div>
    </div>
  );
}
