/**
 * Analytics utilities for tracking events
 */

interface BaseEventProperties {
  tenant_id?: string;
  session_id?: string;
  timestamp?: string;
}

/**
 * Track an event if PostHog is available
 */
export function trackEvent(eventName: string, properties?: Record<string, unknown> & BaseEventProperties): void {
  if (typeof window !== "undefined" && window.posthog) {
    const enrichedProperties = {
      ...properties,
      timestamp: new Date().toISOString(),
    };
    window.posthog.capture(eventName, enrichedProperties);
  }
}

/**
 * Track easter egg related events
 */
export function trackEasterEggEvent(eventName: string, properties?: Record<string, unknown>): void {
  trackEvent(eventName, {
    ...properties,
    feature: "easter_egg",
  });
}

/**
 * Track conversion in Tapfiliate (loaded via GTM)
 */
export function trackTapfiliateConversion(): void {
  if (typeof window !== "undefined" && (window as { tap?: unknown }).tap) {
    try {
      const tapCreate = (
        window as unknown as { tap: (action: string, id?: string, options?: Record<string, unknown>) => void }
      ).tap;
      tapCreate("create", "60984-52113d", { integration: "javascript" });

      const tapConversion = (window as unknown as { tap: (action: string) => void }).tap;
      tapConversion("conversion");
    } catch {
      // Silent fail - Tapfiliate tracking is not critical
    }
  }
}
