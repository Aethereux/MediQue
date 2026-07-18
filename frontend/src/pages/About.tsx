/* MediQue.ph — About page (static). */

import { useNavigate } from 'react-router-dom';
import { I } from '../icons';
import { SectionHead } from './Landing';

export default function About() {
  const navigate = useNavigate();
  const problems = [
    { icon: I.clock, t: 'Dawn line-ups', b: 'Patients arrive before sunrise just to be handwritten into a paper logbook at the clinic.' },
    { icon: I.list, t: 'Uncertain queues', b: 'Lost slips and unclear order mean people wait hours, unsure when they’ll be seen.' },
    { icon: I.phone, t: 'Phone-only booking', b: 'Busy lines and no confirmation leave patients guessing whether they have a slot.' },
  ];
  const values = [
    { icon: I.users, t: 'Access for everyone', b: 'A booking experience that works on any phone, for any MakatiMed patient — no app download needed.' },
    { icon: I.zap, t: 'Clear, upfront capacity', b: 'How full a day is is never hidden — you see the booked count and slots left before you travel.' },
    { icon: I.shield, t: 'Privacy first', b: 'Personal and health information is kept private, secure, and never sold.' },
  ];
  return (
    <div className="screen-body fade-in">
      <section style={{ background: 'linear-gradient(180deg, var(--c-primary-tint), var(--c-bg))', borderBottom: '1px solid var(--c-border)' }}>
        <div className="container center" style={{ padding: '64px 28px', maxWidth: 760 }}>
          <div className="overline" style={{ marginBottom: 12 }}>About Makati Medical Center</div>
          <h1 style={{ fontSize: 'clamp(30px, 4.5vw, 46px)', lineHeight: 1.08 }}>Better access to MakatiMed care, one booking at a time.</h1>
          <p className="muted" style={{ fontSize: 18, marginTop: 18, maxWidth: 620, marginLeft: 'auto', marginRight: 'auto' }}>MakatiMed built MediQue.ph to cut wait times at its busy outpatient and specialty clinics — replacing manual logbooks and dawn line-ups by letting patients book ahead and see how full each day is.</p>
        </div>
      </section>

      <section className="container" style={{ padding: '60px 28px' }}>
        <SectionHead overline="The problem" title="Booking a consultation shouldn’t mean losing a morning" />
        <div className="about-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, marginTop: 36 }}>
          {problems.map((p, i) => (
            <div key={i} className="card card-pad stack" style={{ gap: 12 }}>
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 46, height: 46, borderRadius: 13, background: 'var(--c-warning-soft)', color: 'var(--c-warning)' }}>{p.icon({ size: 23 })}</span>
              <h4 style={{ fontSize: 17 }}>{p.t}</h4>
              <p className="muted" style={{ fontSize: 14.5 }}>{p.b}</p>
            </div>
          ))}
        </div>
      </section>

      <section style={{ background: '#fff', borderTop: '1px solid var(--c-border)', borderBottom: '1px solid var(--c-border)' }}>
        <div className="container" style={{ padding: '60px 28px', maxWidth: 860 }}>
          <div>
            <div className="overline" style={{ marginBottom: 10 }}>How MediQue solves it</div>
            <h2 style={{ fontSize: 'clamp(24px, 3.2vw, 32px)' }}>Make the day’s load visible. Make the booking effortless.</h2>
            <div className="stack" style={{ gap: 18, marginTop: 24 }}>
              {[
                ['See up-to-date availability', 'Browse MakatiMed doctors by specialty and see which clinic days are open — before you travel.'],
                ['Know how full a day is', 'Every date shows the booked count, slots left, and your slot’s position for the day.'],
                ['Book onsite or telemedicine', 'Reserve a physical slot or consult from home, with instant confirmation.'],
              ].map(([t, b], i) => (
                <div key={i} className="row" style={{ gap: 14, alignItems: 'flex-start' }}>
                  <span style={{ flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', width: 30, height: 30, borderRadius: '50%', background: 'var(--c-success-soft)', color: 'var(--c-success)' }}>{I.check({ size: 17 })}</span>
                  <div><div style={{ fontWeight: 600, fontSize: 16, fontFamily: 'var(--font-head)' }}>{t}</div><p className="muted" style={{ fontSize: 14.5, marginTop: 3 }}>{b}</p></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="container" style={{ padding: '60px 28px' }}>
        <SectionHead overline="What we value" title="Warm, human, and always transparent" />
        <div className="about-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, marginTop: 36 }}>
          {values.map((v, i) => (
            <div key={i} className="stack" style={{ gap: 12 }}>
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 46, height: 46, borderRadius: 13, background: 'var(--c-primary-tint)', color: 'var(--c-primary)' }}>{v.icon({ size: 23 })}</span>
              <h4 style={{ fontSize: 16.5 }}>{v.t}</h4>
              <p className="muted" style={{ fontSize: 14.5 }}>{v.b}</p>
            </div>
          ))}
        </div>
      </section>

      <section style={{ background: 'var(--c-primary)', color: '#fff' }}>
        <div className="container center" style={{ padding: '52px 28px' }}>
          <h2 style={{ color: '#fff', fontSize: 'clamp(24px, 3.4vw, 32px)' }}>Accessing healthcare with a click.</h2>
          <p style={{ color: 'rgba(255,255,255,.85)', fontSize: 16, margin: '12px auto 24px', maxWidth: 480 }}>Join the patients skipping the dawn line-up.</p>
          <button className="btn btn-lg" style={{ background: '#fff', color: 'var(--c-primary-dark)' }} onClick={() => navigate('/register')}>Create an account</button>
        </div>
      </section>
    </div>
  );
}
