import { 
  db, 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  deleteDoc, 
  serverTimestamp 
} from './config';

/**
 * Firestore Media Storage Engine
 * Stores large media (videos, full-resolution photos) directly inside Firestore
 * by breaking them into safe 600KB chunks in a dedicated `media_items` collection.
 * 
 * Features:
 * - 100% stored in Firestore (no local storage, no external bucket configuration required)
 * - Safe for mobile Safari / Chrome (chunks avoid 1MB document limit)
 * - Progressive loading with fast memory Blob reconstruction
 * - Cache-first in-memory map to eliminate repeat downloads
 */

const MEDIA_COLLECTION = 'media_items';
const CHUNK_SIZE = 600 * 1024; // 600KB per chunk safe margin under Firestore 1MB doc limit

const memoryBlobCache = new Map<string, string>();

export interface StoredMediaMeta {
  id: string;
  name: string;
  mimeType: string;
  totalSize: number;
  totalChunks: number;
  isMediaRef: true;
  createdAt: any;
}

/**
 * Converts a File to an ArrayBuffer
 */
function fileToArrayBuffer(file: File | Blob): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = () => reject(reader.error || new Error('Erreur de lecture du fichier'));
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Converts an ArrayBuffer to a Base64 string
 */
function bufferToBase64(buffer: ArrayBuffer): string {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Converts a Base64 string back to Uint8Array
 */
function base64ToUint8Array(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

/**
 * Uploads a video or large image directly into Firestore chunks.
 * Returns a `firestore-media://${mediaId}` protocol string that can be resolved anywhere.
 */
export async function uploadMediaToFirestore(
  file: File,
  onProgress?: (percent: number) => void
): Promise<string> {
  const timestamp = Date.now();
  const cleanName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
  const mediaId = `media_${timestamp}_${Math.random().toString(36).substring(2, 9)}`;

  if (onProgress) onProgress(5);

  const arrayBuffer = await fileToArrayBuffer(file);
  const totalSize = arrayBuffer.byteLength;
  const totalChunks = Math.ceil(totalSize / CHUNK_SIZE);

  if (onProgress) onProgress(15);

  // 1. Write the master manifest document in `media_items`
  const manifestRef = doc(db, MEDIA_COLLECTION, mediaId);
  const meta: StoredMediaMeta = {
    id: mediaId,
    name: cleanName,
    mimeType: file.type || 'video/mp4',
    totalSize,
    totalChunks,
    isMediaRef: true,
    createdAt: serverTimestamp(),
  };
  await setDoc(manifestRef, meta);

  // 2. Upload chunks in sequential/micro-batches to stay within limits and report steady progress
  for (let i = 0; i < totalChunks; i++) {
    const start = i * CHUNK_SIZE;
    const end = Math.min(start + CHUNK_SIZE, totalSize);
    const chunkBuffer = arrayBuffer.slice(start, end);
    const chunkBase64 = bufferToBase64(chunkBuffer);

    const chunkRef = doc(db, MEDIA_COLLECTION, `${mediaId}_chunk_${i}`);
    await setDoc(chunkRef, {
      mediaId,
      index: i,
      data: chunkBase64,
      size: chunkBuffer.byteLength,
      createdAt: Date.now(),
    });

    if (onProgress) {
      const pct = Math.round(15 + ((i + 1) / totalChunks) * 80);
      onProgress(Math.min(95, pct));
    }
  }

  // Pre-cache in memory so immediate preview is instant without re-fetching
  const blobUrl = URL.createObjectURL(new Blob([arrayBuffer], { type: file.type || 'video/mp4' }));
  const customUri = `firestore-media://${mediaId}`;
  memoryBlobCache.set(customUri, blobUrl);

  if (onProgress) onProgress(100);
  return customUri;
}

/**
 * Checks if a string is a Firestore media reference URI
 */
export function isFirestoreMediaUri(url: string | null | undefined): boolean {
  return typeof url === 'string' && url.startsWith('firestore-media://');
}

/**
 * Extracts mediaId from firestore-media://media_xxx
 */
export function extractMediaId(url: string): string {
  return url.replace('firestore-media://', '').trim();
}

/**
 * Resolves a `firestore-media://${mediaId}` or regular URL into a playable/renderable Object URL.
 * If already a normal URL or base64, returns it as-is.
 */
export async function resolveMediaUrl(url: string): Promise<string> {
  if (!url) return '';
  if (!isFirestoreMediaUri(url)) {
    return url;
  }

  // Check cache first
  if (memoryBlobCache.has(url)) {
    return memoryBlobCache.get(url)!;
  }

  const mediaId = extractMediaId(url);
  try {
    const manifestRef = doc(db, MEDIA_COLLECTION, mediaId);
    const manifestSnap = await getDoc(manifestRef);

    if (!manifestSnap.exists()) {
      console.warn(`[Firestore Media] Document manifest not found for ${mediaId}`);
      return '';
    }

    const meta = manifestSnap.data() as StoredMediaMeta;
    const totalChunks = meta.totalChunks || 1;
    const mimeType = meta.mimeType || 'video/mp4';

    // Fetch all chunks in order
    const chunksData: Uint8Array[] = [];
    for (let i = 0; i < totalChunks; i++) {
      const chunkRef = doc(db, MEDIA_COLLECTION, `${mediaId}_chunk_${i}`);
      const chunkSnap = await getDoc(chunkRef);
      if (chunkSnap.exists()) {
        const rawBase64 = chunkSnap.data()?.data || '';
        chunksData.push(base64ToUint8Array(rawBase64));
      }
    }

    const blob = new Blob(chunksData, { type: mimeType });
    const blobUrl = URL.createObjectURL(blob);
    memoryBlobCache.set(url, blobUrl);
    return blobUrl;
  } catch (err) {
    console.error(`[Firestore Media] Failed to reconstruct media for ${mediaId}:`, err);
    return '';
  }
}

/**
 * Deletes media item and all its chunks from Firestore
 */
export async function deleteMediaFromFirestore(url: string): Promise<void> {
  if (!isFirestoreMediaUri(url)) return;
  const mediaId = extractMediaId(url);

  try {
    const manifestRef = doc(db, MEDIA_COLLECTION, mediaId);
    const manifestSnap = await getDoc(manifestRef);
    if (!manifestSnap.exists()) return;

    const meta = manifestSnap.data() as StoredMediaMeta;
    const totalChunks = meta.totalChunks || 1;

    for (let i = 0; i < totalChunks; i++) {
      await deleteDoc(doc(db, MEDIA_COLLECTION, `${mediaId}_chunk_${i}`)).catch(() => {});
    }
    await deleteDoc(manifestRef);
    memoryBlobCache.delete(url);
  } catch (err) {
    console.warn(`[Firestore Media] Error deleting media ${mediaId}:`, err);
  }
}
