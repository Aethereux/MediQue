/* MediQue.ph — My account (profile details, editable). */

import { useState } from 'react';
import type { ChangeEvent } from 'react';
import { ApiError, requestPasswordReset, updateAccount } from '../api';
import { Avatar, Banner, Btn, Field, Input, Select } from '../components';
import { I } from '../icons';
import { useApp } from '../store';
import type { Me } from '../types';

interface FormState {
  name: string;
  email: string;
  mobile: string;
  birthday: string;
  sex: string;
  address: string;
}

function AccountForm({ user }: { user: Me }) {
  const { refreshMe, showToast } = useApp();
  const init: FormState = {
    name: user.full_name,
    email: user.email,
    mobile: user.mobile ?? '',
    birthday: user.birthday ?? '',
    sex: user.sex ?? '',
    address: user.address ?? '',
  };
  const [f, setF] = useState(init);
  const [saved, setSaved] = useState(init);
  const [age, setAge] = useState(user.age);
  const set = (k: keyof FormState) => (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setF((s) => ({ ...s, [k]: e.target.value }));
  const dirty = (Object.keys(f) as (keyof FormState)[]).some((k) => f[k] !== saved[k]);

  const onSave = async () => {
    const p: Parameters<typeof updateAccount>[0] = {};
    if (f.name !== saved.name) p.full_name = f.name;
    if (f.email !== saved.email) p.email = f.email;
    if (f.mobile !== saved.mobile) p.mobile = f.mobile;
    if (f.birthday !== saved.birthday) p.birthday = f.birthday;
    if (f.sex !== saved.sex) p.sex = f.sex;
    if (f.address !== saved.address) p.address = f.address;
    try {
      const res = await updateAccount(p);
      setAge(res.age);
      setSaved(f);
      await refreshMe();
      showToast(res.message);
    } catch (e) {
      showToast(e instanceof ApiError ? e.detail : 'Something went wrong. Please try again.');
    }
  };

  const onPassword = async () => {
    try {
      const res = await requestPasswordReset();
      showToast(res.message);
    } catch (e) {
      showToast(e instanceof ApiError ? e.detail : 'Something went wrong. Please try again.');
    }
  };

  return (
    <div className="screen-body fade-in app-pad">
      <div className="container" style={{ maxWidth: 720, paddingTop: 28, paddingBottom: 60 }}>
        <h1 style={{ fontSize: 'clamp(24px, 3.4vw, 30px)', marginBottom: 20 }}>My account</h1>

        <div className="card card-pad row" style={{ gap: 16, marginBottom: 18 }}>
          <Avatar name={user.full_name} initials={user.initials} size={66} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 600, fontSize: 19, fontFamily: 'var(--font-head)' }}>{user.full_name}</div>
            <div className="muted" style={{ fontSize: 14 }}>{user.email}</div>
          </div>
          <span className="status-pill status-confirmed" style={{ flexShrink: 0 }}>Verified patient</span>
        </div>

        <div className="card card-pad">
          <h3 style={{ fontSize: 17, marginBottom: 18 }}>Personal information</h3>
          <div className="account-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={{ gridColumn: '1 / -1' }}><Field label="Full name"><Input icon={I.user({ size: 18 })} value={f.name} onChange={set('name')} /></Field></div>
            <Field label="Birthday"><Input icon={I.calendar({ size: 18 })} type="date" value={f.birthday} onChange={set('birthday')} /></Field>
            <Field label="Sex"><Select value={f.sex} onChange={set('sex')}><option>Female</option><option>Male</option></Select></Field>
            <Field label="Age" hint="Calculated from birthday"><Input value={(age ?? '—') + ' years old'} disabled style={{ background: '#F7F9FA', color: 'var(--c-text-2)' }} /></Field>
            <Field label="Mobile number"><Input icon={I.phone({ size: 18 })} value={f.mobile} onChange={set('mobile')} /></Field>
            <div style={{ gridColumn: '1 / -1' }}><Field label="Address"><Input icon={I.mapPin({ size: 18 })} value={f.address} onChange={set('address')} /></Field></div>
            <div style={{ gridColumn: '1 / -1' }}><Field label="Email"><Input icon={I.mail({ size: 18 })} type="email" value={f.email} onChange={set('email')} /></Field></div>
          </div>
          <div className="divider" style={{ margin: '20px 0' }} />
          <div className="row" style={{ justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <Btn variant="secondary" size="sm" icon={I.lock({ size: 16 })} onClick={onPassword}>Change password</Btn>
            <Btn variant="primary" disabled={!dirty} icon={I.check({ size: 18 })} onClick={onSave}>Save changes</Btn>
          </div>
        </div>

        <Banner kind="info" icon={I.shield({ size: 19 })} style={{ marginTop: 18 }}>Your personal and health information is kept private and secure, and is never shared without your consent.</Banner>
      </div>
    </div>
  );
}

export default function Account() {
  const { user } = useApp();
  if (!user) return null; // RequireAuth guards this route
  return <AccountForm user={user} key={user.id} />;
}
