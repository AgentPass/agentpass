import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trackEvent } from "@/utils/analytics";
import { AnalyticsEvents } from "@agentbridge/utils";
import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";

export default function OAuthSuccessPage() {
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const state = searchParams.get("state");
    const serverId = searchParams.get("server_id");
    const providerId = searchParams.get("provider_id");
    const scope = searchParams.get("scope") || "tool";

    if (serverId) {
      trackEvent(AnalyticsEvents.OAUTH_FLOW_COMPLETED, {
        server_id: serverId,
        provider_id: providerId,
        scope: scope,
        tool_id: state,
      });
    }
  }, [searchParams]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Card className="w-[350px] shadow-lg animate-in fade-in-50 zoom-in-95 duration-300 border-border">
        <CardHeader>
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <svg
              className="h-8 w-8 text-green-600"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <CardTitle className="text-xl text-center">Authentication Successful</CardTitle>
        </CardHeader>
        <CardContent className="text-center text-muted-foreground">
          <p className="mb-4">Authentication completed successfully.</p>
          <p>You can close this window now.</p>
        </CardContent>
      </Card>
    </div>
  );
}
