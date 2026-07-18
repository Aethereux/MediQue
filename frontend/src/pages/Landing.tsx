/* MediQue.ph — Landing page (public). */

import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSpecialties } from '../api';
import { Btn, SpecialtyCard } from '../components';
import { I } from '../icons';
import type { Specialty } from '../types';

export function Stat({ n, l }: { n: ReactNode; l: ReactNode }) {
  return <div><div style={{ fontFamily: 'var(--font-head)', fontWeight: 600, fontSize: 22, color: 'var(--c-text)', lineHeight: 1 }}>{n}</div><div className="muted" style={{ fontSize: 12.5, marginTop: 4 }}>{l}</div></div>;
}

export function SectionHead({ overline, title, sub, align = 'center' }: {
  overline?: ReactNode;
  title: ReactNode;
  sub?: ReactNode;
  align?: 'center' | 'left';
}) {
  return (
    <div style={{ textAlign: align, maxWidth: align === 'center' ? 600 : 'none', margin: align === 'center' ? '0 auto' : 0 }}>
      {overline && <div className="overline" style={{ marginBottom: 10 }}>{overline}</div>}
      <h2 style={{ fontSize: 'clamp(24px, 3.4vw, 34px)' }}>{title}</h2>
      {sub && <p className="muted" style={{ fontSize: 16, marginTop: 12 }}>{sub}</p>}
    </div>
  );
}

export default function Landing() {
  const navigate = useNavigate();
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  useEffect(() => {
    let alive = true;
    getSpecialties().then((s) => { if (alive) setSpecialties(s); }).catch(() => { /* grid stays empty */ });
    return () => { alive = false; };
  }, []);

  const steps = [
    { icon: I.search, title: 'Search by specialty', body: 'Find MakatiMed doctors by specialty or name — no phone calls, no logbooks.' },
    { icon: I.users, title: 'Pick a slot & see how busy the day is', body: 'Choose a time and see how many of that day’s slots are already booked.' },
    { icon: I.checkCircle, title: 'Get your confirmation', body: 'Get your slot, your place for the day, and your reference — before you leave home.' },
  ];
  const feats = [
    { icon: I.zap, title: 'Up-to-date availability', body: 'See which MakatiMed doctors have clinic days open and how full each day is.' },
    { icon: I.users, title: 'See the day’s booking count', body: 'Know how many slots are booked and how many remain — the MediQue signature.' },
    { icon: I.video, title: 'Onsite or telemedicine', body: 'Visit in person or consult from home. Your choice, every booking.' },
    { icon: I.clock, title: 'No more dawn line-ups', body: 'Reserve your slot in advance and arrive right on time.' },
  ];

  return (
    <div className="screen-body fade-in">
      {/* HERO */}
      <section style={{ background: 'linear-gradient(180deg, var(--c-primary-tint) 0%, var(--c-bg) 100%)', borderBottom: '1px solid var(--c-border)' }}>
        <div className="container hero-grid" style={{ display: 'grid', gridTemplateColumns: '1fr', padding: '72px 28px 80px' }}>
          <div className="stack" style={{ gap: 24, alignItems: 'center', textAlign: 'center', maxWidth: 760, margin: '0 auto' }}>
            <h1 style={{ fontSize: 'clamp(34px, 5vw, 56px)', lineHeight: 1.05 }}>Book your MakatiMed doctor.<br /><span style={{ color: 'var(--c-primary)' }}>Skip the wait.</span></h1>
            <p style={{ fontSize: 'clamp(16px, 2vw, 19px)', color: 'var(--c-text-2)', maxWidth: 560 }}>Find available doctors by specialty, see how full each day is, and reserve your slot — onsite or by telemedicine.</p>
            <div className="row hero-cta" style={{ gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
              <Btn variant="primary" size="lg" icon={I.search({ size: 19 })} onClick={() => navigate('/doctors')}>Find a doctor</Btn>
              <Btn variant="secondary" size="lg" onClick={() => navigate('/register')}>Create an account</Btn>
            </div>
            <div className="row" style={{ gap: 22, flexWrap: 'wrap', paddingTop: 6, justifyContent: 'center' }}>
              <Stat n="40+" l="MakatiMed doctors" />
              <span style={{ width: 1, height: 30, background: 'var(--c-border)' }} />
              <Stat n="10" l="Specialties" />
              <span style={{ width: 1, height: 30, background: 'var(--c-border)' }} />
              <Stat n="Onsite + Tele" l="In-person or online" />
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="container" style={{ padding: '64px 28px' }}>
        <SectionHead overline="How it works" title="Three steps, no dawn line-up" />
        <div className="steps-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 22, marginTop: 36 }}>
          {steps.map((s, i) => (
            <div key={i} className="card card-pad rise-in" style={{ animationDelay: i * 80 + 'ms', display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="row" style={{ justifyContent: 'space-between' }}>
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 48, height: 48, borderRadius: 14, background: 'var(--c-primary-tint)', color: 'var(--c-primary)' }}>{s.icon({ size: 24 })}</span>
                <span style={{ fontFamily: 'var(--font-head)', fontWeight: 600, fontSize: 32, color: 'var(--c-border)' }}>{i + 1}</span>
              </div>
              <h4 style={{ fontSize: 17.5 }}>{s.title}</h4>
              <p className="muted" style={{ fontSize: 14.5 }}>{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* WHY MEDIQUE */}
      <section style={{ background: '#fff', borderTop: '1px solid var(--c-border)', borderBottom: '1px solid var(--c-border)' }}>
        <div className="container" style={{ padding: '64px 28px' }}>
          <SectionHead overline="Why MediQue" title="The day’s load, made visible" sub="Other portals just book appointments. MediQue shows you how full each day is before you leave home." />
          <div className="feats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20, marginTop: 36 }}>
            {feats.map((f, i) => (
              <div key={i} className="stack" style={{ gap: 12 }}>
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 46, height: 46, borderRadius: 13, background: i === 1 ? 'var(--c-accent-soft)' : 'var(--c-primary-tint)', color: i === 1 ? 'var(--c-accent)' : 'var(--c-primary)' }}>{f.icon({ size: 23 })}</span>
                <h4 style={{ fontSize: 16 }}>{f.title}</h4>
                <p className="muted" style={{ fontSize: 13.5 }}>{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SPECIALTIES */}
      <section className="container" style={{ padding: '64px 28px' }}>
        <div className="row" style={{ justifyContent: 'space-between', alignItems: 'flex-end', gap: 16, flexWrap: 'wrap' }}>
          <SectionHead overline="Browse" title="Care for every need" align="left" />
          <Btn variant="text" trail={I.arrowRight({ size: 16 })} onClick={() => navigate('/doctors')}>See all doctors</Btn>
        </div>
        <div className="spec-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 14, marginTop: 28 }}>
          {specialties.map((s) => <SpecialtyCard key={s.id} spec={s} compact onClick={() => navigate('/doctors?specialty=' + s.id)} />)}
        </div>
      </section>

      {/* CTA band */}
      <section style={{ background: 'var(--c-primary)', color: '#fff' }}>
        <div className="container cta-band" style={{ padding: '48px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24, flexWrap: 'wrap' }}>
          <div>
            <h2 style={{ color: '#fff', fontSize: 'clamp(22px, 3vw, 30px)' }}>Ready to skip the wait?</h2>
            <p style={{ color: 'rgba(255,255,255,.82)', fontSize: 16, marginTop: 6 }}>Create your free account and book your first consultation in minutes.</p>
          </div>
          <div className="row" style={{ gap: 12, flexWrap: 'wrap' }}>
            <button className="btn btn-lg" style={{ background: '#fff', color: 'var(--c-primary-dark)' }} onClick={() => navigate('/register')}>Create an account</button>
            <button className="btn btn-lg" style={{ background: 'rgba(255,255,255,.14)', color: '#fff', border: '1px solid rgba(255,255,255,.4)' }} onClick={() => navigate('/doctors')}>Find a doctor</button>
          </div>
        </div>
      </section>
    </div>
  );
}
