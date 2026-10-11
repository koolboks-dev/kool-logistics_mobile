import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInDown, LinearTransition } from 'react-native-reanimated';

import {
  EmptyState,
  OrderCard,
  Pagination,
  SearchBar,
  SegmentedControl,
  ScreenScroll,
  Text,
  useToast,
} from '@/components/ui';
import { dropoffAddress, expectedLabel } from '@/lib/delivery';
import { useAssignedDeliveriesQuery, type RiderDelivery } from '@/store/rider-api';
import { Motion, Spacing } from '@/theme';

const PAGE_SIZE = 8;

const FILTERS = [
  { label: 'Active', value: 'active' },
  { label: 'Completed', value: 'closed' },
  { label: 'All', value: 'all' },
];

export default function Orders() {
  const router = useRouter();
  const toast = useToast();

  const {
    data: activeList = [],
    refetch: refetchActive,
    isFetching: fetchingActive,
  } = useAssignedDeliveriesQuery({ active: true });

  const {
    data: closedList = [],
    refetch: refetchClosed,
    isFetching: fetchingClosed,
  } = useAssignedDeliveriesQuery({ active: false });

  const [segment, setSegment] = useState('active');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const allDeliveries = useMemo(() => {
    return [...activeList, ...closedList];
  }, [activeList, closedList]);

  const filtered = useMemo(() => {
    let list: RiderDelivery[] = [];
    if (segment === 'active') {
      list = activeList;
    } else if (segment === 'closed') {
      list = closedList;
    } else {
      list = allDeliveries;
    }

    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter((d) => {
        const orderNum = (d.order_number || '').toLowerCase();
        const ref = (d.delivery_id || '').toLowerCase();
        const name = (d.customer?.name || d.dropoff?.name || '').toLowerCase();
        const addr = dropoffAddress(d).toLowerCase();
        return orderNum.includes(q) || ref.includes(q) || name.includes(q) || addr.includes(q);
      });
    }
    return list;
  }, [segment, activeList, closedList, allDeliveries, search]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, pageCount);
  const visible = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

  const reset = <T,>(setter: (v: T) => void) => (v: T) => {
    setter(v);
    setPage(1);
  };

  const onRefresh = async () => {
    await Promise.all([refetchActive(), refetchClosed()]);
    toast.show('Deliveries up to date', 'success');
  };

  return (
    <ScreenScroll
      title="Delivery history"
      contentContainerStyle={styles.scroll}
      onRefresh={onRefresh}
    >
      <SearchBar value={search} onChangeText={reset(setSearch)} placeholder="Search order number, customer or address" />

      <SegmentedControl segments={FILTERS} value={segment} onChange={reset(setSegment)} />

      <View style={styles.countRow}>
        <Text variant="caption" tone="secondary">
          {filtered.length} {filtered.length === 1 ? 'delivery' : 'deliveries'}
        </Text>
      </View>

      {visible.length === 0 ? (
        <EmptyState
          icon="cube-outline"
          title={search ? 'No matching deliveries' : 'No deliveries in this tab'}
          description={
            search
              ? `No result for "${search}". Check the reference or customer name.`
              : segment === 'active'
                ? 'You have no active orders. Check with dispatch or switch to Completed.'
                : 'Completed and closed deliveries will show up here.'
          }
        />
      ) : (
        <Animated.View layout={LinearTransition.duration(Motion.base)} style={styles.list}>
          {visible.map((d, i) => (
            <Animated.View
              key={d.delivery_id}
              entering={FadeInDown.delay(i * 35).duration(Motion.base)}
              layout={LinearTransition.duration(Motion.base)}
            >
              <OrderCard
                order={{
                  id: d.delivery_id,
                  reference: d.order_number ? `#${d.order_number}` : d.delivery_id.slice(0, 8),
                  recipient: d.customer?.name || d.dropoff?.name || 'Retailer',
                  address: dropoffAddress(d),
                  status: d.status,
                  delayed: d.is_delayed,
                  meta: `${expectedLabel(d)}${d.items_count ? ` · ${d.items_count} items` : ''}`,
                }}
                onPress={() => router.push(`/order/${d.delivery_id}`)}
              />
            </Animated.View>
          ))}
        </Animated.View>
      )}

      {pageCount > 1 && <Pagination page={current} pageCount={pageCount} onChange={setPage} />}
    </ScreenScroll>
  );
}

const styles = StyleSheet.create({
  scroll: { gap: Spacing.base },
  countRow: { paddingHorizontal: Spacing.xs },
  list: { gap: Spacing.md },
});
