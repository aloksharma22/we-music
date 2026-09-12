/**
 * Cloudflare R2 Audio Streaming and Ingestion Service
 * Handles CDN playback URLs and direct uploads to zero-egress Cloudflare R2 object storage.
 */

// Public CDN base URL for R2 bucket
const DEFAULT_R2_PUBLIC_URL = 'https://pub-12970d33ac444689b742d0859fc34dea.r2.dev';

export function getR2PublicBaseUrl(): string {
  const envUrl = (import.meta as any).env?.VITE_CLOUDFLARE_R2_PUBLIC_URL;
  if (envUrl && typeof envUrl === 'string' && envUrl.trim().length > 0) {
    return envUrl.replace(/\/+$/, '');
  }
  return DEFAULT_R2_PUBLIC_URL;
}

/**
 * Generates a public CDN stream URL for an audio file key in Cloudflare R2
 */
export function getR2AudioStreamUrl(trackKeyOrFilename: string): string {
  const base = getR2PublicBaseUrl();
  const cleanKey = trackKeyOrFilename.replace(/^\/+/, '');
  return `${base}/${cleanKey}`;
}

/**
 * Checks if a given stream URL originates from your Cloudflare R2 CDN
 */
export function isR2StreamUrl(url: string | undefined): boolean {
  if (!url) return false;
  return url.includes('.r2.dev') || url.includes('cloudflare');
}
