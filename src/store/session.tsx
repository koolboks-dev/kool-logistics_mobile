/**
 * The rider's session: sign in (backend /auth/login/ + /users/whoami/), token
 * persistence, the forced password change, and sign-out — including the
 * automatic sign-out when a token refresh is rejected.
 *
 * Only rider accounts (role `delivery` | `rider`) may use the app; any other
 * role gets a friendly message and no session.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

import { clearStoredTokens, hasAccessToken, onTokensChange, writeStoredTokens } from '@/lib/token-storage';
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
};

const SessionContext = createContext<SessionState>({} as SessionState);

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
      setStatus('signedOut');
      if (why) setNotice(why);
      signingOut.current = false;
    },
    [dispatch],
  );

  /** Fetch whoami for the stored token and decide where the rider stands. */
  const loadSession = useCallback(async () => {
    setStatus('booting');
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
    if (hasAccessToken()) loadSession();
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
      signOut: (why?: string) => endSession(why),
      retry: loadSession,
      passwordChanged: () => setForcedChange(false),
    }),
    [status, currentUser, forcedChange, notice, signIn, endSession, loadSession],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  return useContext(SessionContext);
}
