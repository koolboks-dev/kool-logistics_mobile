import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Linking, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import {
  Accordion,
  Card,
  Divider,
  ListRow,
  ScreenScroll,
  Text,
} from '@/components/ui';
import { Company, Faqs, Stats } from '@/data/site';
import { Motion, Radius, Spacing } from '@/theme';

export default function Help() {
  const router = useRouter();

  const open = (url: string) => Linking.openURL(url).catch(() => {});

  return (
    <ScreenScroll title="Help centre" onBack={() => router.back()} contentContainerStyle={styles.scroll}>
      <Animated.View entering={FadeInDown.duration(Motion.base)}>
        <View style={[styles.hero, { borderRadius: Radius.lg }]}>
          <Image
            source={require('@/assets/images/site/hero-2.jpg')}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            transition={250}
          />
          <View style={styles.heroScrim} />
          <View style={styles.heroCopy}>
            <Text variant="subheading" style={{ color: '#fff' }}>
              We’re here to help
            </Text>
            <Text variant="caption" style={{ color: 'rgba(255,255,255,0.88)' }}>
              Our team is on hand {Company.hours.toLowerCase()}.
            </Text>
          </View>
        </View>
      </Animated.View>

      {/* Contact */}
      <Animated.View entering={FadeInDown.delay(60).duration(Motion.base)} style={{ gap: Spacing.md }}>
        <Text variant="label" tone="muted">
          GET IN TOUCH
        </Text>
        <Card padded={false}>
          <ListRow
            icon="call-outline"
            title="Chat with us"
            subtitle={Company.phone}
            onPress={() => open(`tel:${Company.phoneDial}`)}
          />
          <Divider inset={Spacing.md} />
          <ListRow
            icon="mail-outline"
            title="Send an email"
            subtitle={Company.email}
            onPress={() => open(`mailto:${Company.email}`)}
          />
          <Divider inset={Spacing.md} />
          <ListRow icon="location-outline" title="Visit us" subtitle={Company.address} />
          <Divider inset={Spacing.md} />
          <ListRow icon="time-outline" title="Opening hours" subtitle={Company.hours} />
          <Divider inset={Spacing.md} />
          <ListRow
            icon="globe-outline"
            title="koollogistiks.com"
            subtitle="Quotes, services and partner enquiries"
            onPress={() => open(Company.website)}
          />
        </Card>
      </Animated.View>

      {/* Track shortcut */}
      <Animated.View entering={FadeInDown.delay(120).duration(Motion.base)}>
        <Card padded={false}>
          <ListRow
            icon="navigate-outline"
            title="Track a package"
            subtitle="Live status with your waybill number"
            onPress={() => router.push('/(tabs)/track')}
          />
        </Card>
      </Animated.View>

      {/* FAQs */}
      <Animated.View entering={FadeInDown.delay(180).duration(Motion.base)} style={{ gap: Spacing.md }}>
        <Text variant="label" tone="muted">
          FREQUENTLY ASKED
        </Text>
        {Faqs.map((f, i) => (
          <Accordion key={f.q} title={f.q} defaultOpen={i === 0}>
            <Text variant="body" tone="secondary">
              {f.a}
            </Text>
          </Accordion>
        ))}
      </Animated.View>

      {/* Proof */}
      <Animated.View entering={FadeInDown.delay(240).duration(Motion.base)}>
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
    </ScreenScroll>
  );
}

const styles = StyleSheet.create({
  scroll: { gap: Spacing.xxl },
  hero: { height: 150, overflow: 'hidden', justifyContent: 'flex-end' },
  heroScrim: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.42)' },
  heroCopy: { padding: Spacing.base, gap: 2 },
  statRow: { flexDirection: 'row', gap: Spacing.md },
});
