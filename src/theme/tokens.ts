/**
 * KOOL Logistics design tokens.
 * Every value here is platform-neutral on purpose: the app must render
 * identically on iOS and Android, so nothing is Platform.select-ed except
 * font *loading* (the family names themselves are identical everywhere).
 */

/**
 * Colours follow the Koolboks Sales CRM (its DESIGN.md §1–3): white surfaces on
 * a #F8F9FA page, #E9ECEF hairlines, charcoal text and primary buttons, and
 * Koolboks orange as the accent — links, active states, one key action.
 */
export const Palette = {
  orange: '#F57E16',
  orangeDark: '#DC6C0B',
  orangeLight: '#FF9640',
  orangeSoft: '#FEF1E6',
  /** Orange for text on white (4.7:1); pure orange is for fills and icons. */
  orangeText: '#B85A0A',
  charcoal: '#050711',

  white: '#FFFFFF',
  black: '#0B0B0C',

  grey50: '#F8F9FA',
  grey100: '#F1F3F5',
  grey200: '#E9ECEF',
  grey300: '#DEE2E6',
  grey400: '#ADB5BD',
  grey500: '#6C757D',
  grey600: '#495057',
  grey700: '#343A40',
  grey800: '#1E293B',
  grey900: '#0F172A',

  green: '#6C8B7D',
  greenSoft: '#EEF3F0',
  red: '#DC3545',
  redSoft: '#FCEBED',
  blue: '#3B6FB6',
  blueSoft: '#EAF1FA',
  amber: '#D18707',
  amberSoft: '#FFF6E4',
} as const;

/**
 * Width-to-height of the official wordmark. Both colour variants are cut from
 * the same artwork, so one ratio covers light and dark.
 */
export const LogoRatio = 2.8241;

export type ThemeMode = 'light' | 'dark';

export type ThemeColors = {
  /** Charcoal: primary (filled) buttons and the strongest text. */
  primary: string;
  primaryPressed: string;
  onPrimary: string;

  brand: string;
  /** Orange text on surfaces (links, small labels). */
  brandText: string;
  brandPressed: string;
  brandSoft: string;
  onBrand: string;

  background: string;
  surface: string;
  surfaceAlt: string;
  surfaceSunken: string;

  text: string;
  textSecondary: string;
  textMuted: string;
  onDark: string;

  border: string;
  borderStrong: string;

  success: string;
  successSoft: string;
  danger: string;
  dangerSoft: string;
  info: string;
  infoSoft: string;
  warning: string;
  warningSoft: string;

  overlay: string;
  glassTint: string;
  skeleton: string;

  /** Recessed track behind a moving control (switch, segmented). */
  controlTrack: string;
  /** The moving element itself — must stay clearly lighter than the track. */
  controlThumb: string;
};

export const Themes: Record<ThemeMode, ThemeColors> = {
  light: {
    primary: Palette.charcoal,
    primaryPressed: Palette.grey700,
    onPrimary: Palette.white,

    brand: Palette.orange,
    brandText: Palette.orangeText,
    brandPressed: Palette.orangeDark,
    brandSoft: Palette.orangeSoft,
    onBrand: Palette.white,

    background: Palette.grey50,
    surface: Palette.white,
    surfaceAlt: Palette.grey50,
    surfaceSunken: Palette.grey100,

    text: Palette.charcoal,
    textSecondary: Palette.grey600,
    textMuted: Palette.grey500,
    onDark: Palette.white,

    border: Palette.grey200,
    borderStrong: Palette.grey300,

    success: Palette.green,
    successSoft: Palette.greenSoft,
    danger: Palette.red,
    dangerSoft: Palette.redSoft,
    info: Palette.blue,
    infoSoft: Palette.blueSoft,
    warning: Palette.amber,
    warningSoft: Palette.amberSoft,

    overlay: 'rgba(5,7,17,0.45)',
    glassTint: 'rgba(255,255,255,0.72)',
    skeleton: Palette.grey200,

    controlTrack: '#EDEEF1',
    controlThumb: '#FFFFFF',
  },
  dark: {
    primary: '#F1F5F9',
    primaryPressed: '#CBD5E1',
    onPrimary: Palette.charcoal,

    brand: Palette.orange,
    brandText: Palette.orange,
    brandPressed: Palette.orangeLight,
    brandSoft: 'rgba(253,121,1,0.16)',
    onBrand: Palette.white,

    background: '#0B1120',
    surface: Palette.grey900,
    surfaceAlt: Palette.grey800,
    surfaceSunken: '#0B1120',

    text: Palette.white,
    textSecondary: Palette.grey400,
    textMuted: Palette.grey500,
    onDark: Palette.white,

    border: '#334155',
    borderStrong: '#475569',

    success: '#8FB3A3',
    successSoft: 'rgba(108,139,125,0.2)',
    danger: '#F0707D',
    dangerSoft: 'rgba(220,53,69,0.18)',
    info: '#4CA6F5',
    infoSoft: 'rgba(11,127,224,0.18)',
    warning: '#FFC155',
    warningSoft: 'rgba(245,165,36,0.18)',

    overlay: 'rgba(0,0,0,0.6)',
    glassTint: 'rgba(28,30,35,0.72)',
    skeleton: Palette.grey800,

    // Deliberately lifted off `surface` (#131519): the previous
    // surfaceSunken/surface pairing was 4 points apart and read as invisible.
    controlTrack: '#334155',
    controlThumb: '#64748B',
  },
};

/** 4pt spacing scale. */
export const Spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

/** CRM radius: 12px for buttons, inputs and cards (`md`); pill only for chips, avatars and toggles. */
export const Radius = {
  xs: 6,
  sm: 8,
  md: 12,
  lg: 12,
  xl: 16,
  xxl: 20,
  pill: 999,
} as const;

/** Font family names registered by loadAppFonts(). Identical on all platforms. */
export const FontFamily = {
  regular: 'WorkSans_400Regular',
  medium: 'WorkSans_500Medium',
  semibold: 'WorkSans_600SemiBold',
  bold: 'WorkSans_700Bold',
} as const;

export const FontSize = {
  xs: 11,
  sm: 12,
  base: 14,
  md: 15,
  lg: 17,
  xl: 20,
  xxl: 24,
  xxxl: 30,
  display: 36,
} as const;

/**
 * Cross-platform elevation. iOS reads shadow*, Android reads elevation —
 * both are always supplied so a surface never looks flat on one platform.
 */
/**
 * Slate "liquid glass" — the dashboard duty card and the live notification
 * banner. Softer than charcoal; the same in light and dark mode.
 */
export const SlateGlass = {
  gradient: ['#3B4658', '#2C3545', '#232B39'] as const,
  text: '#FFFFFF',
  muted: 'rgba(255,255,255,0.72)',
  line: 'rgba(255,255,255,0.14)',
  pane: 'rgba(255,255,255,0.09)',
  edge: 'rgba(255,255,255,0.22)',
  sheen: ['rgba(255,255,255,0.16)', 'rgba(255,255,255,0.03)', 'rgba(255,255,255,0)'] as const,
};

export const Elevation = {
  none: { shadowOpacity: 0, elevation: 0 },
  // CRM: soft only, e.g. 0 2px 8px rgba(0,0,0,.06). No heavy drop shadows.
  sm: {
    shadowColor: '#050711',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  md: {
    shadowColor: '#050711',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOpacity: 0.16,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 12 },
    elevation: 14,
  },
} as const;

/** Shared motion language. */
export const Motion = {
  fast: 140,
  base: 220,
  slow: 340,
  spring: { damping: 18, stiffness: 190, mass: 0.9 },
  springSoft: { damping: 22, stiffness: 130, mass: 1 },
} as const;

export const Layout = {
  screenPadding: Spacing.lg,
  maxContentWidth: 620,
  /** CRM input height; also the standard button (comfortable touch target). */
  controlHeight: 48,
  controlHeightSm: 40,
} as const;
