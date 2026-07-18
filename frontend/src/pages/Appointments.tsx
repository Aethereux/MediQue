/* MediQue.ph — My appointments (upcoming / past tabs). */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ApiError, cancelBooking, getMyBookings } from '../api';
import { AppointmentCard, Btn, EmptyState, Modal } from '../components';
import { I } from '../icons';
import { useApp } from '../store';
import type { BookingsMine, MineBooking } from '../types';

export default function Appointments() {
  const { showToast } = useApp();
  const navigate = useNavigate();
  const [tab, setTab] = useState<'upcoming' | 'past'>('upcoming');
  const [data, setData] = useState<BookingsMine | null>(null);
  const [cancelTarget, setCancelTarget] = useState<MineBooking | null>(null);

  const load = () => {
    getMyBookings().then(setData).catch(() => { /* handled globally on 401 */ });
  };
  useEffect(load, []);

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

  const list = data ? data[tab] : [];

  return (
    <div className="screen-body fade-in app-pad">
      <div className="container" style={{ maxWidth: 720, paddingTop: 28, paddingBottom: 60 }}>
        <h1 style={{ fontSize: 'clamp(24px, 3.4vw, 30px)', marginBottom: 20 }}>My appointments</h1>

        {data && (
          <>
            <div style={{ display: 'inline-flex', background: '#EEF3F3', borderRadius: 12, padding: 4, gap: 4, marginBottom: 22 }}>
              {([['upcoming', 'Upcoming'], ['past', 'Past']] as const).map(([id, label]) => (
                <button key={id} onClick={() => setTab(id)} style={{ padding: '9px 20px', borderRadius: 9, border: 'none', cursor: 'pointer', background: tab === id ? 'var(--c-surface)' : 'transparent', color: tab === id ? 'var(--c-primary-dark)' : 'var(--c-text-2)', fontWeight: 600, fontSize: 14.5, fontFamily: 'var(--font-body)', boxShadow: tab === id ? 'var(--sh-sm)' : 'none', transition: 'all .14s ease' }}>
                  {label} <span style={{ opacity: .7 }}>({data.counts[id]})</span>
                </button>
              ))}
            </div>

            {list.length ? (
              <div className="stack" style={{ gap: 16 }}>
                {list.map((a) => (
                  <AppointmentCard key={a.id} appt={a} past={tab === 'past'} onView={() => { /* details are on this page */ }} onCancel={() => setCancelTarget(a)} onRebook={() => navigate('/doctors/' + a.doctor_id)} />
                ))}
              </div>
            ) : (
              <EmptyState icon={tab === 'upcoming' ? I.calendarPlus({ size: 30 }) : I.list({ size: 30 })}
                title={tab === 'upcoming' ? 'No upcoming appointments' : 'No past appointments'}
                body={tab === 'upcoming' ? "No upcoming appointments — let's book one." : 'Your completed and cancelled visits will appear here.'}
                action={tab === 'upcoming' ? <Btn variant="primary" icon={I.search({ size: 18 })} onClick={() => navigate('/doctors')}>Find a doctor</Btn> : null} />
            )}
          </>
        )}
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
