import { api } from "@/api";
import { AnalyticsCharts } from "@/components/analytics/analytics-charts";
import { DaysRangeSelector } from "@/components/analytics/time-range-selector";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { fetchData } from "@/hooks/fetch-data.ts";
import { trackEvent } from "@/utils/analytics";
import { daysToDateRange } from "@/utils/formatters";
import { McpServer, Tool, ToolAnalytics } from "@agentbridge/api";
import { AnalyticsEvents } from "@agentbridge/utils";
import { BarChart3, Loader2, Search, Wrench } from "lucide-react";
import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import useAsyncEffect from "use-async-effect";

interface ServerContextType {
  server: McpServer;
}

export default function ToolAnalyticsPage() {
  const { server } = useOutletContext<ServerContextType>();
  const [tools, setTools] = useState<Tool[]>([]);
  const [selectedToolId, setSelectedToolId] = useState<string | null>(null);
  const [selectedTool, setSelectedTool] = useState<Tool | null>(null);
  const [analytics, setAnalytics] = useState<ToolAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [toolsLoading, setToolsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [daysRange, setDaysRange] = useState(30);
  const [refreshing, setRefreshing] = useState(false);

  useAsyncEffect(async () => {
    await fetchData(
      [api.tools.getTools(server.id)],
      [
        (toolsData) => {
          setTools(toolsData);
          if (toolsData.length > 0 && !selectedToolId) {
            setSelectedToolId(toolsData[0].id);
          }
        },
      ],
      setToolsLoading,
    );
  }, [server.id]);

  useEffect(() => {
    if (selectedToolId) {
      const tool = tools.find((t) => t.id === selectedToolId) || null;
      setSelectedTool(tool);

      if (tool) {
        trackEvent(AnalyticsEvents.MCP_ANALYTICS_VIEWED, {
          server_id: server.id,
          tool_id: tool.id,
          tool_name: tool.name,
          date_range_days: daysRange,
          metrics_type: "tool",
        });
      }
    } else {
      setSelectedTool(null);
    }
  }, [selectedToolId, tools, server.id, daysRange]);

  useAsyncEffect(async () => {
    if (!selectedToolId) {
      setAnalytics(null);
      setLoading(false);
      return;
    }

    setLoading(true);

    const [fromDate, toDate] = daysToDateRange(daysRange.toString());

    await fetchData(
      [api.analytics.getToolAnalytics(server.id, selectedToolId, fromDate, toDate)],
      [
        (analytics) => {
          setAnalytics(analytics);
        },
      ],
      setLoading,
    );
  }, [selectedToolId, daysRange]);

  const handleRefresh = async () => {
    if (!selectedToolId) return;

    const [fromDate, toDate] = daysToDateRange(daysRange.toString());

    await fetchData(
      [api.analytics.getToolAnalytics(server.id, selectedToolId, fromDate, toDate)],
      [
        (analytics) => {
          setAnalytics(analytics);
        },
      ],
      setRefreshing,
    );
  };

  const filteredTools = searchQuery
    ? tools.filter(
        (tool) =>
          tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          tool.description.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : tools;

  return (
    <div className="space-y-6">
      <PageHeader title="Tool Analytics" description="View detailed performance metrics for individual tools.">
        <DaysRangeSelector
          daysRange={daysRange}
          setDaysRange={setDaysRange}
          refreshing={refreshing}
          handleRefresh={handleRefresh}
          disabled={!selectedToolId}
        />
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Tool Selection Sidebar */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">Tools</CardTitle>
            <CardDescription>Select a tool to view analytics</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search tools..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {toolsLoading ? (
              <div className="flex justify-center p-4">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : filteredTools.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center p-4">No tools found</p>
            ) : (
              <div className="space-y-1 max-h-[400px] overflow-y-auto pr-1">
                {filteredTools.map((tool) => (
                  <Button
                    key={tool.id}
                    variant={selectedToolId === tool.id ? "default" : "ghost"}
                    className="w-full justify-start text-left"
                    onClick={() => setSelectedToolId(tool.id)}
                  >
                    <Wrench className="mr-2 h-4 w-4" />
                    <div className="truncate">{tool.name}</div>
                  </Button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tool Analytics Content */}
        <div className="md:col-span-3 space-y-6">
          {!selectedTool ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center p-20 text-center">
                <Wrench className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">No tool selected</h3>
                <p className="text-sm text-muted-foreground mt-1 mb-6 max-w-md">
                  Please select a tool from the sidebar to view its analytics.
                </p>
              </CardContent>
            </Card>
          ) : loading ? (
            <div className="flex items-center justify-center p-20">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : !analytics ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center p-20 text-center">
                <BarChart3 className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">No analytics data available</h3>
                <p className="text-sm text-muted-foreground mt-1 mb-6 max-w-md">
                  This tool doesn't have any analytics data yet. Data will appear as the tool is used.
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Tool Info Header */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle>{selectedTool.name}</CardTitle>
                  <CardDescription>{selectedTool.description}</CardDescription>
                </CardHeader>
              </Card>

              <AnalyticsCharts analytics={analytics} loading={loading} daysRange={daysRange} />

              <div className="flex justify-between items-center text-sm text-muted-foreground mt-2">
                <div>{refreshing && "Updating..."}</div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
