import { createPublicKey } from "crypto";
import jwt from "jsonwebtoken";
import { Logger } from "winston";

export interface JwtValidationResult {
  valid: boolean;
  error?: string;
  payload?: unknown;
}

interface JwtKey {
  kid: string;
  kty: string;
  use?: string;
  n: string;
  e: string;
  x5c?: string[];
}

interface CachedJwtKeys {
  keys: JwtKey[];
  expiry: number;
  lastFetch: number;
  failureCount: number;
}

interface CircuitBreakerState {
  state: "CLOSED" | "OPEN" | "HALF_OPEN";
  failureCount: number;
  lastFailureTime: number;
  nextAttemptTime: number;
}

interface CacheStats {
  keyCount: number;
  lastFetch: string;
  expiry: string;
  expired: boolean;
  failureCount: number;
  circuitBreakerState: string;
  rateLimitCount: number;
}

interface RateLimitState {
  count: number;
  windowStart: number;
}

/**
 * Production-ready JWT Authentication Service
 *
 * Features:
 * - JWT signature-only verification (no payload validation)
 * - RSA key support with key rotation (RS256, RS384, RS512 only)
 * - Intelligent caching with 1-hour TTL and early refresh
 * - Circuit breaker for unreachable JWKS endpoints
 * - Rate limiting for abuse prevention
 * - Comprehensive error handling and logging
 */
export class JwtAuthService {
  private keyCache: Map<string, CachedJwtKeys> = new Map();
  private circuitBreakers: Map<string, CircuitBreakerState> = new Map();
  private rateLimits: Map<string, RateLimitState> = new Map();

  // Configuration constants
  private readonly CACHE_TTL = 3600000; // 1 hour
  private readonly CACHE_REFRESH_THRESHOLD = 300000; // 5 minutes before expiry
  private readonly CIRCUIT_BREAKER_FAILURE_THRESHOLD = 5;
  private readonly CIRCUIT_BREAKER_TIMEOUT = 60000; // 1 minute
  private readonly RATE_LIMIT_WINDOW = 60000; // 1 minute
  private readonly RATE_LIMIT_MAX_REQUESTS = 10; // per window
  private readonly REQUEST_TIMEOUT = 15000; // 15 seconds

  constructor(private logger?: Logger) {}

  /**
   * Validate JWT signature using JWKS endpoint
   * Implements comprehensive error handling and caching
   */
  async validateJwtSignature(token: string, jwksUrl: string): Promise<JwtValidationResult> {
    try {
      // Rate limiting check
      if (!this.checkRateLimit(jwksUrl)) {
        this.logger?.warn("Rate limit exceeded for JWKS endpoint", { jwksUrl });
        return { valid: false, error: "Rate limit exceeded for JWKS endpoint" };
      }

      // Decode the token header to get the key ID
      const decoded = jwt.decode(token, { complete: true });
      if (!decoded || typeof decoded === "string") {
        return { valid: false, error: "Invalid JWT format" };
      }

      const kid = decoded.header.kid;
      if (!kid) {
        return { valid: false, error: "Missing key ID in JWT header" };
      }

      // Get algorithm from header
      const algorithm = decoded.header.alg;
      if (!algorithm || !["RS256", "RS384", "RS512"].includes(algorithm)) {
        return {
          valid: false,
          error: `Unsupported or missing algorithm: ${algorithm}. Only RS256, RS384, RS512 are supported.`,
        };
      }

      // Get the JWKS keys (with caching and circuit breaker)
      const keys = await this.fetchJwksKeysWithCircuitBreaker(jwksUrl);

      // Find the key with matching kid
      const jwksKey = keys.find((key) => key.kid === kid);
      if (!jwksKey) {
        // Try to refresh keys in case of key rotation
        await this.refreshJwksKeys(jwksUrl);
        const refreshedKeys = await this.fetchJwksKeysWithCircuitBreaker(jwksUrl);
        const refreshedKey = refreshedKeys.find((key) => key.kid === kid);

        if (!refreshedKey) {
          return { valid: false, error: `Key ID ${kid} not found in JWKS after refresh` };
        }

        // Use the refreshed key
        const publicKey = this.jwksKeyToPem(refreshedKey);
        return this.verifySignature(token, publicKey, algorithm);
      }

      // Convert JWKS key to PEM format and verify
      const publicKey = this.jwksKeyToPem(jwksKey);
      return this.verifySignature(token, publicKey, algorithm);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger?.error("JWT signature validation failed", {
        jwksUrl,
        error: errorMessage,
      });
      return { valid: false, error: `JWT validation error: ${errorMessage}` };
    }
  }

  /**
   * Verify JWT signature with specific algorithm
   */
  private verifySignature(token: string, publicKey: string, algorithm: string): JwtValidationResult {
    try {
      // Signature-only verification - no payload validation
      const payload = jwt.verify(token, publicKey, {
        algorithms: [algorithm as jwt.Algorithm],
        ignoreExpiration: true, // We only verify signature, not expiration
      });

      return { valid: true, payload };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger?.warn("JWT signature verification failed", { error: errorMessage });
      return { valid: false, error: `Signature verification failed: ${errorMessage}` };
    }
  }

  /**
   * Fetch JWKS keys with circuit breaker pattern
   */
  async fetchJwksKeysWithCircuitBreaker(jwksUrl: string): Promise<JwtKey[]> {
    const circuitState = this.getCircuitBreakerState(jwksUrl);

    // Check circuit breaker state
    if (circuitState.state === "OPEN") {
      if (Date.now() < circuitState.nextAttemptTime) {
        throw new Error(
          `Circuit breaker OPEN for ${jwksUrl}. Next attempt at ${new Date(circuitState.nextAttemptTime).toISOString()}`,
        );
      } else {
        // Move to half-open state
        circuitState.state = "HALF_OPEN";
      }
    }

    try {
      const keys = await this.fetchJwksKeys(jwksUrl);

      // Success - reset circuit breaker
      if (circuitState.state !== "CLOSED") {
        circuitState.state = "CLOSED";
        circuitState.failureCount = 0;
      }

      return keys;
    } catch (error) {
      // Handle failure
      circuitState.failureCount++;
      circuitState.lastFailureTime = Date.now();

      if (circuitState.failureCount >= this.CIRCUIT_BREAKER_FAILURE_THRESHOLD) {
        circuitState.state = "OPEN";
        circuitState.nextAttemptTime = Date.now() + this.CIRCUIT_BREAKER_TIMEOUT;
        this.logger?.error("Circuit breaker OPEN due to failures", {
          jwksUrl,
          failureCount: circuitState.failureCount,
        });
      }

      throw error;
    }
  }

  /**
   * Fetch JWKS keys with intelligent caching
   */
  async fetchJwksKeys(jwksUrl: string): Promise<JwtKey[]> {
    try {
      // Check cache first
      const cached = this.keyCache.get(jwksUrl);
      if (cached) {
        const now = Date.now();

        // If not expired, return cached keys
        if (now < cached.expiry) {
          // Check if we should refresh early (intelligent refresh)
          if (now > cached.expiry - this.CACHE_REFRESH_THRESHOLD) {
            // Refresh in background without blocking
            this.refreshJwksKeysInBackground(jwksUrl);
          }
          return cached.keys;
        }
      }

      // Fetch fresh keys
      return await this.fetchFreshJwksKeys(jwksUrl);
    } catch (error) {
      // If fetch fails and we have stale cached keys, use them
      const cached = this.keyCache.get(jwksUrl);
      if (cached && cached.keys.length > 0) {
        this.logger?.warn("Using stale cached JWKS keys due to fetch failure", {
          jwksUrl,
          cacheAge: Date.now() - cached.lastFetch,
        });
        return cached.keys;
      }
      throw error;
    }
  }

  /**
   * Fetch fresh JWKS keys from endpoint
   */
  private async fetchFreshJwksKeys(jwksUrl: string): Promise<JwtKey[]> {
    const response = await fetch(jwksUrl, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "User-Agent": "AgentBridge/1.0",
        "Cache-Control": "no-cache",
      },
      signal: AbortSignal.timeout(this.REQUEST_TIMEOUT),
    });

    if (!response.ok) {
      throw new Error(`JWKS endpoint error: HTTP ${response.status} ${response.statusText}`);
    }

    const jwks = (await response.json()) as Record<string, unknown>;

    if (!jwks.keys || !Array.isArray(jwks.keys)) {
      throw new Error("Invalid JWKS format: missing or invalid keys array");
    }

    // Filter for RSA signature keys only
    const rsaKeys = jwks.keys
      .filter((key: unknown) => {
        if (typeof key === "object" && key !== null) {
          const jwksKey = key as Record<string, unknown>;
          return (
            jwksKey.kty === "RSA" &&
            (jwksKey.use === "sig" || !jwksKey.use) && // use is optional, default to sig
            jwksKey.n &&
            jwksKey.e &&
            jwksKey.kid
          );
        }
        return false;
      })
      .map((key) => key as JwtKey);

    if (rsaKeys.length === 0) {
      throw new Error("No valid RSA signature keys found in JWKS");
    }

    // Update cache
    const now = Date.now();
    this.keyCache.set(jwksUrl, {
      keys: rsaKeys,
      expiry: now + this.CACHE_TTL,
      lastFetch: now,
      failureCount: 0,
    });

    return rsaKeys;
  }

  /**
   * Refresh JWKS keys in background
   */
  private async refreshJwksKeysInBackground(jwksUrl: string): Promise<void> {
    try {
      await this.fetchFreshJwksKeys(jwksUrl);
    } catch (error) {
      this.logger?.warn("Background JWKS refresh failed", {
        jwksUrl,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Force refresh JWKS keys (for key rotation)
   */
  private async refreshJwksKeys(jwksUrl: string): Promise<void> {
    await this.fetchFreshJwksKeys(jwksUrl);
  }

  /**
   * Check rate limiting for JWKS endpoint
   */
  private checkRateLimit(jwksUrl: string): boolean {
    const now = Date.now();
    const rateLimit = this.rateLimits.get(jwksUrl) || { count: 0, windowStart: now };

    // Reset window if expired
    if (now - rateLimit.windowStart > this.RATE_LIMIT_WINDOW) {
      rateLimit.count = 0;
      rateLimit.windowStart = now;
    }

    // Check if limit exceeded
    if (rateLimit.count >= this.RATE_LIMIT_MAX_REQUESTS) {
      return false;
    }

    // Increment count
    rateLimit.count++;
    this.rateLimits.set(jwksUrl, rateLimit);
    return true;
  }

  /**
   * Get circuit breaker state for endpoint
   */
  private getCircuitBreakerState(jwksUrl: string): CircuitBreakerState {
    if (!this.circuitBreakers.has(jwksUrl)) {
      this.circuitBreakers.set(jwksUrl, {
        state: "CLOSED",
        failureCount: 0,
        lastFailureTime: 0,
        nextAttemptTime: 0,
      });
    }
    return this.circuitBreakers.get(jwksUrl)!;
  }

  /**
   * Convert JWKS key to proper format for verification using Node.js crypto
   */
  private jwksKeyToPem(jwksKey: JwtKey): string {
    try {
      // Create RSA public key from JWKS components using Node.js crypto
      const publicKey = createPublicKey({
        key: {
          kty: jwksKey.kty,
          n: jwksKey.n,
          e: jwksKey.e,
        },
        format: "jwk",
      });

      // Export as PEM format
      return publicKey.export({ type: "spki", format: "pem" }) as string;
    } catch (error) {
      throw new Error(`Failed to convert JWKS key to PEM: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get cache statistics for monitoring
   */
  getCacheStats(): Record<string, CacheStats> {
    const stats: Record<string, CacheStats> = {};

    for (const [url, cached] of this.keyCache.entries()) {
      const circuitState = this.circuitBreakers.get(url);
      const rateLimit = this.rateLimits.get(url);

      stats[url] = {
        keyCount: cached.keys.length,
        lastFetch: new Date(cached.lastFetch).toISOString(),
        expiry: new Date(cached.expiry).toISOString(),
        expired: Date.now() > cached.expiry,
        failureCount: cached.failureCount,
        circuitBreakerState: circuitState?.state || "UNKNOWN",
        rateLimitCount: rateLimit?.count || 0,
      };
    }

    return stats;
  }
}
