/**
 * Rider-side helpers for deliveries: stage copy, timeline, time formatting,
 * and the call / WhatsApp / navigation hand-offs to other apps.
 */
import type Ionicons from '@expo/vector-icons/Ionicons';
import { Linking, Platform } from 'react-native';

import type { TimelineStep } from '@/components/ui';
import type { DeliveryStatus, RiderDelivery, RiderStage } from '@/store/rider-api';

/** Statuses the rider still holds (counts towards their active load). */
export const RIDER_ACTIVE: ReadonlySet<DeliveryStatus> = new Set([
  'assigned',
  'travelling_to_pickup',
  'picked_up',
  'in_transit',
]);

/** Copy for the button that moves a delivery into `stage`. */
export const STAGE_ACTIONS: Record<
  RiderStage,
  { label: string; icon: keyof typeof Ionicons.glyphMap; confirm: string; done: string }
> = {
  travelling_to_pickup: {
    label: 'Start trip to pickup',
    icon: 'bicycle-outline',
    confirm: 'The store will be told you are on your way.',
    done: 'Trip started — head to the pickup',
  },
  picked_up: {
    label: 'Confirm pickup',
    icon: 'cube-outline',
    confirm: 'Confirm you have collected every item from the store. The retailer gets their delivery code now.',
    done: 'Pickup confirmed',
  },
  in_transit: {
    label: 'Start delivery',
    icon: 'navigate-outline',
    confirm: 'You are now heading to the retailer. Your live location is shared with them.',
    done: 'On the way to the retailer',
  },
  delivered: {
    label: 'Complete delivery',
    icon: 'checkmark-circle-outline',
    confirm: '',
    done: 'Delivered',
  },
};

export function shortTime(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

/** "Today · 14:05", "Yesterday · 09:12" or "12 Oct · 09:12". */
export function dayTime(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  const time = shortTime(iso);
  if (d.toDateString() === today.toDateString()) return `Today · ${time}`;
  if (d.toDateString() === yesterday.toDateString()) return `Yesterday · ${time}`;
  return `${d.toLocaleDateString([], { day: 'numeric', month: 'short' })} · ${time}`;
}

export function isToday(iso: string | null | undefined): boolean {
  if (!iso) return false;
  return new Date(iso).toDateString() === new Date().toDateString();
}

/** "12s ago", "3 min ago", "2 h ago". */
export function ago(fromMs: number, nowMs = Date.now()): string {
  const s = Math.max(0, Math.round((nowMs - fromMs) / 1000));
  if (s < 60) return `${s}s ago`;
  const m = Math.round(s / 60);
  if (m < 60) return `${m} min ago`;
  return `${Math.round(m / 60)} h ago`;
}

/** "Due 14:30" / "Late by 12 min" for the expected delivery time. */
export function expectedLabel(d: Pick<RiderDelivery, 'expected_delivery_at' | 'is_delayed'>): string {
  if (!d.expected_delivery_at) return '';
  if (d.is_delayed) {
    const mins = Math.max(1, Math.round((Date.now() - new Date(d.expected_delivery_at).getTime()) / 60000));
    return `Late by ${mins} min`;
  }
  return `Due ${shortTime(d.expected_delivery_at)}`;
}

export function dropoffAddress(d: Pick<RiderDelivery, 'dropoff'>): string {
  const x = d.dropoff;
  return x.address || [x.line1, x.city, x.state].filter(Boolean).join(', ');
}

/** The rider's stage timeline, built from the stage timestamps. */
export function stageTimeline(d: RiderDelivery): TimelineStep[] {
  const failed = d.status === 'failed' || d.status === 'cancelled' || d.status === 'returned';
  const steps: { title: string; at: string | null; description?: string }[] = [
    { title: 'Assigned to you', at: d.assigned_at },
    { title: 'Heading to pickup', at: d.travelling_to_pickup_at, description: d.pickup.name || undefined },
    { title: 'Picked up', at: d.picked_up_at },
    { title: 'Delivered', at: d.delivered_at, description: d.recipient_name ? `Received by ${d.recipient_name}` : undefined },
  ];
  const lastDone = steps.reduce((acc, s, i) => (s.at ? i : acc), -1);
  const out: TimelineStep[] = steps.map((s, i) => ({
    title: s.title,
    description: s.description,
    timestamp: s.at ? dayTime(s.at) : undefined,
    state: s.at ? 'done' : !failed && i === lastDone + 1 ? 'current' : 'upcoming',
  }));
  if (d.status === 'in_transit' && out[3]) out[3] = { ...out[3], description: 'On the way to the retailer' };
  if (d.confirmation) {
    out.push({
      title: d.confirmation.outcome_display || 'Confirmed',
      description: d.confirmation.auto_confirmed ? 'Auto-confirmed' : 'Confirmed by the retailer',
      timestamp: dayTime(d.confirmation.confirmed_at),
      state: 'done',
    });
  }
  if (failed) {
    out.push({ title: d.status_display, timestamp: dayTime(d.closed_at), state: 'failed' });
  }
  return out;
}

// ── Contact + navigation hand-offs ──────────────────────────────────────────

/** Digits only, Nigerian local numbers (0803…) turned into 234803…. */
export function internationalDigits(phone: string): string {
  let digits = phone.replace(/[^\d]/g, '');
  if (digits.startsWith('00')) digits = digits.slice(2);
  if (digits.length === 11 && digits.startsWith('0')) digits = `234${digits.slice(1)}`;
  return digits;
}

export async function callPhone(phone: string): Promise<boolean> {
  const dial = phone.replace(/[^\d+]/g, '');
  if (!dial) return false;
  return Linking.openURL(`tel:${dial}`).then(
    () => true,
    () => false,
  );
}

export async function openWhatsApp(phone: string, text?: string): Promise<boolean> {
  const digits = internationalDigits(phone);
  if (!digits) return false;
  const q = text ? `?text=${encodeURIComponent(text)}` : '';
  return Linking.openURL(`https://wa.me/${digits}${q}`).then(
    () => true,
    () => false,
  );
}

type NavTarget = { latitude: number | null; longitude: number | null; address: string; label?: string };

/**
 * Turn-by-turn directions: Google Maps when installed (Android always has it),
 * otherwise Apple Maps on iOS, otherwise Google Maps on the web. Coordinates
 * when the backend has them, else the address text.
 */
export async function openNavigation(target: NavTarget): Promise<boolean> {
  const hasCoords = target.latitude != null && target.longitude != null;
  const dest = hasCoords ? `${target.latitude},${target.longitude}` : target.address.trim();
  if (!dest) return false;
  const q = encodeURIComponent(dest);
  const web = `https://www.google.com/maps/dir/?api=1&destination=${q}&travelmode=driving`;

  const tryOpen = async (url: string, check = true) => {
    try {
      if (check && !(await Linking.canOpenURL(url))) return false;
      await Linking.openURL(url);
      return true;
    } catch {
      return false;
    }
  };

  if (Platform.OS === 'android') {
    if (await tryOpen(`google.navigation:q=${q}`, false)) return true;
    return tryOpen(web, false);
  }
  if (Platform.OS === 'ios') {
    if (await tryOpen(`comgooglemaps://?daddr=${q}&directionsmode=driving`)) return true;
    if (await tryOpen(`maps://?daddr=${q}&dirflg=d`, false)) return true;
  }
  return tryOpen(web, false);
}
