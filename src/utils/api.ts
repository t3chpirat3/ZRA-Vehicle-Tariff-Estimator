import { Capacitor } from '@capacitor/core';

// The production base URL for the API
export const PROD_API_BASE = 'https://zradutycalculator.xyz';

/**
 * Returns the correct API URL depending on whether the app is running
 * natively on Android/iOS via Capacitor, or on the web.
 *
 * @param path The relative API path (e.g., '/api/schedules')
 * @returns The absolute or relative URL
 */
export function getApiUrl(path: string): string {
  // If running natively, we must use the absolute production URL
  if (Capacitor.isNativePlatform()) {
    return `${PROD_API_BASE}${path}`;
  }
  
  // If running on the web, relative paths work perfectly
  return path;
}
