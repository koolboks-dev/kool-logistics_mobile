import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ChevronMarkIcon } from '@/components/icons';
import { Button, Card, Text } from '@/components/ui';
import { Stats, ValueProps } from '@/data/site';
import { Layout, LogoRatio, Radius, Spacing, useTheme } from '@/theme';

export default function Welcome() {
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + Spacing.xl }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <Animated.View style={styles.hero}>
          <Image
            source={require('@/assets/images/site/hero-1.jpg')}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            transition={300}
          />
          <View style={styles.heroScrim} />

          <View style={[styles.heroInner, { paddingTop: insets.top + Spacing.lg }]}>
            <Image
              source={require('@/assets/images/logo/logo-white-bg.png')}
              style={{ width: 118, height: 118 / LogoRatio }}
              contentFit="contain"
            />
            <View style={{ flex: 1 }} />
            <Text variant="title" style={styles.heroTitle}>
              Reliable logistics across Nigeria
            </Text>
            <Text variant="body" style={styles.heroBody}>
              From dispatch bikes through Lagos traffic to trucks on cross-country routes — fast,
              affordable freight anywhere in Nigeria and West Africa.
            </Text>
          </View>
        </Animated.View>

        <View style={styles.body}>
          {/* Proof */}
          <Animated.View>
            <Card variant="filled">
              <View style={styles.statRow}>
                {Stats.map((s) => (
                  <View key={s.label} style={{ flex: 1, gap: 2 }}>
                    <Text variant="subheading" tone="brand">
                      {s.value}
                    </Text>
                    <Text variant="caption" tone="secondary">
                      {s.label}
                    </Text>
                  </View>
                ))}
              </View>
            </Card>
          </Animated.View>

          {/* Why */}
          <View style={{ gap: Spacing.md }}>
            <Text variant="label" tone="muted">
              Why businesses trust us
            </Text>
            {ValueProps.slice(0, 3).map((v, i) => (
              <Animated.View key={v.title}>
                <Card variant="outlined">
                  <View style={styles.row}>
                    <View style={[styles.mark, { backgroundColor: colors.brandSoft, borderRadius: Radius.sm }]}>
                      <ChevronMarkIcon size={20} color={colors.brand} />
                    </View>
                    <View style={{ flex: 1, gap: 2 }}>
                      <Text variant="bodyStrong">{v.title}</Text>
                      <Text variant="caption" tone="secondary">
                        {v.body}
                      </Text>
                    </View>
                  </View>
                </Card>
              </Animated.View>
            ))}
          </View>
        </View>
      </ScrollView>

      <Animated.View
        style={[
          styles.footer,
          { paddingBottom: insets.bottom + Spacing.lg, backgroundColor: colors.background, borderTopColor: colors.border },
        ]}
      >
        <Button label="Continue" icon="arrow-forward" iconPosition="right" onPress={() => router.push('/(auth)/sign-in')} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { gap: Spacing.xl },
  hero: { height: 340, overflow: 'hidden', justifyContent: 'flex-end' },
  heroScrim: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.52)' },
  heroInner: { flex: 1, padding: Layout.screenPadding, gap: Spacing.sm },
  heroTitle: { color: '#FFFFFF' },
  heroBody: { color: 'rgba(255,255,255,0.88)' },
  body: {
    paddingHorizontal: Layout.screenPadding,
    gap: Spacing.xl,
    maxWidth: Layout.maxContentWidth,
    width: '100%',
    alignSelf: 'center',
  },
  statRow: { flexDirection: 'row', gap: Spacing.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  mark: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center' },
  footer: {
    paddingHorizontal: Layout.screenPadding,
    paddingTop: Spacing.md,
    gap: Spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    maxWidth: Layout.maxContentWidth,
    width: '100%',
    alignSelf: 'center',
  },
});
