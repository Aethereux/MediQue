/* MediQue.ph — admin Doctors management (/admin/doctors). MP-12 + MP-15 endpoints. */

import { useEffect, useRef, useState } from 'react';
import {
  adminActivateDoctor, adminCreateDoctor, adminCreateSpecialty, adminDeactivateDoctor,
  adminDeleteDoctor, adminListDoctors, adminUpdateDoctor, ApiError, getSpecialties,
} from '../../api';
import type { AdminDoctorPayload } from '../../api';
import { useApp } from '../../store';
import type { AdminDoctor, Mode, Specialty } from '../../types';
import { docInitials, fmtTime } from './AdminLayout';

const W = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MODES: Mode[] = ['onsite', 'tele'];
const START_OPTS = [
  { min: 480, label: '8:00 AM' },
  { min: 540, label: '9:00 AM' },
  { min: 600, label: '10:00 AM' },
  { min: 780, label: '1:00 PM' },
  { min: 840, label: '2:00 PM' },
];

/* icons exactly as in the design file */
const icoOnsite = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="2" width="16" height="20" rx="2" /><path d="M9 22v-4h6v4M8 6h.01M16 6h.01M8 10h.01M16 10h.01" /></svg>
);
const icoTele = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="m16 10 4.6-2.3A1 1 0 0 1 22 8.6v6.8a1 1 0 0 1-1.4.9L16 14" /><rect x="2" y="6" width="14" height="12" rx="2" /></svg>
);
const icoEdit = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.1 2.1 0 0 1 3 3L12 15l-4 1 1-4Z" /></svg>
);
const icoPause = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><rect x="6" y="4" width="4" height="16" rx="1" /><rect x="14" y="4" width="4" height="16" rx="1" /></svg>
);
const icoPlay = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="m6 4 14 8-14 8Z" /></svg>
);

interface FormState {
  name: string;
  specialtyId: string;
  newSpec: string;
  roomFloor: string;
  days: string[];
  startMin: number;
  slots: string;
  modes: Mode[];
  bio: string;
}

const blankForm = (specId: string): FormState => ({
  name: '', specialtyId: specId, newSpec: '', roomFloor: '',
  days: ['Mon', 'Wed', 'Fri'], startMin: 540, slots: '12', modes: ['onsite'], bio: '',
});

export default function AdminDoctors() {
  const { showToast } = useApp();
  const [doctors, setDoctors] = useState<AdminDoctor[]>([]);
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [form, setForm] = useState<FormState>(() => blankForm(''));
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteArmed, setDeleteArmed] = useState(false);
  const toastRef = useRef(showToast);
  toastRef.current = showToast;

  useEffect(() => {
    let live = true;
    Promise.all([adminListDoctors(), getSpecialties()])
      .then(([docs, specs]) => {
        if (!live) return;
        setDoctors(docs);
        setSpecialties(specs);
        setForm((f) => (f.specialtyId ? f : { ...f, specialtyId: specs[0] ? specs[0].id : '' }));
      })
      .catch((e: unknown) => toastRef.current(e instanceof ApiError ? e.detail : 'Something went wrong. Please try again.'));
    return () => { live = false; };
  }, []);

  const fail = (e: unknown) => showToast(e instanceof ApiError ? e.detail : 'Something went wrong. Please try again.');

  const loadForm = (d: AdminDoctor | null) => {
    setEditingId(d ? d.id : null);
    setDeleteArmed(false);
    setForm(d
      ? {
          name: d.name, specialtyId: d.specialty_id, newSpec: '', roomFloor: d.room + ' · ' + d.floor,
          days: d.days, startMin: d.start_min, slots: String(d.slot_limit), modes: d.modes, bio: d.bio,
        }
      : blankForm(specialties[0] ? specialties[0].id : ''));
  };

  const save = async () => {
    let name = form.name.trim();
    if (!name) return showToast('Please enter the doctor’s name.');
    if (!/^Dr\./i.test(name)) name = 'Dr. ' + name;
    const isNew = form.specialtyId === '__new';
    const newName = form.newSpec.trim();
    if (isNew && !newName) return showToast('Please enter the new specialty name.');
    const rf = form.roomFloor.split('·');
    const room = (rf[0] || '').trim() || 'TBD';
    const floor = (rf[1] || '').trim() || 'TBD';
    if (!form.days.length) return showToast('Pick at least one clinic day.');
    if (!form.modes.length) return showToast('Pick at least one consultation mode.');
    const slots = parseInt(form.slots, 10);
    if (!(slots >= 1 && slots <= 48)) return showToast('Slot limit must be between 1 and 48.');
    try {
      let specId = form.specialtyId;
      if (isNew) {
        const existing = specialties.find((s) => s.name.toLowerCase() === newName.toLowerCase());
        specId = existing ? existing.id : (await adminCreateSpecialty({ name: newName })).id;
      }
      const payload: AdminDoctorPayload = {
        name, specialty_id: specId, room, floor, days: form.days,
        start_min: form.startMin, slot_limit: slots, modes: form.modes, bio: form.bio.trim(),
      };
      if (editingId) {
        await adminUpdateDoctor(editingId, payload);
        showToast(name + ' updated — changes are live.');
      } else {
        await adminCreateDoctor(payload);
        showToast(name + ' added — now visible in Find-a-Doctor.');
      }
      const [docs, specs] = await Promise.all([adminListDoctors(), getSpecialties()]);
      setDoctors(docs);
      setSpecialties(specs);
      setEditingId(null);
      setDeleteArmed(false);
      setForm(blankForm(specs[0] ? specs[0].id : ''));
    } catch (e) {
      fail(e);
    }
  };

  const toggleActive = async (d: AdminDoctor) => {
    try {
      const res = d.is_active ? await adminDeactivateDoctor(d.id) : await adminActivateDoctor(d.id);
      showToast(res.message);
      if (editingId === d.id && d.is_active) loadForm(null);
      setDoctors(await adminListDoctors());
    } catch (e) {
      fail(e);
    }
  };

  const del = async () => {
    if (!editingId) return;
    if (!deleteArmed) { setDeleteArmed(true); return; }
    try {
      const res = await adminDeleteDoctor(editingId);
      showToast(res.message);
      loadForm(null);
      setDoctors(await adminListDoctors());
    } catch (e) {
      setDeleteArmed(false);
      fail(e);
    }
  };

  const cancel = () => {
    const wasEditing = editingId != null;
    loadForm(null);
    showToast(wasEditing ? 'Editing cancelled.' : 'Form cleared.');
  };

  const toggleDay = (w: string) =>
    setForm((f) => ({ ...f, days: f.days.includes(w) ? f.days.filter((x) => x !== w) : W.filter((x) => f.days.includes(x) || x === w) }));
  const toggleMode = (m: Mode) =>
    setForm((f) => ({ ...f, modes: f.modes.includes(m) ? f.modes.filter((x) => x !== m) : MODES.filter((x) => f.modes.includes(x) || x === m) }));

  const editingDoc = editingId ? doctors.find((d) => d.id === editingId) : undefined;
  const specMissing = form.specialtyId && form.specialtyId !== '__new' && !specialties.some((s) => s.id === form.specialtyId);
  const startMissing = !START_OPTS.some((o) => o.min === form.startMin);

  return (
    <main className="wrap">
      <div className="pagehead" style={{ marginBottom: 22 }}>
        <div>
          <h1>Doctors</h1>
          <div className="sub">{doctors.length} doctors · {specialties.length} specialties · manage schedules, rooms, and slot limits</div>
        </div>
        <div className="search">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
          Search doctors…
        </div>
      </div>

      <div className="grid">
        <div id="list">
          {doctors.map((d) => {
            const editing = editingId === d.id;
            return (
              <div
                className="doc"
                key={d.id}
                style={{
                  ...(d.is_active ? {} : { opacity: 0.62 }),
                  ...(editing ? { borderColor: 'var(--c-primary)', boxShadow: '0 0 0 3px rgba(14,140,140,.12)' } : {}),
                }}
              >
                <div className="id">
                  <span className="avatar" style={{ width: 46, height: 46, background: d.color, fontSize: 16 }}>{docInitials(d.name)}</span>
                  <div>
                    <div className="nm">{d.name}</div>
                    <div className="sp">{d.specialty} · Rm {d.room} · {d.floor}</div>
                  </div>
                </div>
                <div className="mid">
                  <div className="days">
                    {W.map((w) => {
                      const on = d.days.includes(w);
                      return <span key={w} className={'dy' + (on ? ' on' : '')} style={on ? { background: d.color } : undefined}>{w[0]}</span>;
                    })}
                  </div>
                  <div className="hours">{fmtTime(d.start_min)}–{fmtTime(d.start_min + d.slot_limit * 15)} · {d.slot_limit} slots/day</div>
                </div>
                <div className="tags">
                  {d.modes.map((mo) => (
                    <span key={mo} className={'tag t-' + mo}>{mo === 'tele' ? icoTele : icoOnsite}{mo === 'tele' ? 'Telemedicine' : 'Onsite'}</span>
                  ))}
                </div>
                <span className={'pill ' + (d.is_active ? 'p-active' : 'p-off')}>{d.is_active ? 'Active' : 'On leave'}</span>
                <div className="acts">
                  <button className="iconbtn" title="Edit" onClick={() => loadForm(d)}>{icoEdit}</button>
                  <button className="iconbtn red" title={d.is_active ? 'Deactivate' : 'Reactivate'} onClick={() => { void toggleActive(d); }}>
                    {d.is_active ? icoPause : icoPlay}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <aside className="form">
          <h3 id="formTitle">{editingDoc ? 'Edit ' + editingDoc.name : 'Add a doctor'}</h3>
          <p className="fsub" id="formSub">
            {editingDoc ? 'Changes are reflected everywhere immediately after saving.' : 'New doctors appear in Find-a-Doctor immediately after saving.'}
          </p>
          <div className="field">
            <label>Full name</label>
            <input className="input" placeholder="Dr. Elena Santos" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="two">
            <div className="field">
              <label>Specialty</label>
              <select className="select" value={form.specialtyId} onChange={(e) => setForm({ ...form, specialtyId: e.target.value })}>
                {specialties.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                {specMissing && <option value={form.specialtyId}>{editingDoc ? editingDoc.specialty : form.specialtyId}</option>}
                <option value="__new">+ Add new specialty…</option>
              </select>
            </div>
            <div className="field">
              <label>Room · Floor</label>
              <input className="input" placeholder="512 · 5th floor" value={form.roomFloor} onChange={(e) => setForm({ ...form, roomFloor: e.target.value })} />
            </div>
          </div>
          <div className="field" style={{ display: form.specialtyId === '__new' ? 'flex' : 'none' }}>
            <label>New specialty name</label>
            <input className="input" placeholder="e.g. Ophthalmology" value={form.newSpec} onChange={(e) => setForm({ ...form, newSpec: e.target.value })} />
            <span className="hint">Added to the directory and Find-a-Doctor filters on save.</span>
          </div>
          <div className="field">
            <label>Clinic days</label>
            <div className="daypick">
              {W.map((w) => (
                <button key={w} type="button" className={'dp' + (form.days.includes(w) ? ' on' : '')} onClick={() => toggleDay(w)}>{w}</button>
              ))}
            </div>
          </div>
          <div className="two">
            <div className="field">
              <label>Clinic starts</label>
              <select className="select" value={String(form.startMin)} onChange={(e) => setForm({ ...form, startMin: Number(e.target.value) })}>
                {START_OPTS.map((o) => <option key={o.min} value={String(o.min)}>{o.label}</option>)}
                {startMissing && <option value={String(form.startMin)}>{fmtTime(form.startMin)}</option>}
              </select>
            </div>
            <div className="field">
              <label>Slots per day</label>
              <input className="input" type="number" min={1} max={48} value={form.slots} onChange={(e) => setForm({ ...form, slots: e.target.value })} />
            </div>
          </div>
          <div className="field">
            <label>Consultation modes</label>
            <div className="modes">
              <button type="button" className={'mode' + (form.modes.includes('onsite') ? ' on' : '')} onClick={() => toggleMode('onsite')}>{icoOnsite}Onsite</button>
              <button type="button" className={'mode' + (form.modes.includes('tele') ? ' on' : '')} onClick={() => toggleMode('tele')}>{icoTele}Telemedicine</button>
            </div>
          </div>
          <div className="field">
            <label>Short bio</label>
            <textarea className="input" rows={3} placeholder="Shown on the doctor's booking page." value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} />
          </div>
          <button className="btn btn-primary btn-block" style={{ marginTop: 4 }} onClick={() => { void save(); }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
            <span>{editingDoc ? 'Save changes' : 'Save doctor'}</span>
          </button>
          <button className="btn btn-ghost btn-block" style={{ marginTop: 8 }} onClick={cancel}>
            {editingDoc ? 'Cancel editing' : 'Clear form'}
          </button>
          {editingDoc && (
            <>
              <button className="btn btn-danger btn-block" style={{ marginTop: 8 }} onClick={() => { void del(); }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m2 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" /></svg>
                <span>{deleteArmed ? 'Click again to confirm delete' : 'Delete doctor'}</span>
              </button>
              <p className="hint" style={{ marginTop: 6 }}>
                Deleting removes the doctor entirely. If they have booking history, prefer Deactivate (pause button) — it hides them from booking but keeps records.
              </p>
            </>
          )}
        </aside>
      </div>
    </main>
  );
}
