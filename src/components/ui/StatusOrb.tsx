import * as Haptics from 'expo-haptics';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Line, Path } from 'react-native-svg';

import { Motion, Spacing, useColors } from '@/theme';
import { Text } from './Text';

/**
 * Square viewBox re-centred on the disc (61.6089, 58.135) so the orbiting
 * overlay rotates about the disc centre rather than the artwork's bounding box.
 */
const VIEW_BOX = '0.6089 -2.865 122 122';
const CX = 61.6089;
const CY = 58.135;
const R = 50.8188;

/** Long arc that wraps most of the disc — from the brand artwork. */
const ARC_LONG =
  'M118.282 58.1399C118.282 65.6435 116.792 73.0723 113.898 79.9953C111.004 86.9184 106.764 93.1978 101.424 98.4691C96.0837 103.74 89.75 107.899 82.79 110.703C75.8301 113.507 68.3826 114.901 60.8797 114.804C53.3768 114.707 45.9679 113.12 39.0829 110.137C32.1979 107.154 25.9739 102.833 20.7721 97.4249C15.5703 92.0171 11.4943 85.6301 8.78063 78.6344C6.06693 71.6388 4.76956 64.1739 4.96382 56.6728L6.20778 56.7051C6.01779 64.0414 7.28666 71.3424 9.94078 78.1844C12.5949 85.0264 16.5814 91.2732 21.6689 96.5623C26.7565 101.851 32.8438 106.077 39.5776 108.995C46.3114 111.913 53.5577 113.464 60.8958 113.559C68.234 113.654 75.5179 112.291 82.325 109.549C89.1321 106.806 95.3268 102.739 100.55 97.5835C105.772 92.4279 109.919 86.2864 112.75 79.5154C115.58 72.7444 117.037 65.4787 117.037 58.1399H118.282Z';

/** Short arc at the top-left, closing the ring. */
const ARC_SHORT =
  'M12.6593 23.6102C18.3156 15.7349 25.898 9.44273 34.6811 5.33545C43.4643 1.22818 53.1544 -0.556779 62.8245 0.151316L62.7336 1.39237C53.2758 0.699824 43.7985 2.44559 35.2082 6.46267C26.618 10.4798 19.2021 16.6338 13.67 24.3361L12.6593 23.6102Z';

const SPARKLE_A =
  'M7.86259 38.3878C5.90273 37.8016 5.20548 37.0761 4.57217 35.0974C4.03926 36.8911 3.37332 37.6483 1.28174 38.3878C3.4012 39.2281 4.05927 39.9757 4.57217 41.6783C5.20445 39.921 5.92716 39.1832 7.86259 38.3878Z';
const SPARKLE_B =
  'M107.76 14.9899C105.8 14.4036 105.103 13.6782 104.47 11.6995C103.937 13.4931 103.271 14.2503 101.179 14.9899C103.299 15.8302 103.957 16.5777 104.47 18.2803C105.102 16.523 105.825 15.7852 107.76 14.9899Z';

const CHECK =
  'M52.4449 78.9803L34.9165 61.2106L38.727 57.3476L52.4449 71.2543L85.2152 38.0327L89.0258 41.8957L52.4449 78.9803Z';

export type OrbTone = 'success' | 'brand' | 'danger' | 'warning' | 'info';
export type OrbGlyph = 'check' | 'cross' | 'alert' | 'info' | 'clock';

const GLYPH_FOR: Record<OrbTone, OrbGlyph> = {
  success: 'check',
  brand: 'check',
  danger: 'cross',
  warning: 'alert',
  info: 'info',
};

/**
 * Large status mark: a filled disc with a glyph, wrapped by a ring and two
 * sparkles that orbit continuously. Traced from the brand artwork, so every
 * variant shares the same construction — only the colour and glyph change.
 */
export function StatusOrb({
  tone = 'success',
  glyph,
  size = 104,
  spin = true,
  haptic = true,
}: {
  tone?: OrbTone;
  glyph?: OrbGlyph;
  size?: number;
  /** Set false to hold the ring still (e.g. in a static list). */
  spin?: boolean;
  haptic?: boolean;
}) {
  const c = useColors();
  const disc = {
    success: c.success,
    brand: c.brand,
    danger: c.danger,
    warning: c.warning,
    info: c.info,
  }[tone];

  const mark = glyph ?? GLYPH_FOR[tone];

  const rotation = useSharedValue(0);
  const pop = useSharedValue(0);

  useEffect(() => {
    pop.value = withSequence(
      withSpring(1.08, { damping: 11, stiffness: 200 }),
      withSpring(1, Motion.spring),
    );
    if (haptic) {
      Haptics.notificationAsync(
        tone === 'danger'
          ? Haptics.NotificationFeedbackType.Error
          : tone === 'warning'
            ? Haptics.NotificationFeedbackType.Warning
            : Haptics.NotificationFeedbackType.Success,
      );
    }
  }, [pop, haptic, tone]);

  useEffect(() => {
    if (!spin) return;
    rotation.value = 0;
    rotation.value = withRepeat(
      withTiming(360, { duration: 5200, easing: Easing.linear }),
      -1,
      false,
    );
  }, [spin, rotation]);

  const discStyle = useAnimatedStyle(() => ({ transform: [{ scale: pop.value }] }));
  const ringStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${rotation.value}deg` }] }));

  return (
    <View style={{ width: size, height: size }}>
      {/* Orbiting ring + sparkles */}
      <Animated.View style={[StyleSheet.absoluteFill, ringStyle]} pointerEvents="none">
        <Svg width={size} height={size} viewBox={VIEW_BOX} fill="none">
          <Path d={ARC_LONG} fill={disc} />
          <Path d={ARC_SHORT} fill={disc} />
          <Path d={SPARKLE_A} fill={disc} />
          <Path d={SPARKLE_B} fill={disc} />
        </Svg>
      </Animated.View>

      {/* Disc + glyph */}
      <Animated.View style={[StyleSheet.absoluteFill, discStyle]} pointerEvents="none">
        <Svg width={size} height={size} viewBox={VIEW_BOX} fill="none">
          <Circle cx={CX} cy={CY} r={R} fill={disc} />
          {mark === 'check' && <Path d={CHECK} fill="#FFFFFF" />}
          {mark === 'cross' && (
            <>
              <Line x1={46} y1={42.5} x2={77} y2={73.5} stroke="#FFFFFF" strokeWidth={8} strokeLinecap="round" />
              <Line x1={77} y1={42.5} x2={46} y2={73.5} stroke="#FFFFFF" strokeWidth={8} strokeLinecap="round" />
            </>
          )}
          {mark === 'alert' && (
            <>
              <Line x1={CX} y1={34} x2={CX} y2={64} stroke="#FFFFFF" strokeWidth={8.5} strokeLinecap="round" />
              <Circle cx={CX} cy={79} r={4.9} fill="#FFFFFF" />
            </>
          )}
          {mark === 'info' && (
            <>
              <Circle cx={CX} cy={37} r={4.9} fill="#FFFFFF" />
              <Line x1={CX} y1={51} x2={CX} y2={81} stroke="#FFFFFF" strokeWidth={8.5} strokeLinecap="round" />
            </>
          )}
          {mark === 'clock' && (
            <>
              <Circle cx={CX} cy={CY} r={26} stroke="#FFFFFF" strokeWidth={6} fill="none" />
              <Line x1={CX} y1={CY} x2={CX} y2={39} stroke="#FFFFFF" strokeWidth={6} strokeLinecap="round" />
              <Line x1={CX} y1={CY} x2={78} y2={CY} stroke="#FFFFFF" strokeWidth={6} strokeLinecap="round" />
            </>
          )}
        </Svg>
      </Animated.View>
    </View>
  );
}

/** Orb with a heading and supporting copy — the delivered / cancelled screens. */
export function SuccessCheck({
  title,
  message,
  tone = 'success',
  glyph,
  size = 104,
}: {
  title?: string;
  message?: string;
  tone?: OrbTone;
  glyph?: OrbGlyph;
  size?: number;
}) {
  return (
    <View style={{ alignItems: 'center', gap: Spacing.base }}>
      <StatusOrb tone={tone} glyph={glyph} size={size} />
      {title && (
        <Text variant="heading" center>
          {title}
        </Text>
      )}
      {message && (
        <Text variant="body" tone="secondary" center style={{ maxWidth: 300 }}>
          {message}
        </Text>
      )}
    </View>
  );
}
