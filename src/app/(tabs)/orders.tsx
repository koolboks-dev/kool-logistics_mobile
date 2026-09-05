import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInDown, LinearTransition } from 'react-native-reanimated';

import {
  Chip,
  ChipGroup,
  EmptyState,
  OrderCard,
  Pagination,
  SearchBar,
  SegmentedControl,
  ScreenScroll,
  Text,
  useToast,
} from '@/components/ui';
import { useApp } from '@/store/app';
import { Motion, Spacing } from '@/theme';

const PAGE_SIZE = 4;

const FILTERS = [
  { label: 'All', value: 'all' },
  { label: 'Active', value: 'active' },
  { label: 'Closed', value: 'closed' },
];

export default function Orders() {
  const router = useRouter();
  const { orders } = useApp();
  const toast = useToast();

  const [segment, setSegment] = useState('all');
  const [range, setRange] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    let list = orders;

    if (segment === 'active') {
      list = list.filter((o) => o.status === 'in_transit' || o.status === 'awaiting_pickup' || o.status === 'pending');
    } else if (segment === 'closed') {
      list = list.filter((o) => o.status === 'delivered' || o.status === 'cancelled' || o.status === 'failed');
    }

    if (range !== 'all') {
      list = list.filter((o) =>
        range === 'today' ? o.createdAt.startsWith('Today') : !o.createdAt.startsWith('Today'),
      );
    }

    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (o) =>
          o.reference.toLowerCase().includes(q) ||
          o.buyer.name.toLowerCase().includes(q) ||
          o.address.city.toLowerCase().includes(q),
      );
    }
    return list;
  }, [orders, segment, range, search]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, pageCount);
  const visible = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

  const reset = <T,>(setter: (v: T) => void) => (v: T) => {
    setter(v);
    setPage(1);
  };

  return (
    <ScreenScroll
      title="Delivery history"
      contentContainerStyle={styles.scroll}
      onRefresh={async () => {
        await new Promise((r) => setTimeout(r, 800));
        toast.show('Deliveries up to date', 'success');
      }}
    >
        <SearchBar value={search} onChangeText={reset(setSearch)} placeholder="Search reference, name or area" />

        <SegmentedControl segments={FILTERS} value={segment} onChange={reset(setSegment)} />

        <ChipGroup>
          {[
            { k: 'all', l: 'All time' },
            { k: 'today', l: 'Today' },
            { k: 'earlier', l: 'Earlier' },
          ].map((c) => (
            <Chip key={c.k} label={c.l} selected={range === c.k} onPress={() => reset(setRange)(c.k)} />
          ))}
        </ChipGroup>

        <View style={styles.countRow}>
          <Text variant="caption" tone="secondary">
            {filtered.length} {filtered.length === 1 ? 'delivery' : 'deliveries'}
          </Text>
          {pageCount > 1 && (
            <Text variant="caption" tone="muted">
              Page {current} of {pageCount}
            </Text>
          )}
        </View>

        {visible.length === 0 ? (
          <EmptyState
            icon="search-outline"
            title="No deliveries found"
            description="Try a different search term or clear the filters."
            actionLabel="Clear filters"
            onAction={() => {
              setSearch('');
              setSegment('all');
              setRange('all');
              setPage(1);
            }}
          />
        ) : (
          <Animated.View layout={LinearTransition.duration(Motion.base)} style={{ gap: Spacing.md }}>
            {visible.map((o, i) => (
              <Animated.View key={o.id} entering={FadeInDown.delay(i * 60).duration(Motion.base)}>
                <OrderCard
                  order={{
                    id: o.id,
                    reference: o.reference,
                    recipient: o.buyer.name,
                    address: `${o.address.line}, ${o.address.city}`,
                    status: o.status,
                    amount: o.total,
                  }}
                  onPress={() => router.push(`/order/${o.id}`)}
                />
              </Animated.View>
            ))}
          </Animated.View>
        )}

        {pageCount > 1 && (
          <View style={{ marginTop: Spacing.sm }}>
            <Pagination page={current} pageCount={pageCount} onChange={setPage} />
          </View>
        )}
    </ScreenScroll>
  );
}

const styles = StyleSheet.create({
  scroll: { gap: Spacing.base },
  countRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
});
