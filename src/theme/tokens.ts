/**
 * KOOL Logistics design tokens.
 * Every value here is platform-neutral on purpose: the app must render
 * identically on iOS and Android, so nothing is Platform.select-ed except
 * font *loading* (the family names themselves are identical everywhere).
 */

export const Palette = {
  orange: '#F57D1C',
  orangeDark: '#D96A0F',
  orangeLight: '#FF9640',
  orangeSoft: '#FEF1E4',
  charcoal: '#333333',

  white: '#FFFFFF',
  black: '#0B0B0C',

  grey50: '#F7F8F9',
  grey100: '#F0F1F3',
  grey200: '#E3E5E9',
  grey300: '#CDD1D8',
  grey400: '#A0A6B1',
  grey500: '#6F7581',
  grey600: '#4C525C',
  grey700: '#33383F',
  grey800: '#1F2227',
  grey900: '#131519',

  green: '#12A150',
  greenSoft: '#E6F7ED',
  red: '#E5484D',
  redSoft: '#FDECEC',
  blue: '#0B7FE0',
  blueSoft: '#E6F2FD',
  amber: '#F5A524',
  amberSoft: '#FFF6E5',
} as const;

/**
 * Width-to-height of the official wordmark. Both colour variants are cut from
 * the same artwork, so one ratio covers light and dark.
 */
export const LogoRatio = 2.8241;

export type ThemeMode = 'light' | 'dark';

export type ThemeColors = {
  brand: string;
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
    brand: Palette.orange,
    brandPressed: Palette.orangeDark,
    brandSoft: Palette.orangeSoft,
    onBrand: Palette.white,

    background: Palette.white,
    surface: Palette.white,
    surfaceAlt: Palette.grey50,
    surfaceSunken: Palette.grey100,

    text: Palette.grey900,
    textSecondary: Palette.grey500,
    textMuted: Palette.grey400,
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

    overlay: 'rgba(11,11,12,0.45)',
    glassTint: 'rgba(255,255,255,0.72)',
    skeleton: Palette.grey200,

    controlTrack: '#EDEEF1',
    controlThumb: '#FFFFFF',
  },
  dark: {
    brand: Palette.orange,
    brandPressed: Palette.orangeLight,
    brandSoft: 'rgba(253,121,1,0.16)',
    onBrand: Palette.white,

    background: Palette.black,
    surface: Palette.grey900,
    surfaceAlt: Palette.grey800,
    surfaceSunken: '#0F1114',

    text: Palette.white,
    textSecondary: Palette.grey400,
    textMuted: Palette.grey500,
    onDark: Palette.white,

    border: '#262A31',
    borderStrong: '#343A43',

    success: '#3ECF7C',
    successSoft: 'rgba(18,161,80,0.18)',
    danger: '#FF6369',
    dangerSoft: 'rgba(229,72,77,0.18)',
    info: '#4CA6F5',
    infoSoft: 'rgba(11,127,224,0.18)',
    warning: '#FFC155',
    warningSoft: 'rgba(245,165,36,0.18)',

    overlay: 'rgba(0,0,0,0.6)',
    glassTint: 'rgba(28,30,35,0.72)',
    skeleton: Palette.grey800,

    // Deliberately lifted off `surface` (#131519): the previous
    // surfaceSunken/surface pairing was 4 points apart and read as invisible.
    controlTrack: '#262A31',
    controlThumb: '#3A414B',
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

export const Radius = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
  xxl: 32,
  pill: 999,
} as const;

/** Font family names registered by loadAppFonts(). Identical on all platforms. */
export const FontFamily = {
  regular: 'Poppins_400Regular',
  medium: 'Poppins_500Medium',
  semibold: 'Poppins_600SemiBold',
  bold: 'Poppins_700Bold',
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
export const Elevation = {
  none: { shadowOpacity: 0, elevation: 0 },
  sm: {
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
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
  controlHeight: 56,
  controlHeightSm: 40,
} as const;
