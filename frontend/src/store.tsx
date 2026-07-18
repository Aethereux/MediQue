/* MediQue.ph — app state: auth, booking draft, toast. One React context. */

import { createContext, useContext, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { apiMe, clearToken, getToken, setToken } from './api';
import type { AuthUser, BookingConfirmation, BookingDraft, Me } from './types';

const DRAFT_KEY = 'mq_draft';

interface AppState {
  user: Me | null;
  authReady: boolean;
  loginSuccess: (u: AuthUser, token: string) => Promise<void>;
  logout: () => void;
  refreshMe: () => Promise<void>;
  draft: BookingDraft | null;
  setDraft: (d: BookingDraft | null) => void;
  lastBooked: BookingConfirmation | null;
  setLastBooked: (b: BookingConfirmation | null) => void;
  toast: string | null;
  showToast: (msg: string) => void;
}

const AppContext = createContext<AppState | null>(null);

function readDraft(): BookingDraft | null {
  try {
    const raw = sessionStorage.getItem(DRAFT_KEY);
    return raw ? (JSON.parse(raw) as BookingDraft) : null;
  } catch {
    return null;
  }
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Me | null>(null);
  const [authReady, setAuthReady] = useState(() => !getToken());
  const [draft, setDraftState] = useState<BookingDraft | null>(readDraft);
  const [lastBooked, setLastBooked] = useState<BookingConfirmation | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef(0);

  const showToast = (msg: string) => {
    setToast(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 3200);
  };

  const setDraft = (d: BookingDraft | null) => {
    setDraftState(d);
    try {
      if (d) sessionStorage.setItem(DRAFT_KEY, JSON.stringify(d));
      else sessionStorage.removeItem(DRAFT_KEY);
    } catch {
      /* storage unavailable — draft stays in memory */
    }
  };

  const refreshMe = async () => {
    setUser(await apiMe());
  };

  useEffect(() => {
    if (getToken()) {
      apiMe()
        .then(setUser)
        .catch(() => setUser(null))
        .finally(() => setAuthReady(true));
    }
    const onUnauthorized = () => setUser(null);
    window.addEventListener('mq:unauthorized', onUnauthorized);
    return () => window.removeEventListener('mq:unauthorized', onUnauthorized);
  }, []);

  const loginSuccess = async (u: AuthUser, token: string) => {
    setToken(token);
    setUser(await apiMe());
    showToast('Welcome, ' + u.first_name + '!');
  };

  const logout = () => {
    clearToken();
    setUser(null);
  };

  return (
    <AppContext.Provider
      value={{ user, authReady, loginSuccess, logout, refreshMe, draft, setDraft, lastBooked, setLastBooked, toast, showToast }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp(): AppState {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
