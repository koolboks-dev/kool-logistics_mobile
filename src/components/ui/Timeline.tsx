import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { Motion, Spacing, useColors } from '@/theme';
import { Text } from './Text';

export type TimelineStep = {
  title: string;
  description?: string;
  timestamp?: string;
  state: 'done' | 'current' | 'upcoming' | 'failed';
};

export function Timeline({ steps }: { steps: TimelineStep[] }) {
  const c = useColors();

  return (
    <View>
      {steps.map((s, i) => {
        const last = i === steps.length - 1;
        const tone =
          s.state === 'failed' ? c.danger
          : s.state === 'done' ? c.success
          : s.state === 'current' ? c.brand
          : c.borderStrong;

        return (
          <Animated.View
            key={`${s.title}-${i}`}
            entering={FadeInDown.delay(i * 60).duration(Motion.base)}
            style={styles.row}
          >
            <View style={styles.gutter}>
              <View
                style={[
                  styles.dot,
                  {
                    backgroundColor: s.state === 'upcoming' ? c.surface : tone,
                    borderColor: tone,
                  },
                ]}
              >
                {s.state === 'done' && <Ionicons name="checkmark" size={11} color="#fff" />}
                {s.state === 'failed' && <Ionicons name="close" size={11} color="#fff" />}
                {s.state === 'current' && <View style={styles.pulse} />}
              </View>
              {!last && <View style={[styles.line, { backgroundColor: s.state === 'done' ? c.success : c.border }]} />}
            </View>

            <View style={[styles.content, last && { paddingBottom: 0 }]}>
              <View style={styles.titleRow}>
                <Text variant="bodyStrong" style={{ flex: 1 }}>
                  {s.title}
                </Text>
                {s.timestamp && (
                  <Text variant="caption" tone="muted">
                    {s.timestamp}
                  </Text>
                )}
              </View>
              {s.description && (
                <Text variant="caption" tone="secondary" style={{ marginTop: 2 }}>
                  {s.description}
                </Text>
              )}
            </View>
          </Animated.View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: Spacing.md },
  gutter: { alignItems: 'center', width: 20 },
  dot: {
    width: 18,
    height: 18,
    borderRadius: 999,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulse: { width: 6, height: 6, borderRadius: 999, backgroundColor: '#fff' },
  line: { width: 2, flex: 1, marginVertical: 2, borderRadius: 1 },
  content: { flex: 1, paddingBottom: Spacing.lg },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
});
