import { AnalyticsEvents } from "@agentbridge/utils";
import { PostHog } from "posthog-node";

interface BaseEventProperties {
  user_id?: string;
  tenant_id?: string;
  session_id?: string;
  timestamp?: string;
  source?: "frontend" | "backend";
}

class AnalyticsService {
  private posthog: PostHog;

  constructor() {
    this.posthog = new PostHog("phc_RWNzgaQfuBegaxtWVT6QGMXJF5oirldPLdOP1uDVHtJ", {
      host: "https://app.posthog.com",
    });
  }

  track(distinctId: string, event: string, properties: Record<string, unknown> & BaseEventProperties = {}) {
    this.posthog.capture({
      distinctId,
      event,
      properties: {
        ...properties,
        timestamp: new Date().toISOString(),
        source: "backend",
      },
    });
  }

  identify(distinctId: string, properties: Record<string, unknown>) {
    this.posthog.identify({
      distinctId,
      properties,
    });
  }

  async shutdown() {
    await this.posthog.shutdown();
  }
}

export const analytics = new AnalyticsService();
export { AnalyticsEvents };
