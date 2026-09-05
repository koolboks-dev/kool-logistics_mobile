import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { Motion, useColors } from '@/theme';

export function ProgressBar({ value, height = 6 }: { value: number; height?: number }) {
  const c = useColors();
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = Math.max(0, Math.min(1, value));
  }, [value, progress]);

  const fill = useAnimatedStyle(() => ({
    width: withSpring(`${progress.value * 100}%`, Motion.springSoft),
  }));

  return (
    <View style={{ height, borderRadius: 999, backgroundColor: c.surfaceSunken, overflow: 'hidden' }}>
      <Animated.View style={[{ height: '100%', borderRadius: 999, backgroundColor: c.brand }, fill]} />
    </View>
  );
}
