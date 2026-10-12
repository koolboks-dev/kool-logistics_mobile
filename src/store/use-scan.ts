/**
 * Scan a waybill (QR `qr_token` or an order number) through
 * POST /deliveries/scan/ and open the scan result screen.
 */
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useCallback } from 'react';

import { useToast } from '@/components/ui';
import { deliveryRef, isFreezerDelivery } from '@/lib/delivery';
import { tokenFromScan } from '@/lib/qr';
import { apiErrorCode, apiErrorMessage } from './base-api';
import { useScanDeliveryMutation } from './rider-api';

export function useScanAndOpen() {
  const router = useRouter();
  const toast = useToast();
  const [scan, { isLoading }] = useScanDeliveryMutation();

  const resolve = useCallback(
    async (raw: string): Promise<boolean> => {
      const token = tokenFromScan(raw);
      if (!token) {
        toast.show('That code is empty', 'error');
        return false;
      }
      try {
        const d = await scan(token).unwrap();
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
        router.push({
          pathname: '/result',
          params: {
            status: 'scan',
            id: d.delivery_id,
            ref: isFreezerDelivery(d) && d.freezer?.model_name ? `Freezer deployment · ${d.freezer.model_name}` : deliveryRef(d),
            kind: isFreezerDelivery(d) ? 'freezer' : 'stock',
            delivery: d.status,
            pickup: d.pickup.name,
            dropoff: d.dropoff.name || d.customer.name,
            warning: d.warning ?? '',
          },
        });
        return true;
      } catch (err) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
        const code = apiErrorCode(err);
        router.push({
          pathname: '/result',
          params: {
            status: 'scan_rejected',
            ref: raw.trim().slice(0, 40),
            reason: code === 'unknown_token' ? `No delivery matches “${raw.trim().slice(0, 24)}”.` : apiErrorMessage(err),
          },
        });
        return false;
      }
    },
    [scan, router, toast],
  );

  return { resolve, scanning: isLoading };
}
