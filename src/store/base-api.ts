/**
 * RTK Query base API — every backend call in the rider app goes through here.
 *
 * Feature files add endpoints with `baseApi.injectEndpoints(...)` (see
 * auth-api.ts, rider-api.ts, notifications-api.ts) so the store only ever
 * holds one API slice.
 *
 *   - Base URL comes from EXPO_PUBLIC_API_BASE_URL (the shared Kool backend).
 *   - The stored access token is attached to every request.
 *   - A 401 `token_not_valid` refreshes the token once and replays the request;
 *     if the refresh fails the tokens are cleared and the rider must sign in
 *     (the session provider follows the token store and signs out).
 */
import {
  createApi,
  fetchBaseQuery,
  type BaseQueryFn,
  type FetchArgs,
  type FetchBaseQueryError,
} from '@reduxjs/toolkit/query/react';

import { API_BASE_URL } from '@/lib/api-config';
import { clearStoredTokens, readStoredTokens, writeStoredTokens } from '@/lib/token-storage';
import { Mutex } from './mutex';

const rawBaseQuery = fetchBaseQuery({
  baseUrl: API_BASE_URL,
  timeout: 30000,
  prepareHeaders: (headers) => {
    if (!headers.has('Authorization')) {
      const access = readStoredTokens()?.access;
      if (access && access !== 'undefined' && access !== 'null') {
        headers.set('Authorization', `Bearer ${access}`);
      }
    }
    return headers;
  },
});

/** One refresh at a time — parallel 401s wait for it instead of racing. */
const refreshLock = new Mutex();

/**
 * Exchange the refresh token for a new pair. Shared by the HTTP layer and the
 * realtime socket (which gets `token_invalid` on connect when the access token
 * has expired). Resolves true when a new access token was stored. Clears the
 * session only when the server rejects the refresh token (not on a network
 * failure, so a rider who briefly loses signal stays signed in).
 */
export async function refreshSession(): Promise<boolean> {
  if (refreshLock.isLocked()) {
    await refreshLock.waitForUnlock();
    return Boolean(readStoredTokens()?.access);
  }
  const release = await refreshLock.acquire();
  try {
    const refresh = readStoredTokens()?.refresh;
    if (!refresh) {
      clearStoredTokens();
      return false;
    }
    let res: Response;
    try {
      res = await fetch(`${API_BASE_URL}/auth/token/refresh/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh }),
      });
    } catch {
      return false; // offline — keep the session, try again later
    }
    const data = (await res.json().catch(() => ({}))) as { access?: string; refresh?: string };
    if (res.ok && data.access) {
      writeStoredTokens({ access: data.access, refresh: data.refresh ?? refresh });
      return true;
    }
    if (res.status === 400 || res.status === 401 || res.status === 403) clearStoredTokens();
    return false;
  } finally {
    release();
  }
}

type ErrorBody = {
  error?: { code?: string; message?: string; details?: Record<string, unknown> } | string;
  code?: string;
  detail?: string;
  message?: string;
};

function errorBody(error: unknown): ErrorBody {
  if (!error || typeof error !== 'object' || !('status' in error)) return {};
  const data = (error as FetchBaseQueryError).data;
  return data && typeof data === 'object' ? (data as ErrorBody) : {};
}

const baseQueryWithReauth: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (
  args,
  api,
  extraOptions,
) => {
  await refreshLock.waitForUnlock();
  let result = await rawBaseQuery(args, api, extraOptions);

  if (result.error?.status === 401 && apiErrorCode(result.error) === 'token_not_valid') {
    const refreshed = await refreshSession();
    if (refreshed) {
      result = await rawBaseQuery(args, api, extraOptions);
    } else if (!readStoredTokens()) {
      api.dispatch(baseApi.util.resetApiState());
    }
  }
  return result;
};

export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Me', 'RiderMe', 'Deliveries', 'Delivery', 'Notifications'],
  endpoints: () => ({}),
});

/** The backend error code (`error.code`, or the old top-level `code`/`error` string). */
export function apiErrorCode(error: unknown): string | undefined {
  const body = errorBody(error);
  if (typeof body.error === 'object' && body.error?.code) return body.error.code;
  if (typeof body.error === 'string' && body.error) return body.error;
  return body.code;
}

/** Extra fields the backend puts next to `error.code` (e.g. attempts_left, fields). */
export function apiErrorDetails(error: unknown): Record<string, unknown> {
  const body = errorBody(error);
  return typeof body.error === 'object' && body.error ? (body.error as Record<string, unknown>) : {};
}

/** A readable message from any RTK Query error (server message first). */
export function apiErrorMessage(error: unknown, fallback = 'Something went wrong. Please try again.'): string {
  if (!error || typeof error !== 'object') return fallback;
  if ('status' in error) {
    const e = error as FetchBaseQueryError;
    if (e.status === 'FETCH_ERROR') return "We couldn't reach the server. Check your connection and try again.";
    if (e.status === 'TIMEOUT_ERROR') return 'The server took too long to respond. Please try again.';
    if (e.status === 'PARSING_ERROR') return 'The server sent an unexpected response. Please try again.';
    const body = errorBody(e);
    if (typeof body.error === 'object' && body.error) {
      // Validation errors: show the first field message, it is more useful.
      const details = body.error.details;
      if (details && typeof details === 'object') {
        const first = Object.values(details)[0];
        const msg = Array.isArray(first) ? first[0] : first;
        if (typeof msg === 'string' && msg) return msg;
      }
      if (body.error.message) return body.error.message;
    }
    if (typeof body.error === 'string' && body.message) return body.message;
    return body.message || body.detail || fallback;
  }
  return 'message' in error && typeof (error as { message: unknown }).message === 'string'
    ? (error as { message: string }).message
    : fallback;
}

/** The HTTP status of an RTK Query error, if it has one. */
export function apiErrorStatus(error: unknown): number | undefined {
  if (error && typeof error === 'object' && 'status' in error) {
    const s = (error as { status: unknown }).status;
    return typeof s === 'number' ? s : undefined;
  }
  return undefined;
}

/** True for connectivity failures (no HTTP response at all). */
export function isNetworkError(error: unknown): boolean {
  if (!error || typeof error !== 'object' || !('status' in error)) return false;
  const s = (error as { status: unknown }).status;
  return s === 'FETCH_ERROR' || s === 'TIMEOUT_ERROR';
}
