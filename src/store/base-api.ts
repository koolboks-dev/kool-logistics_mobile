/**
 * RTK Query base API — every backend call in the rider app goes through here.
 *
 * Feature files add endpoints with `baseApi.injectEndpoints(...)` (see
 * auth-api.ts) so the store only ever holds one API slice.
 *
 *   - Base URL comes from EXPO_PUBLIC_API_BASE_URL (the shared Kool backend).
 *   - The stored access token is attached to every request.
 *   - A 401 `token_not_valid` refreshes the token once and replays the request;
 *     if the refresh fails the tokens are cleared and the rider must sign in.
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
  timeout: 20000,
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

type ErrorBody = {
  error?: { code?: string; message?: string } | string;
  code?: string;
  detail?: string;
  message?: string;
};

function errorCode(error: FetchBaseQueryError | undefined): string | undefined {
  if (!error || typeof error.status !== 'number') return undefined;
  const body = (error.data ?? {}) as ErrorBody;
  if (typeof body.error === 'object' && body.error?.code) return body.error.code;
  return body.code;
}

const baseQueryWithReauth: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (
  args,
  api,
  extraOptions,
) => {
  await refreshLock.waitForUnlock();
  let result = await rawBaseQuery(args, api, extraOptions);

  if (result.error?.status === 401 && errorCode(result.error) === 'token_not_valid') {
    if (!refreshLock.isLocked()) {
      const release = await refreshLock.acquire();
      try {
        const refresh = readStoredTokens()?.refresh;
        const refreshed = refresh
          ? await rawBaseQuery({ url: '/auth/token/refresh/', method: 'POST', body: { refresh } }, api, extraOptions)
          : null;
        const data = refreshed?.data as { access?: string; refresh?: string } | undefined;
        if (data?.access) {
          writeStoredTokens({ access: data.access, refresh: data.refresh ?? refresh });
          result = await rawBaseQuery(args, api, extraOptions);
        } else {
          clearStoredTokens();
          api.dispatch(baseApi.util.resetApiState());
        }
      } finally {
        release();
      }
    } else {
      await refreshLock.waitForUnlock();
      result = await rawBaseQuery(args, api, extraOptions);
    }
  }
  return result;
};

export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Me', 'Deliveries', 'Notifications'],
  endpoints: () => ({}),
});

/** A readable message from any RTK Query error (server message first). */
export function apiErrorMessage(error: unknown, fallback = 'Something went wrong. Please try again.'): string {
  if (!error || typeof error !== 'object') return fallback;
  const e = error as FetchBaseQueryError & { message?: string };
  if ('status' in e) {
    if (e.status === 'FETCH_ERROR') return "We couldn't reach the server. Check your connection and try again.";
    if (e.status === 'TIMEOUT_ERROR') return 'The server took too long to respond. Please try again.';
    const body = (e.data ?? {}) as ErrorBody;
    if (typeof body.error === 'object' && body.error?.message) return body.error.message;
    if (typeof body.error === 'string' && body.error) return body.error;
    return body.message || body.detail || fallback;
  }
  return e.message || fallback;
}

/** The HTTP status of an RTK Query error, if it has one. */
export function apiErrorStatus(error: unknown): number | undefined {
  if (error && typeof error === 'object' && 'status' in error) {
    const s = (error as { status: unknown }).status;
    return typeof s === 'number' ? s : undefined;
  }
  return undefined;
}
