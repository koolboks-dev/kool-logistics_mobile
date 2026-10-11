/**
 * Access/refresh token storage for the rider app.
 *
 * Tokens live in memory for synchronous reads (RTK Query's prepareHeaders runs
 * on every request) and are persisted to AsyncStorage so a rider stays signed
 * in between launches. Call `loadStoredTokens()` once at start-up, before the
 * first authenticated request.
 *
 * `onTokensChange` lets the session (sign-out when a refresh fails) and the
 * realtime socket (reconnect with the new access token) follow changes.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

const TOKEN_KEY = 'kl_auth_tokens';

export type StoredTokens = { access?: string; refresh?: string };

let cache: StoredTokens | null = null;
let loaded = false;
const listeners = new Set<(tokens: StoredTokens | null) => void>();

function emit() {
  listeners.forEach((fn) => {
    try {
      fn(cache);
    } catch {
      // A listener must never break token storage.
    }
  });
}

/** Read the persisted tokens into memory. Safe to call more than once. */
export async function loadStoredTokens(): Promise<StoredTokens | null> {
  if (loaded) return cache;
  try {
    const raw = await AsyncStorage.getItem(TOKEN_KEY);
    cache = raw ? (JSON.parse(raw) as StoredTokens) : null;
  } catch {
    cache = null;
  }
  loaded = true;
  return cache;
}

export function readStoredTokens(): StoredTokens | null {
  return cache;
}

export function writeStoredTokens(tokens: StoredTokens): void {
  cache = tokens;
  loaded = true;
  AsyncStorage.setItem(TOKEN_KEY, JSON.stringify(tokens)).catch(() => {});
  emit();
}

export function clearStoredTokens(): void {
  const had = cache !== null;
  cache = null;
  loaded = true;
  AsyncStorage.removeItem(TOKEN_KEY).catch(() => {});
  if (had) emit();
}

export function hasAccessToken(): boolean {
  const access = cache?.access;
  return Boolean(access && access !== 'undefined' && access !== 'null');
}

/** Subscribe to token writes/clears. Returns the unsubscribe function. */
export function onTokensChange(fn: (tokens: StoredTokens | null) => void): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}
