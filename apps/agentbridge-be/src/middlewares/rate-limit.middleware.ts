import { NextFunction, Request, Response } from "express";

interface RateLimitOptions {
  windowMs: number; // Time window in milliseconds
  max: number; // Max requests per window
  message?: string; // Error message
}

// Simple in-memory rate limiter
// In production, consider using redis or a dedicated rate limiting service
const requestCounts = new Map<string, { count: number; resetTime: number }>();

export function rateLimitMiddleware(options: RateLimitOptions) {
  const { windowMs, max, message = "Too many requests, please try again later" } = options;

  return (req: Request, res: Response, next: NextFunction) => {
    // Create a unique key for the client
    // Using tenant ID and user ID if available, otherwise IP
    const authReq = req as unknown as {
      admin?: { tenantId: string; id: string };
      user?: { tenantId: string; id: string };
    };
    const admin = authReq.admin;
    const user = authReq.user;
    const tenantId = admin?.tenantId || user?.tenantId;
    const userId = admin?.id || user?.id;
    const clientIp = req.ip || req.socket.remoteAddress || "unknown";
    const key = `${tenantId || "no-tenant"}_${userId || clientIp}`;

    const now = Date.now();

    // Get or create rate limit data for this key
    let rateLimit = requestCounts.get(key);

    // Reset if window has expired
    if (!rateLimit || rateLimit.resetTime < now) {
      rateLimit = { count: 0, resetTime: now + windowMs };
      requestCounts.set(key, rateLimit);
    }

    // Increment request count
    rateLimit.count++;

    // Check if limit exceeded
    if (rateLimit.count > max) {
      res.status(429).json({
        error: "Rate limit exceeded",
        message,
        retryAfter: Math.ceil((rateLimit.resetTime - now) / 1000),
      });
      return;
    }

    // Set rate limit headers
    res.setHeader("X-RateLimit-Limit", max.toString());
    res.setHeader("X-RateLimit-Remaining", (max - rateLimit.count).toString());
    res.setHeader("X-RateLimit-Reset", new Date(rateLimit.resetTime).toISOString());

    next();
  };
}

// Cleanup old entries periodically (every 5 minutes)
setInterval(
  () => {
    const now = Date.now();
    for (const [key, data] of requestCounts.entries()) {
      if (data.resetTime < now) {
        requestCounts.delete(key);
      }
    }
  },
  5 * 60 * 1000,
);
