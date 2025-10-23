import * as geoip from 'geoip-lite';

export interface GeoLocation {
  country: string;
  region: string;
  city: string;
  timezone: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

/**
 * Get geographic location from IP address
 * @param ip - IP address
 * @returns Geographic location information
 */
export function getGeoLocation(ip: string): GeoLocation | null {
  try {
    // Handle localhost
    if (ip === '127.0.0.1' || ip === '::1' || ip === 'localhost') {
      return {
        country: 'Local',
        region: 'Local',
        city: 'Local',
        timezone: 'Local',
      };
    }

    const geo = geoip.lookup(ip);

    if (!geo) {
      return null;
    }

    return {
      country: geo.country || 'Unknown',
      region: geo.region || 'Unknown',
      city: geo.city || 'Unknown',
      timezone: geo.timezone || 'Unknown',
      coordinates: geo.ll
        ? {
            latitude: geo.ll[0],
            longitude: geo.ll[1],
          }
        : undefined,
    };
  } catch (error) {
    console.error('GeoIP lookup error:', error);
    return null;
  }
}

/**
 * Extract IP address from request headers
 * Handles various proxy headers
 * @param headers - Request headers
 * @returns IP address
 */
export function extractIpAddress(headers: Record<string, string>): string {
  // Check common headers set by proxies
  const xForwardedFor = headers['x-forwarded-for'];
  if (xForwardedFor) {
    // x-forwarded-for can contain multiple IPs, get the first one
    return xForwardedFor.split(',')[0].trim();
  }

  const xRealIp = headers['x-real-ip'];
  if (xRealIp) {
    return xRealIp;
  }

  const cfConnectingIp = headers['cf-connecting-ip'];
  if (cfConnectingIp) {
    return cfConnectingIp;
  }

  // Fallback to remote address
  return headers['remote-addr'] || 'Unknown';
}
