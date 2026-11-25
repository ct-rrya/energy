import type { ScannedWiFiNetwork } from './types';

export const SAVED_WIFI_SSIDS_STORAGE_KEY = 'ecostep_saved_wifi_ssids';
const MAX_SAVED_SSIDS = 15;

/**
 * Load saved Wi-Fi SSIDs from browser localStorage.
 * Stores SSIDs ONLY — passwords are never persisted.
 */
export function getSavedWifiSsids(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(SAVED_WIFI_SSIDS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
      .map((s) => s.trim())
      .slice(0, MAX_SAVED_SSIDS);
  } catch {
    return [];
  }
}

/**
 * Save a Wi-Fi SSID to localStorage (most recent first, deduplicated).
 * Only the SSID string is saved — never the password.
 */
export function saveWifiSsid(ssid: string): string[] {
  const trimmed = ssid.trim();
  if (!trimmed || typeof window === 'undefined') {
    return getSavedWifiSsids();
  }

  const existing = getSavedWifiSsids().filter((item) => item !== trimmed);
  const updated = [trimmed, ...existing].slice(0, MAX_SAVED_SSIDS);

  try {
    localStorage.setItem(SAVED_WIFI_SSIDS_STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // Ignore storage quota/privacy errors
  }

  return updated;
}

/**
 * Remove a saved Wi-Fi SSID from localStorage.
 */
export function removeSavedWifiSsid(ssid: string): string[] {
  const updated = getSavedWifiSsids().filter((item) => item !== ssid);
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(SAVED_WIFI_SSIDS_STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // Ignore storage errors
    }
  }
  return updated;
}

export interface HybridWifiScanResult {
  networks: ScannedWiFiNetwork[];
  source: 'laptop' | 'saved';
  laptopScanAvailable: boolean;
}

function isLocalHostname(): boolean {
  if (typeof window === 'undefined') return false;
  const host = window.location.hostname;
  return host === 'localhost' || host === '127.0.0.1' || host === '::1';
}

function mergeLaptopAndSavedNetworks(
  laptopNetworks: ScannedWiFiNetwork[],
  savedSsids: string[],
): ScannedWiFiNetwork[] {
  const merged: ScannedWiFiNetwork[] = [];
  const seen = new Set<string>();

  for (const net of laptopNetworks) {
    const ssid = net?.ssid?.trim();
    if (!ssid || seen.has(ssid)) continue;
    seen.add(ssid);
    merged.push({
      ssid,
      rssi: net.rssi,
      secure: net.secure,
      source: 'laptop',
    });
  }

  for (const ssid of savedSsids) {
    if (seen.has(ssid)) continue;
    seen.add(ssid);
    merged.push({
      ssid,
      source: 'saved',
    });
  }

  return merged;
}

/**
 * Scan available Wi-Fi networks using the current laptop (via local Vite dev middleware)
 * without depending on the ESP32. When deployed on a hosted domain (e.g., Vercel) where
 * browser sandboxing prevents direct OS Wi-Fi scanning, falls back seamlessly to saved SSIDs.
 */
export async function scanLaptopWifiNetworks(): Promise<HybridWifiScanResult> {
  const savedSsids = getSavedWifiSsids();

  if (import.meta.env.DEV || isLocalHostname()) {
    const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const timeoutId = controller ? setTimeout(() => controller.abort(), 4500) : null;

    try {
      const response = await fetch('/__local/wifi-scan', {
        method: 'GET',
        headers: { Accept: 'application/json' },
        cache: 'no-store',
        signal: controller?.signal,
      });

      const contentType = response.headers.get('content-type') || '';
      if (response.ok && contentType.includes('application/json')) {
        const payload = await response.json();
        if (payload?.source === 'laptop' && Array.isArray(payload.networks)) {
          return {
            networks: mergeLaptopAndSavedNetworks(payload.networks, savedSsids),
            source: 'laptop',
            laptopScanAvailable: true,
          };
        }
      }
    } catch {
      // Local scanner unavailable (e.g. production preview or static build) — fall back to saved SSIDs
    } finally {
      if (timeoutId) clearTimeout(timeoutId);
    }
  }

  return {
    networks: savedSsids.map((ssid) => ({ ssid, source: 'saved' as const })),
    source: 'saved',
    laptopScanAvailable: false,
  };
}
