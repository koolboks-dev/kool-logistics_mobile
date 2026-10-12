/**
 * Live rider location (foreground).
 *
 * While the rider is available (online) or holds an active delivery, and has
 * granted "while using the app" location access, the app watches the GPS and
 * sends POST /deliveries/location/ about every `location_interval_seconds`
 * (30 s from the backend), never faster than `min_location_interval_seconds`.
 *
 *   accepted:false too_frequent  → wait retry_after_seconds, then carry on
 *   accepted:false not_on_duty   → pause until availability / deliveries change
 *   accepted:false inactive      → pause (account deactivated)
 *   accepted:false invalid_location → keep going with the next fix
 *
 * Sharing stops while the app is in the background (foreground-only tracking:
 * no background permission or task is requested).
 */
import * as Location from 'expo-location';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { AppState, Linking } from 'react-native';

import { isNetworkError } from './base-api';
import { useAppDispatch } from './hooks';
import { riderApi, useAssignedDeliveriesQuery, useRiderMeQuery } from './rider-api';
import { useSession } from './session';

export type PermissionState = 'unknown' | 'undetermined' | 'granted' | 'denied';

export type SharingState =
  /** Rider is offline with no active delivery — nothing to share. */
  | 'off'
  | 'needs_permission'
  | 'denied'
  | 'services_off'
  | 'starting'
  | 'sharing'
  | 'paused'
  | 'error';

type LocationContextValue = {
  /** Should the rider be sharing right now (online or on a delivery)? */
  wanted: boolean;
  permission: PermissionState;
  canAskAgain: boolean;
  state: SharingState;
  /** When the backend last accepted a ping (ms epoch). */
  lastSentAt: number | null;
  /** Short human explanation for paused / error states. */
  message: string | null;
  requestPermission: () => Promise<boolean>;
  refreshPermission: () => Promise<void>;
  openSettings: () => void;
};

const LocationContext = createContext<LocationContextValue>({} as LocationContextValue);

export function LocationProvider({ children }: { children: ReactNode }) {
  const dispatch = useAppDispatch();
  const { status, mustChangePassword } = useSession();
  const enabled = status === 'signedIn' && !mustChangePassword;

  const me = useRiderMeQuery(undefined, { skip: !enabled });
  const active = useAssignedDeliveriesQuery({ active: true }, { skip: !enabled });

  const isAvailable = Boolean(me.data?.rider.is_available);
  const activeCount = active.data?.length ?? me.data?.rider.active_count ?? 0;
  const wanted = enabled && (isAvailable || activeCount > 0);
  const interval = Math.max(me.data?.location_interval_seconds ?? 30, 10);
  const minInterval = Math.max(me.data?.min_location_interval_seconds ?? 10, 5);

  const [permission, setPermission] = useState<PermissionState>('unknown');
  const [canAskAgain, setCanAskAgain] = useState(true);
  const [servicesOn, setServicesOn] = useState(true);
  const [appActive, setAppActive] = useState(AppState.currentState === 'active');
  // A pause from the server lasts until the rider's duty state changes: it is
  // remembered together with the duty state it was received in.
  const dutyKey = `${isAvailable}:${activeCount}`;
  const [pause, setPause] = useState<{ reason: 'not_on_duty' | 'inactive'; dutyKey: string } | null>(null);
  const pausedReason = pause && pause.dutyKey === dutyKey ? pause.reason : null;
  const [running, setRunning] = useState<'starting' | 'sharing' | 'error'>('starting');
  const [lastSentAt, setLastSentAt] = useState<number | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const applyPermission = useCallback((p: Location.LocationPermissionResponse) => {
    setPermission(p.granted ? 'granted' : p.status === 'denied' ? 'denied' : 'undetermined');
    setCanAskAgain(p.canAskAgain);
  }, []);

  const refreshPermission = useCallback(async () => {
    try {
      applyPermission(await Location.getForegroundPermissionsAsync());
      setServicesOn(await Location.hasServicesEnabledAsync());
    } catch {
      setPermission('undetermined');
    }
  }, [applyPermission]);

  const requestPermission = useCallback(async () => {
    try {
      const p = await Location.requestForegroundPermissionsAsync();
      applyPermission(p);
      setServicesOn(await Location.hasServicesEnabledAsync());
      return p.granted;
    } catch {
      return false;
    }
  }, [applyPermission]);

  // Permission can change in Settings while the app is away — re-check on return.
  useEffect(() => {
    // Deferred a tick so the first permission read is not a synchronous
    // state update inside the effect.
    const first = setTimeout(refreshPermission, 0);
    const sub = AppState.addEventListener('change', (next) => {
      setAppActive(next === 'active');
      if (next === 'active') refreshPermission();
    });
    return () => {
      clearTimeout(first);
      sub.remove();
    };
  }, [refreshPermission]);

  const shouldRun = wanted && permission === 'granted' && servicesOn && appActive && pausedReason === null;

  const latest = useRef<Location.LocationObject | null>(null);

  useEffect(() => {
    if (!shouldRun) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let watch: Location.LocationSubscription | undefined;

    Location.watchPositionAsync(
      { accuracy: Location.Accuracy.High, timeInterval: 10_000, distanceInterval: 15 },
      (loc) => {
        latest.current = loc;
      },
    )
      .then((sub) => {
        if (cancelled) sub.remove();
        else watch = sub;
      })
      .catch(() => {});

    const schedule = (seconds: number) => {
      if (!cancelled) timer = setTimeout(tick, Math.max(seconds, minInterval) * 1000);
    };

    async function tick() {
      if (cancelled) return;
      let loc = latest.current;
      if (!loc || Date.now() - loc.timestamp > 60_000) {
        try {
          loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          latest.current = loc;
        } catch {
          loc = null;
        }
      }
      if (cancelled) return;
      if (!loc) {
        setRunning('error');
        setMessage('Waiting for a GPS fix…');
        schedule(interval);
        return;
      }

      const req = dispatch(
        riderApi.endpoints.sendLocation.initiate({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
          accuracy_m: loc.coords.accuracy ?? null,
          speed: loc.coords.speed != null && loc.coords.speed >= 0 ? loc.coords.speed : null,
          heading: loc.coords.heading != null && loc.coords.heading >= 0 ? loc.coords.heading : null,
          recorded_at: new Date(loc.timestamp).toISOString(),
        }),
      );
      try {
        const res = await req.unwrap();
        if (cancelled) return;
        if (res.accepted) {
          setLastSentAt(Date.now());
          setRunning('sharing');
          setMessage(null);
          schedule(interval);
        } else if (res.reason === 'too_frequent') {
          schedule(res.retry_after_seconds ?? minInterval);
        } else if (res.reason === 'not_on_duty' || res.reason === 'inactive') {
          setPause({ reason: res.reason, dutyKey });
        } else {
          setRunning('error');
          setMessage('Your GPS position looked wrong — trying again.');
          schedule(interval);
        }
      } catch (err) {
        if (cancelled) return;
        setRunning('error');
        setMessage(isNetworkError(err) ? 'No connection — will retry.' : 'Could not send your location — will retry.');
        schedule(interval);
      } finally {
        req.reset();
      }
    }

    tick();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
      watch?.remove();
      // Next run starts fresh.
      setRunning('starting');
      setMessage(null);
    };
  }, [shouldRun, interval, minInterval, dispatch, dutyKey]);

  const state: SharingState = !wanted
    ? 'off'
    : permission === 'denied'
      ? 'denied'
      : permission !== 'granted'
        ? 'needs_permission'
        : !servicesOn
          ? 'services_off'
          : pausedReason !== null
            ? 'paused'
            : running;

  const value = useMemo<LocationContextValue>(
    () => ({
      wanted,
      permission,
      canAskAgain,
      state,
      lastSentAt,
      message:
        state === 'paused'
          ? pausedReason === 'inactive'
            ? 'Your rider account is inactive.'
            : 'Paused — go online to share your location.'
          : state === 'services_off'
            ? 'Location services are turned off on this phone.'
            : message,
      requestPermission,
      refreshPermission,
      openSettings: () => {
        Linking.openSettings().catch(() => {});
      },
    }),
    [wanted, permission, canAskAgain, state, lastSentAt, pausedReason, message, requestPermission, refreshPermission],
  );

  return <LocationContext.Provider value={value}>{children}</LocationContext.Provider>;
}

export function useLocationSharing() {
  return useContext(LocationContext);
}

export const useLocation = useLocationSharing;
