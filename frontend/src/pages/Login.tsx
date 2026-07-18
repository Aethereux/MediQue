/* MediQue.ph — Login page + AuthShell (shared with Register). */

import { useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ApiError, apiLogin } from '../api';
import { Banner, Btn, Field, Input, PasswordInput } from '../components';
import { I } from '../icons';
import { useApp } from '../store';

export function AuthShell({ title, sub, children, footer }: {
  title: ReactNode;
  sub: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="screen-body fade-in" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '52px 20px 80px', minHeight: 'calc(100vh - var(--nav-h))' }}>
      <div style={{ width: '100%', maxWidth: 440 }}>
        <div className="card" style={{ padding: 'clamp(24px, 4vw, 38px)', boxShadow: 'var(--sh-md)' }}>
          <div className="stack center" style={{ gap: 8, marginBottom: 26 }}>
            <h1 style={{ fontSize: 26 }}>{title}</h1>
            <p className="muted" style={{ fontSize: 15 }}>{sub}</p>
          </div>
          {children}
        </div>
        {footer && <div className="center" style={{ marginTop: 20, fontSize: 14.5, color: 'var(--c-text-2)' }}>{footer}</div>}
      </div>
    </div>
  );
}

interface LoginNavState {
  next?: string;
  intent?: boolean;
}

interface FieldErrs {
  email?: string;
  pw?: string;
}

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { loginSuccess } = useApp();
  const navState = (location.state ?? null) as LoginNavState | null;
  const intent = navState?.intent;

  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [remember, setRemember] = useState(true);
  const [err, setErr] = useState<FieldErrs>({});
  const [serverErr, setServerErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const er: FieldErrs = {};
    if (!email.trim()) er.email = 'Please enter your email.';
    else if (!/^\S+@\S+\.\S+$/.test(email)) er.email = 'Enter a valid email address.';
    if (!pw) er.pw = 'Please enter your password.';
    setErr(er);
    if (Object.keys(er).length) return;
    setServerErr(null);
    setLoading(true);
    apiLogin({ email, password: pw })
      .then(async (res) => {
        await loginSuccess(res.user, res.access_token);
        navigate(navState?.next ?? (res.user.role === 'admin' ? '/admin' : '/dashboard'), { replace: true });
      })
      .catch((error: unknown) => {
        setServerErr(error instanceof ApiError ? error.detail : 'Something went wrong. Please try again.');
        setLoading(false);
      });
  };

  return (
    <AuthShell title="Welcome back" sub="Log in to book and manage your appointments."
      footer={<>New here? <span className="link" onClick={() => navigate('/register')}>Create an account</span></>}>
      {intent && <Banner kind="info" style={{ marginBottom: 18 }}>Log in to continue booking your appointment.</Banner>}
      {serverErr && <Banner kind="error" style={{ marginBottom: 18 }}>{serverErr}</Banner>}

      <form onSubmit={submit} className="stack" style={{ gap: 16 }}>
        <Field label="Email" error={err.email}>
          <Input icon={I.mail({ size: 18 })} type="email" placeholder="you@email.com" value={email} error={err.email} onChange={(e) => setEmail(e.target.value)} />
        </Field>
        <Field label="Password" error={err.pw}>
          <PasswordInput icon={I.lock({ size: 18 })} placeholder="Your password" value={pw} error={err.pw} onChange={(e) => setPw(e.target.value)} />
        </Field>
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <label className="row" style={{ gap: 8, fontSize: 13.5, cursor: 'pointer', color: 'var(--c-text-2)' }}>
            <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} style={{ width: 17, height: 17, accentColor: 'var(--c-primary)' }} />Remember me
          </label>
          <span className="link" style={{ fontSize: 13.5, whiteSpace: 'nowrap' }} onClick={(e) => e.preventDefault()}>Forgot password?</span>
        </div>
        <Btn variant="primary" block size="lg" type="submit" disabled={loading} icon={loading ? I.refresh({ size: 18, className: 'spin' }) : null}>{loading ? 'Logging in…' : 'Log in'}</Btn>
      </form>
    </AuthShell>
  );
}
