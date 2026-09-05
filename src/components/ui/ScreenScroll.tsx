import { useCallback, useState, type ReactNode } from 'react';
import {
  RefreshControl,
  StyleSheet,
  View,
  type RefreshControlProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Layout, Spacing, useColors } from '@/theme';
import { GlassBackButton } from './GlassBackButton';
import { GlassSurface } from './GlassSurface';
import { Text } from './Text';

/** Scroll offsets over which the inline title hands off to the sticky bar. */
const FADE_START = 28;
const FADE_END = 76;

export type ScreenScrollProps = {
  title: string;
  children: ReactNode;
  /** Omit on tab roots — a back button only belongs on inner screens. */
  onBack?: () => void;
  /** Action rendered beside the large inline title. */
  right?: ReactNode;
  contentContainerStyle?: StyleProp<ViewStyle>;
  /** Supply your own control, or use `onRefresh` for the standard one. */
  refreshControl?: React.ReactElement<RefreshControlProps>;
  /** Enables pull-to-refresh; the spinner is offset clear of the status bar. */
  onRefresh?: () => Promise<void> | void;
};

/**
 * Screen container with no header chrome at rest: the page shows a large
 * inline title, and as you scroll that title hands off to a compact glass bar
 * pinned to the top.
 */
export function ScreenScroll({
  title,
  children,
  onBack,
  right,
  contentContainerStyle,
  refreshControl,
  onRefresh,
}: ScreenScrollProps) {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const y = useSharedValue(0);
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    if (!onRefresh) return;
    setRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setRefreshing(false);
    }
  }, [onRefresh]);

  const control =
    refreshControl ??
    (onRefresh ? (
      <RefreshControl
        refreshing={refreshing}
        onRefresh={handleRefresh}
        tintColor={c.brand}
        colors={[c.brand]}
        // Without this the spinner lands under the status bar and is barely seen.
        progressViewOffset={insets.top + Spacing.sm}
      />
    ) : undefined);

  const onScroll = useAnimatedScrollHandler((e) => {
    y.value = e.contentOffset.y;
  });

  const barStyle = useAnimatedStyle(() => ({
    opacity: interpolate(y.value, [FADE_START, FADE_END], [0, 1], Extrapolation.CLAMP),
  }));

  // The inline title fades out as the bar takes over, so the two never
  // read as two titles at once.
  const inlineStyle = useAnimatedStyle(() => ({
    opacity: interpolate(y.value, [FADE_START, FADE_END], [1, 0], Extrapolation.CLAMP),
  }));

  return (
    <View style={{ flex: 1, backgroundColor: c.background }}>
      <Animated.ScrollView
        onScroll={onScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        refreshControl={control}
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + (onBack ? 60 : Spacing.base) },
          contentContainerStyle,
        ]}
      >
        <Animated.View style={[styles.titleRow, inlineStyle]}>
          <Text variant="title" style={{ flex: 1 }} numberOfLines={2}>
            {title}
          </Text>
          {right}
        </Animated.View>

        {children}
      </Animated.ScrollView>

      {/* Compact bar, revealed by scrolling */}
      <Animated.View pointerEvents="none" style={[styles.bar, barStyle]}>
        <GlassSurface
          radius={0}
          bordered={false}
          style={[styles.barInner, { paddingTop: insets.top + Spacing.md }]}
        >
          <Text
            variant="subheading"
            numberOfLines={1}
            style={{ textAlign: 'center', paddingHorizontal: onBack ? 56 : Spacing.base }}
          >
            {title}
          </Text>
        </GlassSurface>
        <View style={[styles.hairline, { backgroundColor: c.border }]} />
      </Animated.View>

      {/* Back button floats above the bar so it never fades out */}
      {onBack && (
        <GlassBackButton onPress={onBack} style={{ ...styles.back, top: insets.top + Spacing.xs }} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: Layout.screenPadding,
    paddingBottom: 160,
    gap: Spacing.xl,
    maxWidth: Layout.maxContentWidth,
    width: '100%',
    alignSelf: 'center',
  },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  bar: { position: 'absolute', top: 0, left: 0, right: 0 },
  barInner: { paddingBottom: Spacing.md, justifyContent: 'center' },
  hairline: { height: StyleSheet.hairlineWidth },
  back: { position: 'absolute', left: Layout.screenPadding },
});
