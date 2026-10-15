/**
 * The rider's session: sign in (backend /auth/login/ + /users/whoami/), token
 * persistence, the forced password change, and sign-out — including the
 * automatic sign-out when a token refresh is rejected.
 *
 * Only rider accounts (role `delivery` | `rider`) may use the app; any other
 * role gets a friendly message and no session.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

import { API_BASE_URL } from '@/lib/api-config';
import { clearStoredTokens, hasAccessToken, onTokensChange, readStoredTokens, writeStoredTokens } from '@/lib/token-storage';
import { authApi, isRiderRole, useWhoAmIQuery, type WhoAmI } from './auth-api';
import { apiErrorMessage, apiErrorStatus, baseApi, isNetworkError } from './base-api';
import { useAppDispatch } from './hooks';

export type SessionStatus = 'booting' | 'offline' | 'signedOut' | 'signedIn';

type SignInResult = { ok: true } | { ok: false; message: string };

type SessionState = {
  status: SessionStatus;
  user: WhoAmI | null;
  mustChangePassword: boolean;
  /** Why the rider was signed out (shown once on the sign-in screen). */
  notice: string | null;
  clearNotice: () => void;
  signIn: (email: string, password: string) => Promise<SignInResult>;
  signOut: (notice?: string) => void;
  /** Retry loading the saved session (after an offline start). */
  retry: () => void;
  /** Called after a successful password change. */
  passwordChanged: () => void;
  /** Sign-up finished (tokens already stored) — load the new rider's session. */
  startSession: () => Promise<void>;
  /** The rider chose "Finish later" on onboarding (this app session only). */
  onboardingDeferred: boolean;
  deferOnboarding: () => void;
};

const SessionContext = createContext<SessionState>({} as SessionState);

/**
 * Signing out takes the rider offline, so dispatch stops assigning them and
 * logistics sees "Offline" straight away. Runs in the background with the
 * tokens captured before they are cleared; an expired access token is
 * refreshed once. Best effort — a failure never blocks signing out.
 */
function goOfflineInBackground(): void {
  const tokens = readStoredTokens();
  if (!tokens?.access) return;
  const post = (access: string) =>
    fetch(`${API_BASE_URL}/deliveries/rider/availability/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${access}` },
      body: JSON.stringify({ is_available: false }),
    });
  void (async () => {
    try {
      const res = await post(tokens.access!);
      if (res.status !== 401 || !tokens.refresh) return;
      const r = await fetch(`${API_BASE_URL}/auth/token/refresh/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh: tokens.refresh }),
      });
      const data = (await r.json().catch(() => ({}))) as { access?: string };
      if (r.ok && data.access) await post(data.access);
    } catch {
      // offline — the rider stays signed out either way
    }
  })();
}

function notRiderMessage(role: string) {
  const r = role ? ` (${role})` : '';
  return `This app is only for Koolboks delivery riders. Your account${r} isn't a rider account — please use Kool Konnect or the logistics dashboard instead.`;
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const dispatch = useAppDispatch();
  const [status, setStatus] = useState<SessionStatus>(hasAccessToken() ? 'booting' : 'signedOut');
  const [user, setUser] = useState<WhoAmI | null>(null);
  const [forcedChange, setForcedChange] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [onboardingDeferred, setOnboardingDeferred] = useState(false);
  const signingOut = useRef(false);

  // Keep the profile fresh while signed in (e.g. after the password change).
  const me = useWhoAmIQuery(undefined, { skip: status !== 'signedIn' });
  const currentUser = me.data ?? user;

  const endSession = useCallback(
    (why?: string) => {
      signingOut.current = true;
      clearStoredTokens();
      dispatch(baseApi.util.resetApiState());
      setUser(null);
      setForcedChange(false);
      setOnboardingDeferred(false);
      setStatus('signedOut');
      if (why) setNotice(why);
      signingOut.current = false;
    },
    [dispatch],
  );

  /** Fetch whoami for the stored token and decide where the rider stands. */
  const loadSession = useCallback(async () => {
    const req = dispatch(authApi.endpoints.whoAmI.initiate(undefined, { forceRefetch: true }));
    try {
      const who = await req.unwrap();
      if (!isRiderRole(who.role)) {
        endSession(notRiderMessage(who.role));
        return;
      }
      setUser(who);
      setForcedChange(Boolean(who.must_change_password));
      setStatus('signedIn');
    } catch (err) {
      if (isNetworkError(err)) {
        setStatus('offline');
      } else if (apiErrorStatus(err) === 401 || apiErrorStatus(err) === 403) {
        endSession('Your session has expired. Please sign in again.');
      } else {
        setStatus('offline');
      }
    } finally {
      req.unsubscribe();
    }
  }, [dispatch, endSession]);

  // Restore the saved session once at start-up.
  useEffect(() => {
    if (!hasAccessToken()) return;
    const t = setTimeout(loadSession, 0);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // A rejected refresh clears the tokens (base-api) — follow it here.
  const statusRef = useRef(status);
  useEffect(() => {
    statusRef.current = status;
  }, [status]);
  useEffect(
    () =>
      onTokensChange((tokens) => {
        if (tokens || signingOut.current) return;
        if (statusRef.current !== 'signedIn' && statusRef.current !== 'booting') return;
        setNotice('Your session has expired. Please sign in again.');
        setUser(null);
        setForcedChange(false);
        dispatch(baseApi.util.resetApiState());
        setStatus('signedOut');
      }),
    [dispatch],
  );

  const signIn = useCallback(
    async (email: string, password: string): Promise<SignInResult> => {
      setNotice(null);
      const login = dispatch(authApi.endpoints.login.initiate({ email, password }));
      try {
        const res = await login.unwrap();
        if (!isRiderRole(res.role)) return { ok: false, message: notRiderMessage(res.role) };
        writeStoredTokens({ access: res.access, refresh: res.refresh });
        const who = await dispatch(authApi.endpoints.whoAmI.initiate(undefined, { forceRefetch: true })).unwrap();
        if (!isRiderRole(who.role)) {
          endSession();
          return { ok: false, message: notRiderMessage(who.role) };
        }
        setUser(who);
        setForcedChange(Boolean(res.must_change_password || who.must_change_password));
        setStatus('signedIn');
        return { ok: true };
      } catch (err) {
        if (apiErrorStatus(err) === 400) return { ok: false, message: 'Wrong email or password.' };
        return { ok: false, message: apiErrorMessage(err, 'Could not sign you in. Please try again.') };
      } finally {
        login.reset();
      }
    },
    [dispatch, endSession],
  );

  const value = useMemo<SessionState>(
    () => ({
      status,
      user: currentUser,
      mustChangePassword: status === 'signedIn' && forcedChange,
      notice,
      clearNotice: () => setNotice(null),
      signIn,
      signOut: (why?: string) => {
        if (status === 'signedIn' || status === 'offline') goOfflineInBackground();
        endSession(why);
      },
      retry: () => {
        setStatus('booting');
        loadSession();
      },
      passwordChanged: () => setForcedChange(false),
      startSession: loadSession,
      onboardingDeferred,
      deferOnboarding: () => setOnboardingDeferred(true),
    }),
    [status, currentUser, forcedChange, notice, signIn, endSession, loadSession, onboardingDeferred],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  return useContext(SessionContext);
}
