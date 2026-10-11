/**
 * Where the app talks to the backend. This is the shared Kool backend (the
 * same one Kool Konnect and Kool Logistics Web use), so one account works in
 * every app.
 *
 * Set EXPO_PUBLIC_API_BASE_URL in .env (e.g. https://api.example.com). The
 * `/api/v1` suffix is added when missing.
 */
export function normalizeApiBase(baseUrl?: string): string {
  const raw = (baseUrl || '').trim().replace(/\/$/, '');
  if (!raw) return 'http://127.0.0.1:8000/api/v1';
  return raw.endsWith('/api/v1') ? raw : `${raw}/api/v1`;
}

export const API_BASE_URL = normalizeApiBase(process.env.EXPO_PUBLIC_API_BASE_URL);
