import { Text as RNText, StyleSheet, type TextProps as RNTextProps } from 'react-native';

import { FontFamily, FontSize, useColors } from '@/theme';

export type TextVariant =
  | 'display'
  | 'title'
  | 'heading'
  | 'subheading'
  | 'body'
  | 'bodyStrong'
  | 'caption'
  | 'label'
  | 'mono';

export type TextTone = 'default' | 'secondary' | 'muted' | 'brand' | 'success' | 'danger' | 'onBrand';

export type AppTextProps = RNTextProps & {
  variant?: TextVariant;
  tone?: TextTone;
  center?: boolean;
};

const VARIANTS: Record<TextVariant, { fontFamily: string; fontSize: number; lineHeight: number; letterSpacing?: number }> = {
  display: { fontFamily: FontFamily.bold, fontSize: FontSize.display, lineHeight: 44, letterSpacing: -0.6 },
  title: { fontFamily: FontFamily.bold, fontSize: FontSize.xxl, lineHeight: 32, letterSpacing: -0.3 },
  heading: { fontFamily: FontFamily.semibold, fontSize: FontSize.xl, lineHeight: 28, letterSpacing: -0.2 },
  subheading: { fontFamily: FontFamily.semibold, fontSize: FontSize.lg, lineHeight: 24 },
  body: { fontFamily: FontFamily.regular, fontSize: FontSize.base, lineHeight: 21 },
  bodyStrong: { fontFamily: FontFamily.medium, fontSize: FontSize.base, lineHeight: 21 },
  caption: { fontFamily: FontFamily.regular, fontSize: FontSize.sm, lineHeight: 17 },
  // Small section title, sentence case (the CRM has no ALL-CAPS eyebrows).
  label: { fontFamily: FontFamily.semibold, fontSize: 13, lineHeight: 18 },
  mono: { fontFamily: FontFamily.medium, fontSize: FontSize.base, lineHeight: 20, letterSpacing: 0.4 },
};

export function Text({ variant = 'body', tone = 'default', center, style, ...rest }: AppTextProps) {
  const c = useColors();
  const toneColor = {
    default: c.text,
    secondary: c.textSecondary,
    muted: c.textMuted,
    // Orange text uses the deeper shade so it stays readable on white (CRM §1).
    brand: c.brandText,
    success: c.success,
    danger: c.danger,
    onBrand: c.onBrand,
  }[tone];

  return (
    <RNText
      style={[VARIANTS[variant], { color: toneColor }, center && styles.center, style]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({ center: { textAlign: 'center' } });
