/* MediQue.ph — routes, layouts, guards. */

import { useEffect } from 'react';
import type { ReactElement } from 'react';
import { Navigate, Outlet, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { Toast } from './components';
import { BottomTabBar, Footer, TopNav } from './nav';
import { useApp } from './store';

import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import About from './pages/About';
import Contact from './pages/Contact';
import Dashboard from './pages/Dashboard';
import FindDoctor from './pages/FindDoctor';
import DoctorProfile from './pages/DoctorProfile';
import BookingReview from './pages/BookingReview';
import BookingConfirmed from './pages/BookingConfirmation';
import Appointments from './pages/Appointments';
import Account from './pages/Account';
import AdminLayout from './pages/admin/AdminLayout';
import DayBoard from './pages/admin/DayBoard';
import AdminDoctors from './pages/admin/AdminDoctors';
import AdminBookings from './pages/admin/AdminBookings';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function RequireAuth({ children }: { children: ReactElement }) {
  const { user, authReady } = useApp();
  const location = useLocation();
  if (!authReady) return null;
  if (!user) return <Navigate to="/login" state={{ next: location.pathname }} replace />;
  return children;
}

function RequireAdmin({ children }: { children: ReactElement }) {
  const { user, authReady } = useApp();
  if (!authReady) return null;
  if (user?.role !== 'admin') return <Navigate to="/login" replace />;
  return children;
}

const PUBLIC_CHROME = ['/', '/about', '/contact'];
const TABBED = ['/dashboard', '/appointments', '/account'];

function PatientLayout() {
  const { user, toast, logout } = useApp();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const authed = !!user;
  const showFooter = PUBLIC_CHROME.includes(pathname);
  const showTabs = authed && (TABBED.includes(pathname) || pathname.startsWith('/doctors'));
  const onLogout = () => {
    logout();
    navigate('/');
  };
  return (
    <div className={authed ? 'is-authed' : 'is-public'}>
      <div className="screen">
        <TopNav user={user} onLogout={onLogout} />
        <Outlet />
        {showFooter && <Footer />}
      </div>
      {showTabs && <BottomTabBar />}
      <Toast toast={toast} />
    </div>
  );
}

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route element={<PatientLayout />}>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/doctors" element={<FindDoctor />} />
          <Route path="/doctors/:id" element={<DoctorProfile />} />
          <Route path="/dashboard" element={<RequireAuth><Dashboard /></RequireAuth>} />
          <Route path="/book/review" element={<RequireAuth><BookingReview /></RequireAuth>} />
          <Route path="/book/confirmed" element={<RequireAuth><BookingConfirmed /></RequireAuth>} />
          <Route path="/appointments" element={<RequireAuth><Appointments /></RequireAuth>} />
          <Route path="/account" element={<RequireAuth><Account /></RequireAuth>} />
        </Route>
        <Route path="/admin" element={<RequireAdmin><AdminLayout /></RequireAdmin>}>
          <Route index element={<DayBoard />} />
          <Route path="doctors" element={<AdminDoctors />} />
          <Route path="bookings" element={<AdminBookings />} />
        </Route>
      </Routes>
    </>
  );
}
