/**
 * Option lists for rider onboarding — the same values the logistics web's
 * "Onboard a rider" form stores (kool-logistics_web/components/riders/constants.ts).
 */
export const STATES = ['Lagos', 'Ogun', 'Oyo', 'FCT - Abuja', 'Rivers', 'Edo', 'Kano', 'Kaduna', 'Enugu', 'Anambra'];
export const ID_TYPES = ['National ID (NIN)', "Driver's License", 'International Passport', "Voter's Card"];
export const RIDER_TYPES = ['Full-time', 'Part-time', 'Contract'];
export const ZONES = ['Lagos Mainland', 'Lagos Island', 'Lekki / Ajah', 'Ikeja / GRA', 'Abuja Central', 'Ibadan'];
export const HOURS = ['Morning (6am – 12pm)', 'Afternoon (12pm – 6pm)', 'Evening (6pm – 11pm)', 'Flexible'];
export const AVAILABILITY = ['Weekdays', 'Weekends', 'All week'];
export const BANKS = ['Access Bank', 'First Bank', 'GTBank', 'Moniepoint', 'Opay', 'Providus Bank', 'UBA', 'Zenith Bank'];
export const PAYOUT = ['Bank transfer (daily)', 'Bank transfer (weekly)', 'Wallet'];

export const FLEXIBLE_HOURS = 'Flexible';
/** Hourly slots for a flexible working window: 12am … 11pm. */
export const TIME_SLOTS = Array.from({ length: 24 }, (_, h) => `${h % 12 || 12}${h < 12 ? 'am' : 'pm'}`);

/** "Flexible" + a custom window is stored as "Flexible (8am – 4pm)" (same as the web). */
export function formatWorkingHours(hours: string, from: string, to: string): string {
  return hours === FLEXIBLE_HOURS && from && to ? `${FLEXIBLE_HOURS} (${from} – ${to})` : hours;
}

export function parseWorkingHours(value: string | null | undefined): { hours: string; from: string; to: string } {
  const m = /^Flexible \((\S+) – (\S+)\)$/.exec(value ?? '');
  return m ? { hours: FLEXIBLE_HOURS, from: m[1], to: m[2] } : { hours: value ?? '', from: '', to: '' };
}

/** Turns a plain list into Select options. */
export const toOptions = (list: readonly string[]) => list.map((v) => ({ label: v, value: v }));
