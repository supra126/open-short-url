import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

/**
 * Checks if an IPv4 address is private/internal
 */
function isPrivateIPv4(ip: string): boolean {
  // 10.0.0.0 – 10.255.255.255
  if (/^10\./.test(ip)) return true;
  // 172.16.0.0 – 172.31.255.255
  if (/^172\.(1[6-9]|2[0-9]|3[01])\./.test(ip)) return true;
  // 192.168.0.0 – 192.168.255.255
  if (/^192\.168\./.test(ip)) return true;
  // 127.0.0.0 – 127.255.255.255 (loopback)
  if (/^127\./.test(ip)) return true;
  // 169.254.0.0 – 169.254.255.255 (link-local, including cloud metadata)
  if (/^169\.254\./.test(ip)) return true;
  // 0.0.0.0
  if (ip === '0.0.0.0') return true;
  return false;
}

/**
 * Extracts IPv4 address from IPv4-mapped IPv6 address
 * Examples: ::ffff:127.0.0.1, ::ffff:192.168.1.1, 0:0:0:0:0:ffff:127.0.0.1
 */
function extractIPv4FromMappedIPv6(host: string): string | null {
  // Remove brackets if present: [::ffff:127.0.0.1] -> ::ffff:127.0.0.1
  const cleanHost = host.replace(/^\[|\]$/g, '');

  // Match IPv4-mapped IPv6 patterns
  // ::ffff:192.168.1.1 or 0:0:0:0:0:ffff:192.168.1.1
  const ipv4MappedPattern = /^(?:::ffff:|0{1,4}(?::0{1,4}){4}:ffff:)(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})$/i;
  const match = cleanHost.match(ipv4MappedPattern);
  if (match) {
    return match[1];
  }
  return null;
}

/**
 * Checks if a hostname is a private/internal network address
 * Used to prevent SSRF attacks
 */
function isPrivateOrInternalHost(hostname: string): boolean {
  const lowerHost = hostname.toLowerCase();
  // Remove brackets for IPv6 addresses: [::1] -> ::1
  const cleanHost = lowerHost.replace(/^\[|\]$/g, '');

  // Block localhost
  if (cleanHost === 'localhost') {
    return true;
  }

  // Block IPv6 loopback in various formats
  // ::1, 0:0:0:0:0:0:0:1, 0000:0000:0000:0000:0000:0000:0000:0001
  if (
    cleanHost === '::1' ||
    /^0{1,4}(?::0{1,4}){6}:0*1$/.test(cleanHost) ||
    cleanHost === '0:0:0:0:0:0:0:1'
  ) {
    return true;
  }

  // Check for IPv4-mapped IPv6 addresses (e.g., ::ffff:127.0.0.1)
  const extractedIPv4 = extractIPv4FromMappedIPv6(cleanHost);
  if (extractedIPv4 && isPrivateIPv4(extractedIPv4)) {
    return true;
  }

  // Block private IPv4 addresses
  if (isPrivateIPv4(cleanHost)) {
    return true;
  }

  // Block IPv6 link-local (fe80::) and unique local addresses (fc00::, fd00::)
  if (/^fe80:/i.test(cleanHost) || /^fc00:/i.test(cleanHost) || /^fd00:/i.test(cleanHost)) {
    return true;
  }

  // Block .local and .internal domains
  if (cleanHost.endsWith('.local') || cleanHost.endsWith('.internal')) {
    return true;
  }

  // Block common internal hostnames
  const internalPatterns = [
    'metadata',
    'metadata.google.internal',
    'metadata.google',
    'kubernetes.default',
  ];
  if (internalPatterns.some((pattern) => cleanHost.includes(pattern))) {
    return true;
  }

  return false;
}

@ValidatorConstraint({ name: 'isSafeUrl', async: false })
export class IsSafeUrlConstraint implements ValidatorConstraintInterface {
  validate(value: string): boolean {
    if (!value || typeof value !== 'string') {
      return false;
    }

    try {
      const url = new URL(value);

      // Only allow http and https protocols
      if (!['http:', 'https:'].includes(url.protocol)) {
        return false;
      }

      // Check if hostname is private/internal
      if (isPrivateOrInternalHost(url.hostname)) {
        return false;
      }

      // Block IP addresses in URLs (optional but recommended)
      // This forces use of domain names which are harder to abuse
      // Uncomment if you want stricter security:
      // if (/^[\d.:[\]]+$/.test(url.hostname)) {
      //   return false;
      // }

      return true;
    } catch {
      return false;
    }
  }

  defaultMessage(): string {
    return 'URL must be a valid public URL. Internal network addresses, localhost, and private IP ranges are not allowed.';
  }
}

/**
 * Custom decorator to validate URLs and prevent SSRF attacks
 * Blocks: localhost, private IPs (10.x, 172.16-31.x, 192.168.x),
 * link-local (169.254.x), metadata endpoints, and non-http(s) protocols
 */
export function IsSafeUrl(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsSafeUrlConstraint,
    });
  };
}

/**
 * Standalone function to validate URLs and prevent SSRF attacks
 * Can be used for runtime validation (not just DTO validation)
 * @param url - The URL string to validate
 * @returns true if the URL is safe, false otherwise
 */
export function isSafeUrl(url: string): boolean {
  if (!url || typeof url !== 'string') {
    return false;
  }

  try {
    const parsedUrl = new URL(url);

    // Only allow http and https protocols
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      return false;
    }

    // Check if hostname is private/internal
    if (isPrivateOrInternalHost(parsedUrl.hostname)) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

/**
 * Check if an IP address is private/internal
 * Exported for use in DNS rebinding protection
 */
export function isPrivateIP(ip: string): boolean {
  // Check IPv4
  if (isPrivateIPv4(ip)) {
    return true;
  }

  // Check IPv4-mapped IPv6
  const extractedIPv4 = extractIPv4FromMappedIPv6(ip);
  if (extractedIPv4 && isPrivateIPv4(extractedIPv4)) {
    return true;
  }

  // Check IPv6 loopback
  const cleanIp = ip.replace(/^\[|\]$/g, '').toLowerCase();
  if (
    cleanIp === '::1' ||
    /^0{1,4}(?::0{1,4}){6}:0*1$/.test(cleanIp) ||
    cleanIp === '0:0:0:0:0:0:0:1'
  ) {
    return true;
  }

  // Block IPv6 link-local and unique local addresses
  if (/^fe80:/i.test(cleanIp) || /^fc00:/i.test(cleanIp) || /^fd00:/i.test(cleanIp)) {
    return true;
  }

  return false;
}

/**
 * Validates resolved DNS IP addresses to prevent DNS rebinding attacks
 * Should be called after DNS resolution and before making HTTP request
 * @param hostname - The original hostname
 * @param resolvedIPs - Array of resolved IP addresses
 * @returns Object with isValid flag and reason if invalid
 */
export function validateResolvedIPs(
  hostname: string,
  resolvedIPs: string[],
): { isValid: boolean; reason?: string } {
  if (!resolvedIPs || resolvedIPs.length === 0) {
    return { isValid: false, reason: 'DNS resolution failed - no IP addresses returned' };
  }

  for (const ip of resolvedIPs) {
    if (isPrivateIP(ip)) {
      return {
        isValid: false,
        reason: `DNS rebinding attack detected: hostname "${hostname}" resolved to private IP "${ip}"`,
      };
    }
  }

  return { isValid: true };
}
