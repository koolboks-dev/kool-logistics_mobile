import { useLocalSearchParams, useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button, StatusOrb, Text } from '@/components/ui';
import { Layout, Motion, Spacing, useTheme } from '@/theme';

export default function Result() {
  const { status, ref } = useLocalSearchParams<{ status?: string; ref?: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const cancelled = status === 'cancelled';

  return (
    <View style={[styles.root, { backgroundColor: colors.background, paddingTop: insets.top + Spacing.xxxl }]}>
      <View style={styles.center}>
        <StatusOrb tone={cancelled ? 'danger' : 'success'} size={116} />

        <Animated.View entering={FadeInDown.delay(140).duration(Motion.slow)} style={styles.copy}>
          <Text variant="title" center>
            {cancelled ? 'Delivery cancelled' : 'Product delivered'}
          </Text>
          <Text variant="body" tone="secondary" center style={{ maxWidth: 300 }}>
            {cancelled
              ? `${ref ?? 'The order'} was cancelled and will be returned to the hub.`
              : `${ref ?? 'The order'} was confirmed as delivered. The buyer has been notified.`}
          </Text>
        </Animated.View>
      </View>

      <Animated.View
        entering={FadeInDown.delay(260).duration(Motion.slow)}
        style={[styles.footer, { paddingBottom: insets.bottom + Spacing.lg }]}
      >
        <Button label="Back to deliveries" onPress={() => router.replace('/(tabs)/orders')} />
        <Button label="Go to dashboard" variant="ghost" size="md" onPress={() => router.replace('/(tabs)/home')} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, paddingHorizontal: Layout.screenPadding },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.lg },
  copy: { alignItems: 'center', gap: Spacing.sm },
  footer: { gap: Spacing.sm, maxWidth: Layout.maxContentWidth, width: '100%', alignSelf: 'center' },
});
