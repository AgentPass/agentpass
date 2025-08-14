import { api } from "@/api";
import { AnalyticsCharts } from "@/components/analytics/analytics-charts";
import { DaysRangeSelector } from "@/components/analytics/time-range-selector";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { fetchData } from "@/hooks/fetch-data.ts";
import { trackEvent } from "@/utils/analytics";
import { daysToDateRange } from "@/utils/formatters";
import { McpServer, ServerAnalytics } from "@agentbridge/api";
import { AnalyticsEvents } from "@agentbridge/utils";
import { BarChart3 } from "lucide-react";
import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import useAsyncEffect from "use-async-effect";

interface ServerContextType {
  server: McpServer;
}

export default function ServerAnalyticsPage() {
  const { server } = useOutletContext<ServerContextType>();
  const [analytics, setAnalytics] = useState<ServerAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [daysRange, setDaysRange] = useState(30);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    trackEvent(AnalyticsEvents.MCP_ANALYTICS_VIEWED, {
      server_id: server.id,
      server_name: server.name,
      date_range_days: daysRange,
      metrics_type: "server",
    });
  }, [server.id, server.name, daysRange]);

  useAsyncEffect(async () => {
    const [fromDate, toDate] = daysToDateRange(daysRange.toString());

    await fetchData(
      [api.analytics.getServerAnalytics(server.id, fromDate, toDate)],
      [
        (analytics) => {
          setAnalytics(analytics);
        },
      ],
      setLoading,
    );
  }, [server.id, daysRange]);

  const handleRefresh = async () => {
    const [fromDate, toDate] = daysToDateRange(daysRange.toString());

    await fetchData(
      [api.analytics.getServerAnalytics(server.id, fromDate, toDate)],
      [
        (analytics) => {
          setAnalytics(analytics);
        },
      ],
      setRefreshing,
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Server Analytics" description="View server performance metrics and usage statistics.">
        <DaysRangeSelector
          daysRange={daysRange}
          setDaysRange={setDaysRange}
          refreshing={refreshing}
          handleRefresh={handleRefresh}
        />
      </PageHeader>

      {loading ? (
        <div className="flex items-center justify-center p-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : !analytics ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-10 text-center">
            <BarChart3 className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">No analytics data available</h3>
            <p className="text-sm text-muted-foreground mt-1 mb-6 max-w-md">
              This server doesn't have any analytics data yet. Data will appear as tools are used.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <AnalyticsCharts analytics={analytics} loading={loading} daysRange={daysRange} />

          <div className="flex justify-between items-center text-sm text-muted-foreground mt-2">
            <div>{refreshing && "Updating..."}</div>
          </div>
        </>
      )}
    </div>
  );
}
