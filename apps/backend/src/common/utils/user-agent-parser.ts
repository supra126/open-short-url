import { UAParser } from 'ua-parser-js';

export interface ParsedUserAgent {
  browser: string;
  browserVersion: string;
  os: string;
  osVersion: string;
  device: string;
  deviceType: string;
}

/**
 * Parse User Agent string
 * @param userAgent - User Agent string
 * @returns Parsed information
 */
export function parseUserAgent(userAgent: string): ParsedUserAgent {
  const parser = new UAParser(userAgent);
  const result = parser.getResult();

  return {
    browser: result.browser.name || 'Unknown',
    browserVersion: result.browser.version || 'Unknown',
    os: result.os.name || 'Unknown',
    osVersion: result.os.version || 'Unknown',
    device: result.device.model || 'Unknown',
    deviceType: result.device.type || 'desktop',
  };
}

/**
 * Get simplified device type
 * @param userAgent - User Agent string
 * @returns Device type: mobile, tablet, or desktop
 */
export function getDeviceType(userAgent: string): string {
  const parser = new UAParser(userAgent);
  const device = parser.getDevice();

  if (device.type === 'mobile') return 'mobile';
  if (device.type === 'tablet') return 'tablet';
  return 'desktop';
}
