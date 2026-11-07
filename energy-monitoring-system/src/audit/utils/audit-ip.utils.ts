/**
 * Safe client IP extractor
 *
 * Safely parses the remote IP address, handling proxy headers (x-forwarded-for)
 * without trusting arbitrary spoofed characters.
 */
export function extractSafeIp(req: any): string {
  if (!req) return '127.0.0.1';

  try {
    // 1. Check x-forwarded-for if present (comma-separated list of proxies)
    const forwarded = req.headers?.['x-forwarded-for'];
    if (forwarded) {
      const rawIp = typeof forwarded === 'string'
        ? forwarded.split(',')[0].trim()
        : Array.isArray(forwarded)
          ? forwarded[0].trim()
          : '';

      // Validate IP address format (IPv4 or IPv6)
      if (rawIp && /^[0-9a-fA-F:.]+$/.test(rawIp)) {
        return rawIp;
      }
    }

    // 2. Fall back to standard Express req.ip (populated by trust proxy)
    if (req.ip && typeof req.ip === 'string') {
      return req.ip;
    }

    // 3. Fall back to underlying socket / connection address
    const sockIp = req.socket?.remoteAddress || req.connection?.remoteAddress;
    if (sockIp && typeof sockIp === 'string') {
      return sockIp;
    }
  } catch {
    // Graceful fallback
  }

  return '127.0.0.1';
}

/**
 * Format UTC Date to Asia/Manila (PHT, UTC+8)
 */
export function formatToManilaTime(date: Date | string): string {
  try {
    const d = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(d.getTime())) return String(date);

    return new Intl.DateTimeFormat('en-PH', {
      timeZone: 'Asia/Manila',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }).format(d) + ' PHT';
  } catch {
    return String(date);
  }
}

