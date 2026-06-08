import type { Request, Response, NextFunction } from 'express';

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

const CLEANUP_INTERVAL = 60_000;
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore) {
    if (entry.resetAt < now) rateLimitStore.delete(key);
  }
}, CLEANUP_INTERVAL);

export function rateLimiter(maxRequests: number, windowMs: number) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const key = req.ip || req.socket.remoteAddress || 'unknown';
    const now = Date.now();
    let entry = rateLimitStore.get(key);

    if (!entry || entry.resetAt < now) {
      entry = { count: 0, resetAt: now + windowMs };
      rateLimitStore.set(key, entry);
    }

    entry.count++;

    res.setHeader('X-RateLimit-Limit', String(maxRequests));
    res.setHeader('X-RateLimit-Remaining', String(Math.max(0, maxRequests - entry.count)));
    res.setHeader('X-RateLimit-Reset', String(Math.floor(entry.resetAt / 1000)));

    if (entry.count > maxRequests) {
      res.status(429).json({
        error: 'RATE_LIMITED',
        message: 'Quá nhiều yêu cầu. Vui lòng thử lại sau.',
        retryAfterMs: entry.resetAt - now,
      });
      return;
    }

    next();
  };
}

export function validateContentType(req: Request, res: Response, next: NextFunction): void {
  if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
    const contentType = req.headers['content-type'] || '';
    if (!contentType.includes('application/json')) {
      res.status(415).json({
        error: 'UNSUPPORTED_MEDIA_TYPE',
        message: 'Content-Type must be application/json',
      });
      return;
    }
  }
  next();
}

export function validateImageSize(maxBytes: number) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.body?.image_base64) return next();
    const base64Length = req.body.image_base64.length;
    const estimatedBytes = Math.ceil((base64Length * 3) / 4);
    if (estimatedBytes > maxBytes) {
      res.status(413).json({
        error: 'IMAGE_TOO_LARGE',
        message: `Ảnh quá lớn. Vui lòng gửi ảnh dưới ${Math.round(maxBytes / 1024 / 1024)}MB.`,
      });
      return;
    }
    next();
  };
}

const DISALLOWED_PATTERNS = [
  /<script[\s>]/i,
  /javascript:/i,
  /on\w+=/i,
  /{{\s*constructor\s*}}/i,
  /__proto__/i,
];

export function sanitizeInput(input: unknown): unknown {
  if (typeof input === 'string') {
    let sanitized = input;
    for (const pattern of DISALLOWED_PATTERNS) {
      sanitized = sanitized.replace(pattern, '[removed]');
    }
    return sanitized.slice(0, 1_000_000);
  }
  if (Array.isArray(input)) {
    return input.map(sanitizeInput);
  }
  if (input && typeof input === 'object') {
    const sanitized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(input as Record<string, unknown>)) {
      const safeKey = typeof key === 'string' ? key.replace(/[<>'"]/g, '') : key;
      sanitized[safeKey] = sanitizeInput(value);
    }
    return sanitized;
  }
  return input;
}

export function sanitizeMiddleware(req: Request, _res: Response, next: NextFunction): void {
  if (req.body) {
    req.body = sanitizeInput(req.body);
  }
  next();
}

export function setupSecurityHeaders() {
  return (_req: Request, res: Response, next: NextFunction): void => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    next();
  };
}
