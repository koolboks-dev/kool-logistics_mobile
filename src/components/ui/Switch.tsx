import * as Haptics from 'expo-haptics';
import { Pressable } from 'react-native';
import Animated, { interpolateColor, useAnimatedStyle, withSpring, withTiming } from 'react-native-reanimated';

import { Motion, useColors } from '@/theme';

/** Custom switch — the stock RN Switch renders very differently per platform. */
export function Switch({
  value,
  onChange,
  disabled,
}: {
  value: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  const c = useColors();
  const W = 50, H = 30, PAD = 3, KNOB = H - PAD * 2;

  const track = useAnimatedStyle(() => ({
    backgroundColor: withTiming(
      interpolateColor(value ? 1 : 0, [0, 1], [c.controlTrack, c.brand]),
      { duration: Motion.base },
    ),
    opacity: withTiming(disabled ? 0.5 : 1, { duration: Motion.fast }),
  }));

  const knob = useAnimatedStyle(() => ({
    transform: [{ translateX: withSpring(value ? W - KNOB - PAD * 2 : 0, Motion.spring) }],
  }));

  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked: value, disabled }}
      disabled={disabled}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onChange(!value);
      }}
    >
      <Animated.View style={[{ width: W, height: H, borderRadius: 999, padding: PAD }, track]}>
        <Animated.View
          style={[
            { width: KNOB, height: KNOB, borderRadius: 999, backgroundColor: '#fff' },
            { shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: 2 },
            knob,
          ]}
        />
      </Animated.View>
    </Pressable>
  );
}
