/**
 * Uploads a local file (camera / photo library URI) to Koolboks storage, the
 * same two-step flow as the logistics web:
 *   1. POST /storage/sas/upload/ {filename, kind, content_type} → {upload_url, blob_url}
 *   2. PUT the file body to upload_url
 * Returns the blob_url the API stores (photo_url, documents…).
 */
import { API_BASE_URL } from '@/lib/api-config';
import { readStoredTokens } from '@/lib/token-storage';
import { refreshSession } from '@/store/base-api';

async function requestUpload(token: string, filename: string, contentType: string) {
  return fetch(`${API_BASE_URL}/storage/sas/upload/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ filename, kind: contentType.startsWith('image/') ? 'image' : 'generic', content_type: contentType }),
  });
}

export async function uploadLocalFile(uri: string, opts: { filename?: string; contentType?: string } = {}): Promise<string> {
  const contentType = opts.contentType || 'image/jpeg';
  const filename = (opts.filename || uri.split('/').pop() || 'upload.jpg').replace(/[^\w.-]+/g, '-').slice(-80);

  let token = readStoredTokens()?.access;
  if (!token) throw new Error('Your session has expired. Sign in again to upload files.');
  let sas = await requestUpload(token, filename, contentType);
  if (sas.status === 401 && (await refreshSession())) {
    token = readStoredTokens()?.access ?? token;
    sas = await requestUpload(token, filename, contentType);
  }
  const data = (await sas.json().catch(() => ({}))) as { upload_url?: string; blob_url?: string; message?: string };
  if (!sas.ok || !data.upload_url || !data.blob_url) throw new Error(data.message || "We couldn't start the upload.");

  const file = await (await fetch(uri)).blob();
  const put = await fetch(data.upload_url, { method: 'PUT', headers: { 'Content-Type': contentType }, body: file });
  if (!put.ok) throw new Error(`Upload failed (${put.status}). Please try again.`);
  return data.blob_url;
}
