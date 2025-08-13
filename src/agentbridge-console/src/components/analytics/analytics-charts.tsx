import { BarChart } from "@/components/charts/bar-chart";
import { LineChart } from "@/components/charts/line-chart";
import { StatsCard } from "@/components/charts/stats-card";
import { formatDateTime, formatNumber, formatPercent, formatResponseTime } from "@/utils/formatters";
import { AnalyticsDataPoint, TimeSeriesData } from "@agentbridge/api";
import { AlertTriangle, BarChart3, Clock, Percent } from "lucide-react";

interface FormattedTimeSeriesData extends TimeSeriesData {
  date: string;
}

interface AnalyticsChartsProps {
  analytics: {
    total: AnalyticsDataPoint;
    timeSeriesData: TimeSeriesData[];
  };
  loading: boolean;
  daysRange: number;
}

export function AnalyticsCharts({ analytics, loading, daysRange }: AnalyticsChartsProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center p-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const formattedTimeSeriesData: FormattedTimeSeriesData[] = analytics.timeSeriesData.map((item) => ({
    ...item,
    date: formatDateTime(item.date),
  }));

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Requests"
          value={formatNumber(analytics.total.requests)}
          description={`Last ${daysRange} days`}
          icon={<BarChart3 className="h-4 w-4" />}
          variant="default"
        />
        <StatsCard
          title="Success Rate"
          value={
            analytics.total.requests > 0
              ? formatPercent(analytics.total.successCount / analytics.total.requests)
              : "No data"
          }
          description="Success rate"
          icon={<Percent className="h-4 w-4" />}
          variant="success"
        />
        <StatsCard
          title="Failures"
          value={formatNumber(analytics.total.failureCount)}
          description={`Last ${daysRange} days`}
          icon={<AlertTriangle className="h-4 w-4" />}
          variant="error"
        />
        <StatsCard
          title="Avg Response Time"
          value={formatResponseTime(analytics.total.avgResponseTime)}
          description="All requests"
          icon={<Clock className="h-4 w-4" />}
          variant="default"
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <LineChart
          title="Request Volume"
          description="Number of requests over time"
          data={formattedTimeSeriesData}
          xAxisKey="date"
          series={[{ name: "Requests", key: "requests", color: "hsl(var(--chart-1))" }]}
        />

        <LineChart
          title="Response Time"
          description="Average response time over time"
          data={formattedTimeSeriesData}
          xAxisKey="date"
          series={[{ name: "Response Time (ms)", key: "avgResponseTime", color: "hsl(var(--chart-2))" }]}
        />

        <BarChart
          title="Success vs Failure Rate"
          description="Successful and failed requests over time"
          data={formattedTimeSeriesData}
          xAxisKey="date"
          series={[
            { name: "Successful", key: "successCount", color: "hsl(var(--chart-2))" },
            { name: "Failed", key: "failureCount", color: "hsl(var(--chart-5))" },
          ]}
          stacked={true}
        />
      </div>
    </>
  );
}
