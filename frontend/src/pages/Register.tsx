/* MediQue.ph — Register page. */

import { useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { ApiError, apiRegister } from '../api';
import { Banner, Btn, Field, Input, PasswordInput } from '../components';
import { I } from '../icons';
import { useApp } from '../store';
import { AuthShell } from './Login';

interface FormState {
  name: string;
  email: string;
  mobile: string;
  pw: string;
  pw2: string;
}

interface FieldErrs {
  name?: string;
  email?: string;
  mobile?: string;
  pw?: string;
  pw2?: string;
}

export default function Register() {
  const navigate = useNavigate();
  const { loginSuccess } = useApp();
  const [f, setF] = useState<FormState>({ name: '', email: '', mobile: '', pw: '', pw2: '' });
  const [err, setErr] = useState<FieldErrs>({});
  const [serverErr, setServerErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const set = (k: keyof FormState) => (e: ChangeEvent<HTMLInputElement>) => setF((s) => ({ ...s, [k]: e.target.value }));

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const er: FieldErrs = {};
    if (!f.name.trim()) er.name = 'Please enter your full name.';
    if (!f.email.trim()) er.email = 'Please enter your email.';
    else if (!/^\S+@\S+\.\S+$/.test(f.email)) er.email = 'Enter a valid email address.';
    if (!f.mobile.trim()) er.mobile = 'Please enter your mobile number.';
    if (!f.pw) er.pw = 'Choose a password.';
    else if (f.pw.length < 6) er.pw = 'Use at least 6 characters.';
    if (f.pw2 !== f.pw) er.pw2 = 'Passwords do not match.';
    setErr(er);
    if (Object.keys(er).length) return;
    setServerErr(null);
    setLoading(true);
    apiRegister({ full_name: f.name, email: f.email, mobile: f.mobile, password: f.pw })
      .then(async (res) => {
        await loginSuccess(res.user, res.access_token);
        navigate('/dashboard');
      })
      .catch((error: unknown) => {
        setServerErr(error instanceof ApiError ? error.detail : 'Something went wrong. Please try again.');
        setLoading(false);
      });
  };

  return (
    <AuthShell title="Create your account" sub="Book MakatiMed consultations and see how full each day is."
      footer={<>Already have an account? <span className="link" onClick={() => navigate('/login')}>Log in</span></>}>
      {serverErr && <Banner kind="error" style={{ marginBottom: 18 }}>{serverErr}</Banner>}
      <form onSubmit={submit} className="stack" style={{ gap: 15 }}>
        <Field label="Full name" error={err.name}><Input icon={I.user({ size: 18 })} placeholder="Juan dela Cruz" value={f.name} error={err.name} onChange={set('name')} /></Field>
        <Field label="Email" error={err.email}><Input icon={I.mail({ size: 18 })} type="email" placeholder="you@email.com" value={f.email} error={err.email} onChange={set('email')} /></Field>
        <Field label="Mobile number" error={err.mobile}><Input icon={I.phone({ size: 18 })} placeholder="0917-xxx-xxxx" value={f.mobile} error={err.mobile} onChange={set('mobile')} /></Field>
        <div className="form-2col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <Field label="Password" error={err.pw}><PasswordInput icon={I.lock({ size: 18 })} placeholder="••••••" value={f.pw} error={err.pw} onChange={set('pw')} /></Field>
          <Field label="Confirm password" error={err.pw2}><PasswordInput icon={I.lock({ size: 18 })} placeholder="••••••" value={f.pw2} error={err.pw2} onChange={set('pw2')} /></Field>
        </div>
        <Btn variant="primary" block size="lg" type="submit" disabled={loading} icon={loading ? I.refresh({ size: 18, className: 'spin' }) : null}>{loading ? 'Creating account…' : 'Create account'}</Btn>
      </form>
    </AuthShell>
  );
}
