/**
 * DNS validation utility to prevent DNS rebinding / SSRF attacks
 * Shared between WebhookService and WebhookDeliveryService
 */

import * as dns from 'dns';
import { promisify } from 'util';
import { validateResolvedIPs } from './safe-url.validator';

const dnsLookup = promisify(dns.lookup);
const dnsResolve4 = promisify(dns.resolve4);
const dnsResolve6 = promisify(dns.resolve6);

/**
 * Resolve DNS and validate IPs to prevent DNS rebinding attacks
 * @param hostname - The hostname to validate
 * @returns Object with isValid flag and reason if invalid
 */
export async function validateDNS(
  hostname: string
): Promise<{ isValid: boolean; reason?: string }> {
  try {
    // Skip IP addresses - they were already validated during URL creation
    if (/^[\d.:[\]]+$/.test(hostname)) {
      return { isValid: true };
    }

    // Resolve IPv4 and IPv6 addresses
    const resolvedIPs: string[] = [];

    try {
      const ipv4Addresses = await dnsResolve4(hostname);
      resolvedIPs.push(...ipv4Addresses);
    } catch {
      // IPv4 resolution failed, try IPv6
    }

    try {
      const ipv6Addresses = await dnsResolve6(hostname);
      resolvedIPs.push(...ipv6Addresses);
    } catch {
      // IPv6 resolution failed
    }

    // If no IPs resolved, try general lookup
    if (resolvedIPs.length === 0) {
      try {
        const result = await dnsLookup(hostname, { all: true });
        const addresses = Array.isArray(result) ? result : [result];
        resolvedIPs.push(...addresses.map((r) => r.address));
      } catch {
        return {
          isValid: false,
          reason: `DNS resolution failed for hostname: ${hostname}`,
        };
      }
    }

    // Validate resolved IPs against private IP ranges
    return validateResolvedIPs(hostname, resolvedIPs);
  } catch (err) {
    const errorMessage =
      err instanceof Error ? err.message : 'Unknown DNS error';
    return { isValid: false, reason: `DNS validation error: ${errorMessage}` };
  }
}
