/**
 * Where the app talks to the backend. This is the shared Kool backend (the
 * same one Kool Konnect and Kool Logistics Web use), so one account works in
 * every app.
 *
 * Set EXPO_PUBLIC_API_BASE_URL in .env (e.g. https://kool-backend-node.onrender.com).
 * The `/api/v1` suffix is added when missing.
 *
 * Local development on a phone: `localhost` / `127.0.0.1` on the phone is the
 * phone itself, not your computer. When the URL points at localhost (or is not
 * set) in a dev build, the host is swapped for the LAN IP Metro is serving from
 * (Expo's `hostUri`), so the same .env works in the simulator and on a device.
 */
import Constants from 'expo-constants';
import { Platform } from 'react-native';

const LOCAL_DEFAULT = 'http://127.0.0.1:8001';
const LOOPBACK = /^(https?:\/\/)(localhost|127\.0\.0\.1)(:\d+)?/i;

/** The LAN host Metro is serving from (dev only), e.g. "192.168.1.20". */
function devHost(): string | null {
  if (!__DEV__ || Platform.OS === 'web') return null;
  const hostUri = Constants.expoConfig?.hostUri ?? '';
  const host = hostUri.split(':')[0];
  return host && host !== 'localhost' && host !== '127.0.0.1' ? host : null;
}

export function normalizeApiBase(baseUrl?: string): string {
  let raw = (baseUrl || '').trim().replace(/\/+$/, '') || LOCAL_DEFAULT;
  const lan = devHost();
  if (lan && LOOPBACK.test(raw)) {
    raw = raw.replace(LOOPBACK, (_m, scheme: string, _h: string, port?: string) => `${scheme}${lan}${port ?? ''}`);
  }
  return raw.endsWith('/api/v1') ? raw : `${raw}/api/v1`;
}

export const API_BASE_URL = normalizeApiBase(process.env.EXPO_PUBLIC_API_BASE_URL);

/** The API origin (no `/api/v1`) — socket.io connects here. */
export const API_ORIGIN = API_BASE_URL.replace(/\/api\/v1$/, '');

/** socket.io lives under the API prefix so the same reverse proxy forwards it. */
export const SOCKET_PATH = '/api/v1/socket.io';
