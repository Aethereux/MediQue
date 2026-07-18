/* MediQue.ph — Dashboard (logged-in home). */

import { useEffect, useState } from 'react';
import type { ReactElement } from 'react';
import { useNavigate } from 'react-router-dom';
import { ApiError, cancelBooking, getMyBookings, getSpecialties } from '../api';
import { Avatar, Btn, Modal, QueueBadge, SpecialtyCard } from '../components';
import { longLabel, todayOpt } from '../dates';
import { I } from '../icons';
import type { IconProps } from '../icons';
import { useApp } from '../store';
import type { BookingsMine, MineBooking, Specialty } from '../types';

function QuickLink({ icon, title, sub, onClick }: {
  icon: (p?: IconProps) => ReactElement;
  title: string;
  sub: string;
  onClick?: () => void;
}) {
  return (
    <button className="card card-hover" onClick={onClick} style={{ padding: 18, display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer', textAlign: 'left', background: 'var(--c-surface)' }}>
      <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 46, height: 46, borderRadius: 13, background: 'var(--c-primary-tint)', color: 'var(--c-primary)', flexShrink: 0 }}>{icon({ size: 23 })}</span>
      <div style={{ flex: 1 }}><div style={{ fontWeight: 600, fontSize: 15.5, fontFamily: 'var(--font-head)' }}>{title}</div><div className="muted" style={{ fontSize: 13 }}>{sub}</div></div>
      <span style={{ color: 'var(--c-text-2)', display: 'flex' }}>{I.chevronRight({ size: 20 })}</span>
    </button>
  );
}

export default function Dashboard() {
  const { user, showToast } = useApp();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<BookingsMine | null>(null);
  const [specs, setSpecs] = useState<Specialty[]>([]);
  const [cancelTarget, setCancelTarget] = useState<MineBooking | null>(null);
  const today = todayOpt();

  const load = () => {
    getMyBookings().then(setBookings).catch(() => { /* handled globally on 401 */ });
  };
  useEffect(() => {
    load();
    getSpecialties().then(setSpecs).catch(() => { /* handled globally on 401 */ });
  }, []);

  const next = bookings ? bookings.upcoming[0] ?? null : null;

  const doCancel = async (b: MineBooking) => {
    setCancelTarget(null);
    try {
      const res = await cancelBooking(b.id);
      showToast(res.message);
      load();
    } catch (e) {
      showToast(e instanceof ApiError ? e.detail : 'Something went wrong. Please try again.');
    }
  };

  return (
    <div className="screen-body fade-in app-pad">
      <div className="container" style={{ maxWidth: 1040, paddingTop: 28, paddingBottom: 60 }}>
        <div style={{ marginBottom: 24 }}>
          <div className="muted" style={{ fontSize: 14, fontWeight: 500 }}>{longLabel(today)}</div>
          <h1 style={{ fontSize: 'clamp(24px, 3.4vw, 32px)', marginTop: 4 }}>Good day, {user?.first_name}.</h1>
        </div>

        <div className="dash-grid" style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 20, marginBottom: 26 }}>
          {/* primary CTA */}
          <div className="card" style={{ padding: 'clamp(22px, 3vw, 30px)', background: 'linear-gradient(135deg, var(--c-primary), var(--c-primary-dark))', color: '#fff', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 22, position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', right: -30, top: -30, width: 160, height: 160, borderRadius: '50%', background: 'rgba(255,255,255,.08)' }} />
            <div style={{ position: 'relative' }}>
              <span className="row" style={{ gap: 7, fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,.85)', marginBottom: 12 }}>{I.zap({ size: 16 })}Skip the wait</span>
              <h2 style={{ color: '#fff', fontSize: 'clamp(22px, 3vw, 28px)', maxWidth: 360 }}>Find a doctor and see how full each day is</h2>
            </div>
            <button className="btn btn-lg" style={{ alignSelf: 'flex-start', background: '#fff', color: 'var(--c-primary-dark)', position: 'relative' }} onClick={() => navigate('/doctors')}>{I.search({ size: 19 })}Find a doctor</button>
          </div>

          {/* next appointment */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ fontSize: 16, marginBottom: 12 }}>Your next appointment</h3>
            {bookings && (next ? (
              <div className="card" style={{ padding: 18, flex: 1, display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div className="row" style={{ gap: 12 }}>
                  <Avatar name={next.doctor_name} color={next.color} size={46} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 15.5, fontFamily: 'var(--font-head)' }}>{next.doctor_name}</div>
                    <div style={{ color: 'var(--c-primary-dark)', fontWeight: 600, fontSize: 13 }}>{next.specialty}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 16px', fontSize: 13, color: 'var(--c-text-2)' }}>
                  <span className="row" style={{ gap: 6 }}>{I.calendar({ size: 14 })}{next.date_label}</span>
                  <span className="row" style={{ gap: 6 }}>{I.clock({ size: 14 })}{next.time}</span>
                  <span className="row" style={{ gap: 6 }}>{next.mode === 'tele' ? I.video({ size: 14 }) : I.mapPin({ size: 14 })}{next.mode === 'tele' ? 'Telemedicine' : 'Room ' + next.room}</span>
                </div>
                <div className="row" style={{ justifyContent: 'space-between', gap: 8, marginTop: 'auto' }}>
                  <QueueBadge position={next.position} />
                  <div className="row" style={{ gap: 4 }}>
                    <Btn variant="ghost" size="sm" onClick={() => navigate('/appointments')}>Details</Btn>
                    <Btn variant="danger" size="sm" onClick={() => setCancelTarget(next)}>Cancel</Btn>
                  </div>
                </div>
              </div>
            ) : (
              <div className="card" style={{ padding: 22, flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, textAlign: 'center' }}>
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 52, height: 52, borderRadius: 14, background: 'var(--c-primary-tint)', color: 'var(--c-primary)' }}>{I.calendarPlus({ size: 26 })}</span>
                <p style={{ fontSize: 14.5, fontWeight: 500 }}>No upcoming appointments — let's book one.</p>
                <Btn variant="secondary" size="sm" onClick={() => navigate('/doctors')}>Find a doctor</Btn>
              </div>
            ))}
          </div>
        </div>

        {/* browse by specialty */}
        <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ fontSize: 18 }}>Browse by specialty</h3>
          <Btn variant="text" trail={I.arrowRight({ size: 16 })} onClick={() => navigate('/doctors')}>View all</Btn>
        </div>
        <div className="spec-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 14, marginBottom: 30 }}>
          {specs.map((s) => <SpecialtyCard key={s.id} spec={s} compact onClick={() => navigate('/doctors?specialty=' + s.id)} />)}
        </div>

        {/* quick links */}
        <div className="quick-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <QuickLink icon={I.calendarCheck} title="My appointments" sub="View upcoming & past visits" onClick={() => navigate('/appointments')} />
          <QuickLink icon={I.user} title="My account" sub="Update your personal details" onClick={() => navigate('/account')} />
        </div>
      </div>

      <Modal open={!!cancelTarget} onClose={() => setCancelTarget(null)}>
        <div className="stack" style={{ gap: 8 }}>
          <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 52, height: 52, borderRadius: 14, background: 'var(--c-error-soft)', color: 'var(--c-error)', marginBottom: 6 }}>{I.alertTriangle({ size: 26 })}</span>
          <h3 style={{ fontSize: 20 }}>Cancel this appointment?</h3>
          {cancelTarget && <p className="muted" style={{ fontSize: 14.5 }}>You're about to cancel your {cancelTarget.specialty} consultation with {cancelTarget.doctor_name} on {cancelTarget.date_label}. This frees up your slot for other patients.</p>}
          <div className="row" style={{ gap: 10, marginTop: 16 }}>
            <Btn variant="secondary" block onClick={() => setCancelTarget(null)}>Keep appointment</Btn>
            <button className="btn btn-block" style={{ background: 'var(--c-error)', color: '#fff' }} onClick={() => cancelTarget && doCancel(cancelTarget)}>Yes, cancel</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
