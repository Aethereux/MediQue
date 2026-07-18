/* MediQue.ph — booking review & confirm (spec §3 p9, MP-05). */

import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { ApiError, createBooking } from '../api';
import { Banner, Btn } from '../components';
import { I } from '../icons';
import { useApp } from '../store';

export default function BookingReview() {
  const { user, draft, setDraft, setLastBooked } = useApp();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!draft) return <Navigate to="/doctors" replace />;
  const d = draft.doctor;

  const confirm = () => {
    setLoading(true);
    setError(null);
    createBooking({ doctor_id: d.id, date: draft.dateIso, slot_index: draft.slotIndex, mode: draft.mode })
      .then((resp) => {
        setLastBooked(resp);
        setDraft(null);
        navigate('/book/confirmed');
      })
      .catch((err: unknown) => {
        setLoading(false);
        setError(err instanceof ApiError ? err.detail : 'Something went wrong. Please try again.');
      });
  };

  const rows: [string, string][] = [
    ['Doctor', d.name], ['Specialty', d.specialty],
    ['Date', `${draft.weekday}, ${draft.monthFull} ${draft.day}, ${draft.year}`],
    ['Time', draft.slotTime],
    ['Mode', draft.mode === 'tele' ? 'Telemedicine' : 'Onsite'],
    ...(draft.mode === 'tele' ? [] : [['Room', `Room ${d.room} · ${d.floor}`] as [string, string]]),
    ['Patient', user?.full_name ?? ''],
  ];
  return (
    <div className="screen-body fade-in app-pad">
      <div className="container" style={{ maxWidth: 560, paddingTop: 22, paddingBottom: 120 }}>
        <button className="btn btn-ghost btn-sm" style={{ marginBottom: 14, paddingLeft: 6 }} onClick={() => navigate('/doctors/' + d.id)}>{I.arrowLeft({ size: 17 })} Back</button>
        <div className="stack center" style={{ gap: 6, marginBottom: 22 }}>
          <div className="overline">Step 2 of 2</div>
          <h1 style={{ fontSize: 27 }}>Review &amp; confirm</h1>
          <p className="muted" style={{ fontSize: 15 }}>One last look before we secure your slot.</p>
        </div>

        <div className="card card-pad stack" style={{ gap: 0, marginBottom: 18 }}>
          {rows.map(([k, v], i) => (
            <div key={k} className="row" style={{ justifyContent: 'space-between', gap: 16, padding: '13px 0', borderBottom: i < rows.length - 1 ? '1px solid var(--c-border)' : 'none' }}>
              <span className="muted" style={{ fontSize: 14 }}>{k}</span>
              <span style={{ fontWeight: 600, fontSize: 14.5, textAlign: 'right' }}>{v}</span>
            </div>
          ))}
        </div>

        <div className="card" style={{ padding: 20, marginBottom: 18, background: 'linear-gradient(135deg, var(--c-primary-tint), #fff 80%)', border: '1px solid #CBE6E6' }}>
          <div className="row" style={{ gap: 16, justifyContent: 'space-between', flexWrap: 'wrap' }}>
            <div className="row" style={{ gap: 14 }}>
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 52, height: 52, borderRadius: 14, background: 'var(--c-accent-soft)', color: 'var(--c-accent)', flexShrink: 0 }}>{I.calendarCheck({ size: 26 })}</span>
              <div>
                <div style={{ fontFamily: 'var(--font-head)', fontWeight: 600, fontSize: 20 }}>Your slot is {draft.slotTime}</div>
                <div className="muted" style={{ fontSize: 14 }}>Appointment #{draft.position} of the day. Please arrive 15 minutes early.</div>
              </div>
            </div>
          </div>
        </div>

        <Banner kind="warning" style={{ marginBottom: 22 }}>Slot positions and arrival times are estimates and may change due to emergencies, delays, or cancellations. You'll be notified of any updates.</Banner>

        {error && <Banner kind="error" style={{ marginBottom: 22 }}>{error}</Banner>}

        <div className="review-actions row" style={{ gap: 12 }}>
          <Btn variant="secondary" size="lg" onClick={() => navigate('/doctors/' + d.id)}>Back</Btn>
          <Btn variant="primary" size="lg" block disabled={loading} icon={loading ? I.refresh({ size: 18, className: 'spin' }) : I.checkCircle({ size: 19 })} onClick={confirm}>{loading ? 'Securing your slot…' : 'Confirm booking'}</Btn>
        </div>
      </div>
    </div>
  );
}
