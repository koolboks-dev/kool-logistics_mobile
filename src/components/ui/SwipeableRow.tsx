import { Glyph, type GlyphName } from '@/components/icons/Glyph';
import * as Haptics from 'expo-haptics';
import { useRef, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import ReanimatedSwipeable, {
  type SwipeableMethods,
} from 'react-native-gesture-handler/ReanimatedSwipeable';
import Animated, { useAnimatedStyle, type SharedValue } from 'react-native-reanimated';

import { FontFamily, FontSize, Radius, Spacing, useColors } from '@/theme';

export type SwipeAction = {
  icon: GlyphName;
  label: string;
  color: string;
  onPress: () => void;
};

/**
 * Row with swipe actions on either side. Left-to-right reveals `leftAction`,
 * right-to-left reveals `rightAction`; both close themselves after firing.
 */
export function SwipeableRow({
  children,
  leftAction,
  rightAction,
  radius = Radius.lg,
}: {
  children: ReactNode;
  leftAction?: SwipeAction;
  rightAction?: SwipeAction;
  radius?: number;
}) {
  const ref = useRef<SwipeableMethods>(null);

  const fire = (action: SwipeAction) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    ref.current?.close();
    action.onPress();
  };

  const render =
    (action: SwipeAction, side: 'left' | 'right') =>
    (_progress: SharedValue<number>, translation: SharedValue<number>) => (
      <ActionPane action={action} side={side} translation={translation} radius={radius} onFire={() => fire(action)} />
    );

  return (
    <ReanimatedSwipeable
      ref={ref}
      friction={1.6}
      overshootFriction={8}
      leftThreshold={64}
      rightThreshold={64}
      renderLeftActions={leftAction ? render(leftAction, 'left') : undefined}
      renderRightActions={rightAction ? render(rightAction, 'right') : undefined}
      onSwipeableOpen={(direction) => {
        if (direction === 'left' && leftAction) fire(leftAction);
        if (direction === 'right' && rightAction) fire(rightAction);
      }}
      containerStyle={{ borderRadius: radius, overflow: 'hidden' }}
    >
      {children}
    </ReanimatedSwipeable>
  );
}

function ActionPane({
  action,
  side,
  translation,
  radius,
  onFire,
}: {
  action: SwipeAction;
  side: 'left' | 'right';
  translation: SharedValue<number>;
  radius: number;
  onFire: () => void;
}) {
  const c = useColors();

  // Slide the icon with the drag so it stays centred in the revealed area.
  const iconStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: side === 'left' ? Math.min(0, translation.value - 88) : Math.max(0, translation.value + 88) },
    ],
  }));

  return (
    <View
      style={[
        styles.pane,
        { backgroundColor: action.color, borderRadius: radius, alignItems: side === 'left' ? 'flex-start' : 'flex-end' },
      ]}
    >
      <Animated.View style={[styles.paneInner, iconStyle]}>
        <Glyph name={action.icon} size={20} color="#fff" />
        <Animated.Text style={styles.paneLabel} numberOfLines={1}>
          {action.label}
        </Animated.Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  pane: { flex: 1, justifyContent: 'center', paddingHorizontal: Spacing.lg },
  paneInner: { alignItems: 'center', gap: 4, width: 76 },
  paneLabel: { color: '#fff', fontFamily: FontFamily.semibold, fontSize: FontSize.xs },
});
