/* MediQue.ph — admin chrome: sticky header + ADMIN pill + nav + <Outlet/>. */

import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Toast } from '../../components';
import { I, LogoMark } from '../../icons';
import { useApp } from '../../store';
import './admin.css';

/* ---------- small shared helpers for the admin pages (local to admin) ---------- */

export const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
export const MON_FULL = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
export const WEEKDAY_FULL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/** Today's ISO date in Asia/Manila (en-CA formats as YYYY-MM-DD). */
export function todayIsoManila(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Manila' }).format(new Date());
}

function toUtc(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

export function addDaysIso(iso: string, n: number): string {
  const dt = toUtc(iso);
  dt.setUTCDate(dt.getUTCDate() + n);
  return dt.toISOString().slice(0, 10);
}

export interface IsoParts {
  iso: string;
  dow: string;
  day: number;
  month: string;
  monthFull: string;
  weekday: string;
  year: number;
}

export function isoParts(iso: string): IsoParts {
  const dt = toUtc(iso);
  return {
    iso,
    dow: DOW[dt.getUTCDay()],
    day: dt.getUTCDate(),
    month: MON[dt.getUTCMonth()],
    monthFull: MON_FULL[dt.getUTCMonth()],
    weekday: WEEKDAY_FULL[dt.getUTCDay()],
    year: dt.getUTCFullYear(),
  };
}

/** "9:45 AM" -> minutes since midnight. */
export function parseTimeLabel(lbl: string): number {
  const m = lbl.match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (!m) return 0;
  const h = (Number(m[1]) % 12) + (m[3].toUpperCase() === 'PM' ? 12 : 0);
  return h * 60 + Number(m[2]);
}

/** minutes since midnight -> "9:45 AM". */
export function fmtTime(min: number): string {
  const h = Math.floor(min / 60);
  const mm = min % 60;
  const ap = h >= 12 ? 'PM' : 'AM';
  let hh = h % 12;
  if (!hh) hh = 12;
  return hh + ':' + String(mm).padStart(2, '0') + ' ' + ap;
}

/** "Dr. Elena Santos" -> "ES". */
export function docInitials(nm: string): string {
  return nm.replace(/^Dr\.\s*/, '').split(' ').map((w) => w[0] || '').slice(0, 2).join('').toUpperCase();
}

/* ---------- layout ---------- */

export default function AdminLayout() {
  const { user, toast, logout } = useApp();
  const navigate = useNavigate();
  const onLogout = () => {
    logout();
    navigate('/login');
  };
  const { pathname } = useLocation();
  const on = (to: string) => (pathname === to ? 'on' : undefined);

  return (
    <div className="admin-root">
      <header>
        <div className="bar">
          <div className="logo">
            <LogoMark size={32} />
            <div>
              <div className="name">MediQue<span>.ph</span></div>
              <div className="sub">by Makati Medical Center</div>
            </div>
          </div>
          <span className="adm">ADMIN</span>
          <nav className="navl">
            <Link className={on('/admin')} to="/admin">Day board</Link>
            <Link className={on('/admin/bookings')} to="/admin/bookings">Bookings</Link>
            <Link className={on('/admin/doctors')} to="/admin/doctors">Doctors</Link>
          </nav>
          <div className="right">
            {pathname === '/admin' && (
              <button className="btn btn-primary" onClick={() => navigate('/admin/doctors')}>
                {I.plus({ size: 16 })}Add a doctor
              </button>
            )}
            <span className="avatar" style={{ width: 38, height: 38, background: 'var(--c-accent)', fontSize: 14 }}>
              {user ? user.initials : ''}
            </span>
            <button className="btn btn-ghost" onClick={onLogout} title="Log out">
              {I.logOut({ size: 16 })}Log out
            </button>
          </div>
        </div>
      </header>
      <Outlet />
      <Toast toast={toast} />
    </div>
  );
}
