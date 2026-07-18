/* MediQue.ph — admin Clinic day board (/admin). Data: GET /api/admin/dayboard. */

import { useEffect, useRef, useState } from 'react';
import type { MouseEvent } from 'react';
import { adminDayboard, ApiError } from '../../api';
import { useApp } from '../../store';
import type { BoardLane, BoardPatient, BoardSlot, DayBoard as DayBoardData, Mode } from '../../types';
import { addDaysIso, docInitials, fmtTime, isoParts, parseTimeLabel, todayIsoManila } from './AdminLayout';

interface PopState {
  lane: number;
  index: number;
  align: '' | 'aleft' | 'aright';
}

/** The board API's patient object may carry the booking mode; the type only guarantees the core fields. */
type PopPatient = BoardPatient & { mode?: Mode };

function laneStartMin(lane: BoardLane): number {
  return lane.slots.length ? parseTimeLabel(lane.slots[0].time) : 0;
}

export default function DayBoard() {
  const { showToast } = useApp();
  const today = todayIsoManila();
  const [selectedIso, setSelectedIso] = useState(today);
  const [data, setData] = useState<DayBoardData | null>(null);
  const [pop, setPop] = useState<PopState | null>(null);
  const boardRef = useRef<HTMLDivElement | null>(null);
  const toastRef = useRef(showToast);
  toastRef.current = showToast;

  useEffect(() => {
    let live = true;
    adminDayboard(selectedIso)
      .then((d) => { if (live) { setData(d); setPop(null); } })
      .catch((e: unknown) => toastRef.current(e instanceof ApiError ? e.detail : 'Something went wrong. Please try again.'));
    return () => { live = false; };
  }, [selectedIso]);

  /* week strip: SAT..FRI of the week containing the selected date */
  const sel = isoParts(selectedIso);
  const [y, m, d] = selectedIso.split('-').map(Number);
  const dowIdx = new Date(Date.UTC(y, m - 1, d)).getUTCDay(); // 0=Sun..6=Sat
  const satIso = addDaysIso(selectedIso, -((dowIdx + 1) % 7));
  const week = Array.from({ length: 7 }, (_, i) => isoParts(addDaysIso(satIso, i)));

  /* shared time axis from the open lanes */
  const openLanes = data ? data.lanes.filter((l) => l.open && l.slots.length > 0) : [];
  let axisStart = 480;
  let axisEnd = 780;
  if (openLanes.length) {
    axisStart = Math.floor(Math.min(...openLanes.map((l) => laneStartMin(l))) / 60) * 60;
    axisEnd = Math.ceil(Math.max(...openLanes.map((l) => laneStartMin(l) + l.limit * 15)) / 60) * 60;
  }
  const cols = (axisEnd - axisStart) / 15;
  const hours = (axisEnd - axisStart) / 60;
  const slotsStyle = {
    position: 'relative' as const,
    gridTemplateColumns: `repeat(${cols},1fr)`,
    backgroundImage: `repeating-linear-gradient(to right,var(--c-border) 0 1px,transparent 1px calc(100% / ${hours}))`,
  };

  /* summary stacked bar */
  const summary = data ? data.summary : null;
  const segments = summary
    ? openLanes.filter((l) => l.booked > 0).map((l) => ({
        id: l.doctor_id,
        color: l.color,
        booked: l.booked,
        last: l.name.split(' ').pop() || l.name,
        pct: summary.capacity ? +((l.booked / summary.capacity) * 100).toFixed(1) : 0,
      }))
    : [];
  const fullCount = summary ? summary.fully_booked_doctors.length : 0;

  const enterSlot = (li: number, index: number) => (e: MouseEvent<HTMLDivElement>) => {
    let align: PopState['align'] = '';
    const board = boardRef.current;
    if (board) {
      const br = board.getBoundingClientRect();
      const cr = e.currentTarget.getBoundingClientRect();
      const center = cr.left + cr.width / 2;
      if (center - 106 < br.left + 8) align = 'aleft';
      else if (center + 106 > br.right - 8) align = 'aright';
    }
    setPop({ lane: li, index, align });
  };

  const renderPop = (lane: BoardLane, li: number, s: BoardSlot) => {
    if (!pop || pop.lane !== li || pop.index !== s.index) return null;
    const cls = 'pop' + (li === 0 ? ' below' : '') + (pop.align ? ' ' + pop.align : '');
    if (s.booked && s.patient) {
      const p = s.patient as PopPatient;
      const det = [p.ref, p.mode ? (p.mode === 'tele' ? 'Telemedicine' : 'Onsite') : null, s.time]
        .filter(Boolean).join(' · ');
      const pos = lane.slots.filter((x) => x.booked && x.index <= s.index).length;
      return (
        <span className={cls}>
          <span className="pn">{p.name}</span>
          <span className="pd" style={{ display: 'block' }}>{det}</span>
          <span className="tag">#{pos} of the day</span>
        </span>
      );
    }
    if (s.booked) {
      const pos = lane.slots.filter((x) => x.booked && x.index <= s.index).length;
      return (
        <span className={cls}>
          <span className="pn">Booked · {s.time}</span>
          <span className="pd" style={{ display: 'block' }}>Appointment #{pos} of the day</span>
        </span>
      );
    }
    return (
      <span className={cls}>
        <span className="pn">Open slot · {s.time}</span>
        <span className="pd" style={{ display: 'block' }}>Available for booking</span>
      </span>
    );
  };

  return (
    <main className="wrap">
      <div className="pagehead">
        <div>
          <h1>Clinic day board</h1>
          <div className="sub">Every doctor&#39;s day, slot by slot — {sel.weekday}, {sel.monthFull} {sel.day}, {sel.year}</div>
        </div>
        <div className="week">
          {week.map((w) => (
            <button
              key={w.iso}
              className={'wd' + (w.iso === selectedIso ? ' on' : '') + (w.iso < today ? ' dim' : '')}
              onClick={() => setSelectedIso(w.iso)}
            >
              <div className="d">{w.dow.toUpperCase()}</div>
              <div className="n">{w.day}</div>
            </button>
          ))}
        </div>
      </div>

      {summary && (
        <div className="sumline">
          <div>
            <div className="sum-n">{summary.booked} <small>/ {summary.capacity}</small></div>
            <div className="sum-l">slots booked · {summary.percent}%</div>
          </div>
          <div className="vr"></div>
          <div className="stackbar">
            <div className="bar">
              {segments.map((s) => <i key={s.id} style={{ width: s.pct + '%', background: s.color }}></i>)}
            </div>
            <div className="legend">
              {segments.map((s) => (
                <span className="lg" key={s.id}><i style={{ background: s.color }}></i>{s.last} <b>{s.booked}</b></span>
              ))}
              <span className="lg"><i style={{ background: '#E7EEEE' }}></i>Open <b>{Math.max(0, summary.capacity - summary.booked)}</b></span>
            </div>
          </div>
          <div className="vr"></div>
          <div>
            <div className="sum-n" style={{ color: '#B91C1C' }}>{fullCount}</div>
            <div className="sum-l">doctor{fullCount === 1 ? '' : 's'} fully booked</div>
          </div>
          <div className="vr"></div>
          <div>
            <div className="sum-n" style={{ color: 'var(--c-text-2)' }}>{summary.cancellations_today}</div>
            <div className="sum-l">cancellations today</div>
          </div>
        </div>
      )}

      {data && (
        <div className="board" ref={boardRef}>
          <div className="board-h">
            <h3>{sel.weekday}, {sel.monthFull} {sel.day} — {openLanes.length} doctors in clinic</h3>
            <div className="keys">
              <span className="k"><span className="cell-eg" style={{ background: '#0E8C8C' }}></span>Booked (initials)</span>
              <span className="k"><span className="cell-eg" style={{ border: '1.5px dashed #C5D4D4', background: '#fff' }}></span>Open slot</span>
              <span className="k"><span className="cell-eg" style={{ background: '#0E8C8C', outline: '3px solid var(--c-accent-soft)' }}></span>Selected booking</span>
            </div>
          </div>
          <div className="timehead">
            <div className="who">Doctor</div>
            <div className="ticks" style={{ gridTemplateColumns: `repeat(${hours},1fr)` }}>
              {Array.from({ length: hours }, (_, i) => <span key={i}>{fmtTime(axisStart + i * 60)}</span>)}
            </div>
          </div>
          <div id="lanes">
            {data.lanes.map((lane, li) => {
              const left = lane.limit - lane.booked;
              const full = lane.open && lane.booked >= lane.limit;
              const who = (
                <div className="who">
                  <span className="avatar" style={{ width: 40, height: 40, background: lane.color, fontSize: 14 }}>{docInitials(lane.name)}</span>
                  <div style={{ minWidth: 0 }}>
                    <div className="nm">{lane.name}</div>
                    <div className="sp">{lane.specialty} · Rm {lane.room}</div>
                    {lane.open && (full
                      ? <div className="cap" style={{ color: '#B91C1C' }}>{lane.limit} / {lane.limit} booked</div>
                      : <div className="cap" style={{ color: 'var(--c-text-2)' }}><b style={{ color: 'var(--c-text)' }}>{lane.booked} / {lane.limit}</b> booked · {left} left</div>)}
                  </div>
                </div>
              );
              if (!lane.open) {
                return (
                  <div className="lane closed" key={lane.doctor_id}>
                    {who}
                    <div className="slots">
                      <div className="closed-msg">
                        <svg style={{ width: 15, height: 15 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><circle cx="12" cy="12" r="9" /><path d="M8 12h8" /></svg>
                        No clinic on {sel.weekday}s — {lane.schedule_text}
                      </div>
                    </div>
                  </div>
                );
              }
              const offset = (laneStartMin(lane) - axisStart) / 15;
              return (
                <div className="lane" key={lane.doctor_id}>
                  {who}
                  <div className="slots" style={slotsStyle}>
                    {full && <span className="pill p-full" style={{ position: 'absolute', right: 14, top: -9 }}>Fully booked</span>}
                    {lane.slots.map((s) => (
                      <div
                        key={s.index}
                        className={'slot' + (s.booked ? '' : ' open')}
                        style={{ gridColumn: offset + s.index + 1, ...(s.booked ? { background: lane.color } : {}) }}
                        onMouseEnter={enterSlot(li, s.index)}
                        onMouseLeave={() => setPop(null)}
                      >
                        {s.booked && s.patient ? s.patient.initials : ''}
                        {renderPop(lane, li, s)}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </main>
  );
}
