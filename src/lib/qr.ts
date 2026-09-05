import { scanFromURLAsync } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';

export type QrPickResult =
  | { ok: true; data: string }
  | { ok: false; reason: 'permission' | 'cancelled' | 'nocode' | 'error' };

/** Open the photo library and decode a QR code out of the chosen image. */
export async function pickQrFromLibrary(): Promise<QrPickResult> {
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) return { ok: false, reason: 'permission' };

  const picked = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    quality: 1,
  });
  if (picked.canceled || !picked.assets?.[0]) return { ok: false, reason: 'cancelled' };

  try {
    const results = await scanFromURLAsync(picked.assets[0].uri, ['qr']);
    const data = results?.[0]?.data;
    return data ? { ok: true, data } : { ok: false, reason: 'nocode' };
  } catch {
    return { ok: false, reason: 'error' };
  }
}

/**
 * Normalise a scanned payload to an order id. Accepts a bare reference
 * ("KL-84213"), a "#"-prefixed one, or a full waybill URL.
 */
export function tokenFromScan(raw: string) {
  return raw.trim().toLowerCase().replace(/^.*\//, '').replace('#', '');
}
