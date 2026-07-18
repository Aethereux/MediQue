/* MediQue.ph — navigation: TopNav, BottomTabBar, Footer (react-router). */

import { useEffect, useState } from 'react';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Avatar, Btn, Logo } from './components';
import { I, LogoMark } from './icons';
import type { Me } from './types';

interface NavLinkProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
}

export function NavLink({ active, children, ...rest }: NavLinkProps) {
  return (
    <button {...rest} style={{
      background: 'none', border: 'none', font: 'inherit', cursor: 'pointer',
      fontSize: 14.5, fontWeight: active ? 600 : 500,
      color: active ? 'var(--c-primary-dark)' : 'var(--c-text-2)',
      padding: '8px 2px', position: 'relative', transition: 'color .15s ease',
    }}
      onMouseEnter={(e) => { if (!active) e.currentTarget.style.color = 'var(--c-text)'; }}
      onMouseLeave={(e) => { if (!active) e.currentTarget.style.color = 'var(--c-text-2)'; }}>
      {children}
      {active && <span style={{ position: 'absolute', left: 0, right: 0, bottom: -2, height: 2.5, borderRadius: 2, background: 'var(--c-primary)' }} />}
    </button>
  );
}

export function TopNav({ user, onLogout }: { user: Me | null; onLogout: () => void }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [menuOpen, setMenuOpen] = useState(false); // mobile hamburger (public)
  const [avatarOpen, setAvatarOpen] = useState(false);
  useEffect(() => { setMenuOpen(false); setAvatarOpen(false); }, [pathname]);

  const publicLinks = [
    { label: 'Find a doctor', to: '/doctors' },
    { label: 'About', to: '/about' },
    { label: 'Contact', to: '/contact' },
  ];
  const authedLinks = [
    { label: 'Dashboard', to: '/dashboard' },
    { label: 'Find a doctor', to: '/doctors' },
    { label: 'My appointments', to: '/appointments' },
  ];
  const links = user ? authedLinks : publicLinks;
  const isActive = (to: string) => pathname === to || (to === '/doctors' && pathname.startsWith('/doctors'));

  return (
    <header style={{ position: 'sticky', top: 0, zIndex: 100, background: 'rgba(255,255,255,0.86)', backdropFilter: 'saturate(180%) blur(12px)', borderBottom: '1px solid var(--c-border)' }}>
      <div className="container nav-bar" style={{ height: 'var(--nav-h)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
        <Logo onClick={() => navigate(user ? '/dashboard' : '/')} />

        {/* desktop links */}
        <nav className="nav-links" style={{ display: 'flex', alignItems: 'center', gap: 26 }}>
          {links.map((l) => <NavLink key={l.label + l.to} active={isActive(l.to)} onClick={() => navigate(l.to)}>{l.label}</NavLink>)}
        </nav>

        {/* right cluster */}
        <div className="nav-right" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {!user ? (
            <>
              <div className="nav-auth-btns" style={{ display: 'flex', gap: 10 }}>
                <Btn variant="ghost" size="sm" onClick={() => navigate('/login')}>Log in</Btn>
                <Btn variant="primary" size="sm" onClick={() => navigate('/register')}>Sign up</Btn>
              </div>
              <button className="nav-hamburger" onClick={() => setMenuOpen((o) => !o)} aria-label="Menu"
                style={{ display: 'none', background: 'none', border: 'none', color: 'var(--c-text)', padding: 6, cursor: 'pointer' }}>
                {menuOpen ? I.x({ size: 26 }) : I.menu({ size: 26 })}
              </button>
            </>
          ) : (
            <>
              <button aria-label="Notifications" style={{ background: 'none', border: 'none', color: 'var(--c-text-2)', padding: 8, cursor: 'pointer', position: 'relative', borderRadius: 10 }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--c-primary-tint)'} onMouseLeave={(e) => e.currentTarget.style.background = 'none'}>
                {I.bell({ size: 20 })}
                <span style={{ position: 'absolute', top: 7, right: 9, width: 7, height: 7, borderRadius: '50%', background: 'var(--c-accent)', border: '1.5px solid #fff' }} />
              </button>
              <div style={{ position: 'relative' }} className="avatar-menu-wrap">
                <button onClick={() => setAvatarOpen((o) => !o)} className="row" style={{ gap: 9, background: 'none', border: '1px solid var(--c-border)', borderRadius: 999, padding: '4px 6px 4px 4px', cursor: 'pointer' }}>
                  <Avatar name={user.full_name} initials={user.initials} size={32} />
                  <span className="avatar-name" style={{ fontSize: 13.5, fontWeight: 600 }}>{user.first_name}</span>
                  {I.chevronDown({ size: 15, style: { color: 'var(--c-text-2)' } })}
                </button>
                {avatarOpen && (
                  <div className="card rise-in" style={{ position: 'absolute', right: 0, top: 'calc(100% + 8px)', width: 196, padding: 6, boxShadow: 'var(--sh-lg)', zIndex: 120 }}>
                    <MenuItem icon={I.user({ size: 17 })} onClick={() => navigate('/account')}>My account</MenuItem>
                    <MenuItem icon={I.list({ size: 17 })} onClick={() => navigate('/appointments')}>My appointments</MenuItem>
                    <div className="divider" style={{ margin: '6px 4px' }} />
                    <MenuItem icon={I.logOut({ size: 17 })} danger onClick={onLogout}>Log out</MenuItem>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* mobile dropdown (public only) */}
      {!user && menuOpen && (
        <div className="nav-mobile-menu rise-in" style={{ borderTop: '1px solid var(--c-border)', background: '#fff', padding: '10px 0' }}>
          <div className="container stack" style={{ gap: 2 }}>
            {links.map((l) => (
              <button key={l.label + l.to} onClick={() => navigate(l.to)} style={{ textAlign: 'left', background: 'none', border: 'none', font: 'inherit', fontSize: 15.5, fontWeight: 600, color: 'var(--c-text)', padding: '13px 4px', cursor: 'pointer', borderRadius: 8 }}>{l.label}</button>
            ))}
            <div className="divider" style={{ margin: '8px 0' }} />
            <div className="row" style={{ gap: 10 }}>
              <Btn variant="secondary" block onClick={() => navigate('/login')}>Log in</Btn>
              <Btn variant="primary" block onClick={() => navigate('/register')}>Sign up</Btn>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

interface MenuItemProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: ReactNode;
  danger?: boolean;
}

export function MenuItem({ icon, children, danger, ...rest }: MenuItemProps) {
  return (
    <button {...rest} className="row" style={{ width: '100%', gap: 11, background: 'none', border: 'none', font: 'inherit', fontSize: 14, fontWeight: 500, color: danger ? 'var(--c-error)' : 'var(--c-text)', padding: '10px 11px', cursor: 'pointer', borderRadius: 9, textAlign: 'left' }}
      onMouseEnter={(e) => e.currentTarget.style.background = danger ? 'var(--c-error-soft)' : 'var(--c-primary-tint)'}
      onMouseLeave={(e) => e.currentTarget.style.background = 'none'}>
      <span style={{ color: danger ? 'var(--c-error)' : 'var(--c-text-2)', display: 'flex' }}>{icon}</span>{children}
    </button>
  );
}

/* ---------- Bottom tab bar (mobile, logged in) ---------- */
export function BottomTabBar() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const tabs = [
    { to: '/dashboard', label: 'Home', icon: I.home, match: (p: string) => p === '/dashboard' },
    { to: '/doctors', label: 'Find', icon: I.search, match: (p: string) => p.startsWith('/doctors') || p.startsWith('/book') },
    { to: '/appointments', label: 'Appointments', icon: I.calendarCheck, match: (p: string) => p === '/appointments' },
    { to: '/account', label: 'Account', icon: I.user, match: (p: string) => p === '/account' },
  ];
  return (
    <nav className="bottom-tabs" style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 90, background: 'rgba(255,255,255,0.94)', backdropFilter: 'blur(12px)', borderTop: '1px solid var(--c-border)', display: 'none', paddingBottom: 'env(safe-area-inset-bottom, 0)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-around', maxWidth: 520, margin: '0 auto' }}>
        {tabs.map((t) => {
          const active = t.match(pathname);
          return (
            <button key={t.to} onClick={() => navigate(t.to)} style={{ flex: 1, background: 'none', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, padding: '9px 0 7px', color: active ? 'var(--c-primary)' : 'var(--c-text-2)' }}>
              {t.icon({ size: 23, sw: active ? 2.4 : 2 })}
              <span style={{ fontSize: 11, fontWeight: active ? 700 : 500 }}>{t.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

/* ---------- Footer ---------- */
export function Footer() {
  return (
    <footer style={{ background: '#0A6E6E', color: '#fff', marginTop: 'auto' }}>
      <div className="container" style={{ padding: '52px 28px 30px' }}>
        <div className="footer-grid" style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr 1fr', gap: 36 }}>
          <div>
            <div className="row" style={{ gap: 10, marginBottom: 14 }}>
              <LogoMark size={34} />
              <div style={{ lineHeight: 1.05 }}>
                <div style={{ fontFamily: 'var(--font-head)', fontWeight: 600, fontSize: 21, color: '#fff' }}>MediQue<span style={{ color: 'var(--c-accent)', fontWeight: 500 }}>.ph</span></div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,.7)', fontWeight: 500, marginTop: 2 }}>by Makati Medical Center</div>
              </div>
            </div>
            <p style={{ color: 'rgba(255,255,255,.78)', fontSize: 14, maxWidth: 320 }}>Accessing healthcare with a click. Find MakatiMed doctors, see how full each day is, and reserve your slot — onsite or by telemedicine.</p>
          </div>
          <FooterCol title="Product" links={[['Find a doctor', '/doctors'], ['How it works', '/'], ['About', '/about'], ['Contact', '/contact']]} />
          <FooterCol title="Support" links={[['Help center', '/contact'], ['Privacy', '/about'], ['Terms', '/about'], ['Data privacy', '/about']]} />
        </div>
        <div className="divider" style={{ background: 'rgba(255,255,255,.16)', margin: '30px 0 18px' }} />
        <div className="footer-bottom row" style={{ justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', color: 'rgba(255,255,255,.66)', fontSize: 13 }}>
          <span>MediQue.ph by Makati Medical Center — Accessing healthcare with a click.</span>
          <span>© 2026 MediQue.ph · A demo prototype. Not for actual medical booking.</span>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: [string, string][] }) {
  const navigate = useNavigate();
  return (
    <div>
      <div style={{ fontSize: 12.5, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,.6)', marginBottom: 14 }}>{title}</div>
      <div className="stack" style={{ gap: 10 }}>
        {links.map(([label, to]) => (
          <button key={label} onClick={() => navigate(to)} style={{ textAlign: 'left', background: 'none', border: 'none', color: 'rgba(255,255,255,.85)', fontSize: 14, cursor: 'pointer', padding: 0, fontFamily: 'inherit' }}
            onMouseEnter={(e) => e.currentTarget.style.color = '#fff'} onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255,255,255,.85)'}>{label}</button>
        ))}
      </div>
    </div>
  );
}
