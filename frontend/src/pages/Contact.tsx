/* MediQue.ph — Contact page (form posts to /api/contact). */

import { useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { ApiError, sendContact } from '../api';
import { Banner, Btn, cx, Field, Input } from '../components';
import { I } from '../icons';

interface FormState {
  name: string;
  email: string;
  message: string;
}

interface FieldErrs {
  name?: string;
  email?: string;
  message?: string;
}

export default function Contact() {
  const [f, setF] = useState<FormState>({ name: '', email: '', message: '' });
  const [sent, setSent] = useState(false);
  const [sentMsg, setSentMsg] = useState('');
  const [err, setErr] = useState<FieldErrs>({});
  const [serverErr, setServerErr] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const set = (k: keyof FormState) => (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF((s) => ({ ...s, [k]: e.target.value }));

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const er: FieldErrs = {};
    if (!f.name.trim()) er.name = 'Please enter your name.';
    if (!/^\S+@\S+\.\S+$/.test(f.email)) er.email = 'Enter a valid email address.';
    if (!f.message.trim()) er.message = 'Please enter a message.';
    setErr(er);
    if (Object.keys(er).length) return;
    setServerErr(null);
    setSending(true);
    sendContact({ name: f.name, email: f.email, message: f.message })
      .then((res) => {
        setSentMsg(res.message);
        setSent(true);
      })
      .catch((error: unknown) => {
        setServerErr(error instanceof ApiError ? error.detail : 'Something went wrong. Please try again.');
      })
      .finally(() => setSending(false));
  };

  const info = [
    { icon: I.mapPin, t: 'Visit us', b: 'Makati Medical Center\n2 Amorsolo Street, Legazpi Village\nMakati City, Metro Manila' },
    { icon: I.phone, t: 'Call us', b: '(02) 8888-8999\nMon–Sun, 24/7 hotline' },
    { icon: I.mail, t: 'Email us', b: 'hello@medique.ph\nsupport@medique.ph' },
  ];
  return (
    <div className="screen-body fade-in">
      <section style={{ background: 'linear-gradient(180deg, var(--c-primary-tint), var(--c-bg))', borderBottom: '1px solid var(--c-border)' }}>
        <div className="container center" style={{ padding: '56px 28px', maxWidth: 640 }}>
          <div className="overline" style={{ marginBottom: 12 }}>Contact</div>
          <h1 style={{ fontSize: 'clamp(28px, 4vw, 42px)' }}>We’re here to help</h1>
          <p className="muted" style={{ fontSize: 17, marginTop: 14 }}>Questions about booking, availability, or telemedicine at Makati Medical Center? Reach out — real, reliable contact details, every time.</p>
        </div>
      </section>

      <section className="container contact-grid" style={{ padding: '56px 28px', display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: 36, alignItems: 'start' }}>
        <div className="stack" style={{ gap: 16 }}>
          {info.map((c, i) => (
            <div key={i} className="card card-pad row" style={{ gap: 16, alignItems: 'flex-start' }}>
              <span style={{ flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', width: 46, height: 46, borderRadius: 13, background: 'var(--c-primary-tint)', color: 'var(--c-primary)' }}>{c.icon({ size: 22 })}</span>
              <div><div style={{ fontWeight: 600, fontSize: 16, fontFamily: 'var(--font-head)', marginBottom: 4 }}>{c.t}</div><p className="muted" style={{ fontSize: 14, whiteSpace: 'pre-line' }}>{c.b}</p></div>
            </div>
          ))}
          <div className="card" style={{ overflow: 'hidden', height: 180, position: 'relative', background: 'repeating-linear-gradient(45deg, #EAF1F1, #EAF1F1 14px, #E2EBEB 14px, #E2EBEB 28px)' }}>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 8, color: 'var(--c-primary-dark)' }}>
              {I.mapPin({ size: 30 })}<span style={{ fontWeight: 600, fontSize: 14 }}>Map placeholder</span>
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: 'clamp(22px, 3vw, 32px)' }}>
          {sent ? (
            <div className="stack center" style={{ gap: 14, padding: '24px 0' }}>
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 64, height: 64, borderRadius: '50%', background: 'var(--c-success-soft)', color: 'var(--c-success)', animation: 'pop .4s ease' }}>{I.checkCircle({ size: 34 })}</span>
              <h3 style={{ fontSize: 21 }}>Message sent!</h3>
              <p className="muted" style={{ fontSize: 15, maxWidth: 320 }}>{sentMsg}</p>
              <Btn variant="secondary" onClick={() => { setSent(false); setSentMsg(''); setF({ name: '', email: '', message: '' }); }}>Send another message</Btn>
            </div>
          ) : (
            <form onSubmit={submit} className="stack" style={{ gap: 16 }}>
              <h3 style={{ fontSize: 20 }}>Send us a message</h3>
              {serverErr && <Banner kind="error">{serverErr}</Banner>}
              <Field label="Name" error={err.name}><Input placeholder="Your name" value={f.name} error={err.name} onChange={set('name')} /></Field>
              <Field label="Email" error={err.email}><Input type="email" placeholder="you@email.com" value={f.email} error={err.email} onChange={set('email')} /></Field>
              <Field label="Message" error={err.message}>
                <textarea className={cx('input', err.message && 'err')} rows={5} placeholder="How can we help?" value={f.message} onChange={set('message')} style={{ resize: 'vertical', minHeight: 120, fontFamily: 'var(--font-body)' }} />
              </Field>
              <Btn variant="primary" size="lg" type="submit" disabled={sending} icon={I.send({ size: 18 })}>Send message</Btn>
            </form>
          )}
        </div>
      </section>
    </div>
  );
}
