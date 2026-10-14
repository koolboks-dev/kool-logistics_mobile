/**
 * Glyph drawings (data only — rendered by Glyph.tsx; also readable by plain
 * Node scripts). Grid 24×24, stroke 1.8, round caps and joins.
 */
export type GlyphPart =
  | { d: string; fill?: boolean }
  | { circle: readonly [number, number, number]; fill?: boolean; solid?: boolean }
  | { rect: readonly [number, number, number, number, number]; fill?: boolean };

/** A soft fill behind a stroke (filled variants). */
export const FILL_OPACITY = 0.16;

const circle = (extra: GlyphPart[], fill = false): GlyphPart[] => [{ circle: [12, 12, 9], fill }, ...extra];

export const GLYPHS = {
  // ── Navigation ────────────────────────────────────────────────────────────
  'arrow-back': [{ d: 'M19 12H5' }, { d: 'M11 6l-6 6 6 6' }],
  'arrow-forward': [{ d: 'M5 12h14' }, { d: 'M13 6l6 6-6 6' }],
  'arrow-forward-outline': [{ d: 'M5 12h14' }, { d: 'M13 6l6 6-6 6' }],
  'chevron-back': [{ d: 'M15 5l-7 7 7 7' }],
  'chevron-forward': [{ d: 'M9 5l7 7-7 7' }],
  'chevron-down': [{ d: 'M5 9l7 7 7-7' }],
  'chevron-up': [{ d: 'M5 15l7-7 7 7' }],
  close: [{ d: 'M6 6l12 12M18 6L6 18' }],
  'swap-horizontal-outline': [{ d: 'M4 8h15' }, { d: 'M15 4l4 4-4 4' }, { d: 'M20 16H5' }, { d: 'M9 12l-4 4 4 4' }],

  // ── Status ────────────────────────────────────────────────────────────────
  checkmark: [{ d: 'M5 12.5l4.5 4.5L19 7.5' }],
  'checkmark-done': [{ d: 'M2.5 12.5L7 17l9.5-9.5' }, { d: 'M12 16l1 1 9.5-9.5' }],
  'checkmark-circle': circle([{ d: 'M8 12.3l2.7 2.7L16.2 9.5' }], true),
  'checkmark-circle-outline': circle([{ d: 'M8 12.3l2.7 2.7L16.2 9.5' }]),
  'close-circle': circle([{ d: 'M9.2 9.2l5.6 5.6M14.8 9.2l-5.6 5.6' }], true),
  'close-circle-outline': circle([{ d: 'M9.2 9.2l5.6 5.6M14.8 9.2l-5.6 5.6' }]),
  'alert-circle': circle([{ d: 'M12 7.5v5.2' }, { circle: [12, 16.2, 0.6], solid: true }], true),
  'alert-circle-outline': circle([{ d: 'M12 7.5v5.2' }, { circle: [12, 16.2, 0.6], solid: true }]),
  'information-circle': circle([{ d: 'M12 11v5.2' }, { circle: [12, 7.8, 0.6], solid: true }], true),
  'information-circle-outline': circle([{ d: 'M12 11v5.2' }, { circle: [12, 7.8, 0.6], solid: true }]),
  'help-circle-outline': circle([{ d: 'M9.6 9.4a2.5 2.5 0 0 1 4.8.9c0 1.7-2.4 2.1-2.4 3.7' }, { circle: [12, 16.8, 0.6], solid: true }]),
  'warning-outline': [{ d: 'M10.3 4.4L3 17.2A2 2 0 0 0 4.7 20h14.6a2 2 0 0 0 1.7-2.8L13.7 4.4a2 2 0 0 0-3.4 0Z' }, { d: 'M12 9.5v4' }, { circle: [12, 16.7, 0.6], solid: true }],
  'time-outline': circle([{ d: 'M12 7.2V12l3.2 2' }]),
  'file-tray-outline': [{ d: 'M3.5 13.5l2.3-7.6A2 2 0 0 1 7.7 4.5h8.6a2 2 0 0 1 1.9 1.4l2.3 7.6v4a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2v-4Z' }, { d: 'M3.5 13.5h4.8l1.2 2.2h5l1.2-2.2h4.8' }],
  'cloud-offline-outline': [{ d: 'M7 18h10.5a4 4 0 0 0 1.1-7.8A6 6 0 0 0 8.2 7' }, { d: 'M5.2 9.3A4.3 4.3 0 0 0 7 18' }, { d: 'M3.5 3.5l17 17' }],

  // ── Delivery & places ─────────────────────────────────────────────────────
  'bicycle-outline': [
    { circle: [5.5, 15.5, 3.8] },
    { circle: [18.5, 15.5, 3.8] },
    { d: 'M5.5 15.5l3.6-7h6.2l3.2 7' },
    { d: 'M9.1 8.5l3.4 7h-7' },
    { d: 'M7.5 5.5h3.2' },
    { d: 'M13.8 5.5h2.4l-.9 3' },
  ],
  'cube-outline': [{ d: 'M12 2.8l8 4.4v9.6l-8 4.4-8-4.4V7.2l8-4.4Z' }, { d: 'M4 7.2l8 4.5 8-4.5' }, { d: 'M12 11.7v9.5' }],
  'location-outline': [{ d: 'M12 21s6.5-5.6 6.5-10.6a6.5 6.5 0 1 0-13 0C5.5 15.4 12 21 12 21Z' }, { circle: [12, 10.4, 2.4] }],
  'map-outline': [{ d: 'M3.5 6.5l5.5-2.3 6 2.3 5.5-2.3v13.3L15 19.8l-6-2.3-5.5 2.3V6.5Z' }, { d: 'M9 4.2v13.3M15 6.5v13.3' }],
  navigate: [{ d: 'M20.5 3.5L3.5 10.6l7.2 2.7 2.7 7.2 7.1-17Z', fill: true }],
  'navigate-outline': [{ d: 'M20.5 3.5L3.5 10.6l7.2 2.7 2.7 7.2 7.1-17Z' }],
  'navigate-circle': circle([{ d: 'M16.2 7.8l-7.6 3.2 3.2 1.2 1.2 3.2 3.2-7.6Z' }], true),
  'globe-outline': circle([{ d: 'M3 12h18' }, { d: 'M12 3c2.4 2.5 3.6 5.5 3.6 9s-1.2 6.5-3.6 9c-2.4-2.5-3.6-5.5-3.6-9S9.6 5.5 12 3Z' }]),
  'snow-outline': [{ d: 'M12 2.5v19M3.8 7.2l16.4 9.6M3.8 16.8l16.4-9.6' }, { d: 'M9.5 4.5L12 6.5l2.5-2M9.5 19.5L12 17.5l2.5 2' }],
  'construct-outline': [{ d: 'M20.4 6.9l-3.2 3.2-2.9-.4-.4-2.9 3.2-3.2a5 5 0 0 0-6.3 6.5l-6.7 6.7a2 2 0 0 0 2.8 2.8l6.7-6.7a5 5 0 0 0 6.8-6.9Z' }],

  // ── Scanning & media ──────────────────────────────────────────────────────
  'scan-outline': [{ d: 'M4 8V6a2 2 0 0 1 2-2h2M16 4h2a2 2 0 0 1 2 2v2M20 16v2a2 2 0 0 1-2 2h-2M8 20H6a2 2 0 0 1-2-2v-2' }, { d: 'M4 12h16' }],
  'qr-code-outline': [
    { rect: [3.5, 3.5, 6.5, 6.5, 1.2] },
    { rect: [14, 3.5, 6.5, 6.5, 1.2] },
    { rect: [3.5, 14, 6.5, 6.5, 1.2] },
    { d: 'M14 14h2.5v2.5H14zM18 18h2.5v2.5H18zM18 14h2.5M14 18v2.5' },
  ],
  'barcode-outline': [{ d: 'M4 6v12M7 6v12M10.5 6v12M13 6v12M16.5 6v12M20 6v12' }],
  'camera-outline': [{ d: 'M4 8a2 2 0 0 1 2-2h1.8l1.5-2h5.4l1.5 2H18a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8Z' }, { circle: [12, 13, 3.6] }],
  'image-outline': [{ rect: [3.5, 4.5, 17, 15, 2.5] }, { circle: [9, 9.8, 1.6] }, { d: 'M3.8 17l5.2-4.8 4 3.6 2.6-2.3 4.6 4' }],
  'images-outline': [{ rect: [6.5, 3.5, 14, 12.5, 2.2] }, { d: 'M3.5 8v10a2.5 2.5 0 0 0 2.5 2.5h11' }, { circle: [11, 7.8, 1.4] }, { d: 'M6.8 14l4.2-3.8 3 2.6 2-1.8 4.2 3.6' }],
  flash: [{ d: 'M13.5 2.8L5 13.5h6l-1 7.7 8.5-10.7h-6l1-7.7Z', fill: true }],
  'flash-outline': [{ d: 'M13.5 2.8L5 13.5h6l-1 7.7 8.5-10.7h-6l1-7.7Z' }],
  search: [{ circle: [10.8, 10.8, 6.8] }, { d: 'M20 20l-4.4-4.4' }],
  'search-outline': [{ circle: [10.8, 10.8, 6.8] }, { d: 'M20 20l-4.4-4.4' }],
  'eye-outline': [{ d: 'M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z' }, { circle: [12, 12, 3] }],
  'eye-off-outline': [{ d: 'M9.9 5.8A9.6 9.6 0 0 1 12 5.5c6 0 9.5 6.5 9.5 6.5a17 17 0 0 1-2.6 3.4M6.5 7.6A16.3 16.3 0 0 0 2.5 12S6 18.5 12 18.5c1.6 0 3-.4 4.2-1' }, { d: 'M9.9 9.9a3 3 0 0 0 4.2 4.2' }, { d: 'M3.5 3.5l17 17' }],

  // ── People & contact ──────────────────────────────────────────────────────
  'person-outline': [{ circle: [12, 8, 4] }, { d: 'M4.5 20.5c.9-3.8 3.9-6 7.5-6s6.6 2.2 7.5 6' }],
  'people-outline': [{ circle: [9, 8.5, 3.5] }, { d: 'M2.5 20c.8-3.4 3.4-5.4 6.5-5.4s5.7 2 6.5 5.4' }, { d: 'M15.5 5.3a3.5 3.5 0 0 1 0 6.4M17.6 14.8c2 .6 3.4 2.3 3.9 5.2' }],
  'call-outline': [{ d: 'M5 3.5h3l1.6 4.2-2 1.3a11 11 0 0 0 5.4 5.4l1.3-2 4.2 1.6v3a2 2 0 0 1-2.2 2A16.5 16.5 0 0 1 3 5.7a2 2 0 0 1 2-2.2Z' }],
  'mail-outline': [{ rect: [3, 5, 18, 14, 2.5] }, { d: 'M3.5 7l8.5 6 8.5-6' }],
  'logo-whatsapp': [{ d: 'M3.5 20.5l1.3-4.6a8.5 8.5 0 1 1 3.3 3.2l-4.6 1.4Z' }, { d: 'M9 8.3c.3 2.9 3.8 6.6 6.8 6.9l1-1.5-1.9-1-.9.9c-1.2-.5-2.3-1.6-2.8-2.8l.9-.9-1-1.9-1.5 1Z' }],
  'notifications-outline': [{ d: 'M6 16.5V11a6 6 0 0 1 12 0v5.5l1.5 2h-15l1.5-2Z' }, { d: 'M10 20.5a2.2 2.2 0 0 0 4 0' }],
  'notifications-off-outline': [{ d: 'M8.3 6.1A6 6 0 0 1 18 11v4.2M6 11v5.5l-1.5 2h13' }, { d: 'M10 20.5a2.2 2.2 0 0 0 4 0' }, { d: 'M3.5 3.5l17 17' }],

  // ── Account ───────────────────────────────────────────────────────────────
  'card-outline': [{ rect: [3, 5.5, 18, 13, 2.5] }, { d: 'M3 10h18M7 15h3' }],
  'key-outline': [{ circle: [8, 15.5, 4] }, { d: 'M10.9 12.6L20 3.5M16.5 7l2.5 2.5M14 9.5l2 2' }],
  'lock-closed-outline': [{ rect: [4.5, 10.5, 15, 10, 2.5] }, { d: 'M8 10.5V7.5a4 4 0 0 1 8 0v3' }, { d: 'M12 14.5v2' }],
  'log-out-outline': [{ d: 'M14 4.5H7a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h7' }, { d: 'M10.5 12H21M17.5 8.5L21 12l-3.5 3.5' }],
  'settings-outline': [
    { circle: [12, 12, 3] },
    { d: 'M12 2.8l1.6 2.3 2.8-.6.6 2.8 2.3 1.6-1.2 2.6 1.2 2.6-2.3 1.6-.6 2.8-2.8-.6L12 21.2l-1.6-2.3-2.8.6-.6-2.8-2.3-1.6L5.9 12 4.7 9.4 7 7.8l.6-2.8 2.8.6L12 2.8Z' },
  ],
} as const satisfies Record<string, readonly GlyphPart[]>;

export type GlyphName = keyof typeof GLYPHS;
