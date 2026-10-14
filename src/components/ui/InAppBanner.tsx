import { LinearGradient } from 'expo-linear-gradient';
import { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';

import { ChevronMarkIcon } from '@/components/icons';
import { Glyph, type GlyphName } from '@/components/icons/Glyph';
import { Elevation, FontFamily, Radius, SlateGlass, Spacing } from '@/theme';
import { Text } from './Text';

export type InAppBannerItem = {
  id: string;
  title: string;
  message?: string;
  tone?: 'brand' | 'danger' | 'info' | 'success';
  icon?: GlyphName;
  /** Small button under the message, e.g. "View delivery". The whole card is tappable either way. */
  actionLabel?: string;
};

/** Bright accents that read on the slate glass. */
const TONES = {
  brand: '#F57E16',
  danger: '#FF6B6B',
  info: '#5CC8F5',
  success: '#3DDC97',
} as const;

/** Swiped-away position. */
const HIDDEN_Y = -180;
/**
 * Entrance starts only a little above the resting place, fully visible: if the
 * animation is ever slow or stalls (a busy JS thread, a backgrounded screen),
 * the notification is still readable — never stuck off-screen.
 */
const ENTER_Y = -16;

/**
 * Live heads-up notification (new assignment, cancellation, reassignment, a
 * new notification): a slate liquid-glass card that springs down from the
 * top, with the KOOL mark, a toned icon badge, an action, and a bar showing
 * how long it stays. Tap to open; swipe up or ✕ to dismiss.
 */
export function InAppBanner({
  item,
  onPress,
  onDismiss,
  durationMs = 6000,
}: {
  item: InAppBannerItem | null;
  onPress?: () => void;
  onDismiss: () => void;
  durationMs?: number;
}) {
  const insets = useSafeAreaInsets();
  if (!item) return null;
  return (
    <View style={[styles.host, { top: insets.top + Spacing.sm }]} pointerEvents="box-none">
      <BannerCard key={item.id} item={item} onPress={onPress} onDismiss={onDismiss} durationMs={durationMs} />
    </View>
  );
}

function BannerCard({
  item,
  onPress,
  onDismiss,
  durationMs,
}: {
  item: InAppBannerItem;
  onPress?: () => void;
  onDismiss: () => void;
  durationMs: number;
}) {
  const accent = TONES[item.tone ?? 'brand'];
  const y = useSharedValue(ENTER_Y);
  const drag = useSharedValue(0);
  const life = useSharedValue(1);

  useEffect(() => {
    y.value = withSpring(0, { damping: 14, stiffness: 260, mass: 0.8 });
    life.value = withTiming(0, { duration: durationMs, easing: Easing.linear });
  }, [y, life, durationMs]);

  // Swipe up to dismiss; a small pull down just rubber-bands.
  const pan = Gesture.Pan()
    .activeOffsetY([-6, 6])
    .onUpdate((e) => {
      drag.value = e.translationY < 0 ? e.translationY : e.translationY * 0.2;
    })
    .onEnd((e) => {
      if (e.translationY < -40 || e.velocityY < -500) {
        y.value = withTiming(HIDDEN_Y, { duration: 180 }, (done) => {
          if (done) runOnJS(onDismiss)();
        });
      } else {
        drag.value = withSpring(0, { damping: 16, stiffness: 240 });
      }
    });

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: y.value + drag.value }],
    opacity: 1 + Math.min(0, drag.value) / 160,
  }));
  const barStyle = useAnimatedStyle(() => ({ width: `${life.value * 100}%` }));

  return (
    <GestureDetector gesture={pan}>
      <Animated.View style={[styles.card, Elevation.lg, cardStyle]}>
        <LinearGradient colors={SlateGlass.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
        {/* Glow in the event's colour, behind the icon. */}
        <Svg style={StyleSheet.absoluteFill} width="100%" height="100%" pointerEvents="none">
          <Defs>
            <RadialGradient id="bannerGlow" cx="8%" cy="60%" rx="45%" ry="90%">
              <Stop offset="0" stopColor={accent} stopOpacity={0.38} />
              <Stop offset="1" stopColor={accent} stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Rect width="100%" height="100%" fill="url(#bannerGlow)" />
        </Svg>
        <LinearGradient colors={SlateGlass.sheen} locations={[0, 0.45, 1]} style={styles.sheen} pointerEvents="none" />

        <Pressable accessibilityRole="button" accessibilityLabel={`${item.title}. ${item.message ?? ''}`} onPress={onPress} style={styles.body}>
          <View style={styles.header}>
            <ChevronMarkIcon size={14} color={TONES.brand} />
            <Text variant="caption" style={styles.app}>
              KOOL Logistics
            </Text>
            <Text variant="caption" style={styles.when}>
              · now
            </Text>
            <View style={{ flex: 1 }} />
            <Pressable accessibilityRole="button" accessibilityLabel="Dismiss" hitSlop={12} onPress={onDismiss} style={styles.close}>
              <Glyph name="close" size={14} color={SlateGlass.muted} />
            </Pressable>
          </View>

          <View style={styles.main}>
            <View style={[styles.badge, { backgroundColor: accent, shadowColor: accent }]}>
              <Glyph name={item.icon ?? 'notifications-outline'} size={20} color="#FFFFFF" />
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <Text variant="bodyStrong" style={{ color: SlateGlass.text }} numberOfLines={1}>
                {item.title}
              </Text>
              {item.message ? (
                <Text variant="caption" style={{ color: SlateGlass.muted }} numberOfLines={2}>
                  {item.message}
                </Text>
              ) : null}
            </View>
          </View>

          {item.actionLabel ? (
            <View style={styles.actionRow}>
              <View style={styles.action}>
                <Text style={styles.actionText}>{item.actionLabel}</Text>
                <Glyph name="arrow-forward" size={13} color="#0F172A" />
              </View>
            </View>
          ) : null}
        </Pressable>

        <View style={styles.track}>
          <Animated.View style={[styles.bar, { backgroundColor: accent }, barStyle]} />
        </View>
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  host: { position: 'absolute', left: Spacing.md, right: Spacing.md, zIndex: 200, alignItems: 'center' },
  card: {
    width: '100%',
    maxWidth: 520,
    borderRadius: Radius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: SlateGlass.edge,
    backgroundColor: SlateGlass.gradient[1],
  },
  sheen: { position: 'absolute', top: 0, left: 0, right: 0, height: '60%' },
  body: { padding: Spacing.md, paddingBottom: Spacing.md + 2, gap: Spacing.sm },
  header: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  app: { color: SlateGlass.text, fontFamily: FontFamily.semibold, fontSize: 12 },
  when: { color: SlateGlass.muted, fontSize: 12 },
  close: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: SlateGlass.pane,
  },
  main: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  badge: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOpacity: 0.5,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  actionRow: { flexDirection: 'row', paddingLeft: 44 + Spacing.md },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
  },
  actionText: { color: '#0F172A', fontFamily: FontFamily.semibold, fontSize: 12 },
  track: { height: 3, backgroundColor: SlateGlass.pane },
  bar: { height: 3 },
});
