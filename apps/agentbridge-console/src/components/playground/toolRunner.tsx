import { api } from "@/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trackEvent } from "@/utils/analytics";
import { formatResponseTime } from "@/utils/formatters.ts";
import { log } from "@/utils/log.ts";
import { Tool, ToolRunResult } from "@agentbridge/api";
import { AnalyticsEvents } from "@agentbridge/utils";
import { Copy } from "lucide-react";
import { useState } from "react";
import { ApiExec } from "./apiExec.tsx";

interface ToolRunnerProps {
  tool: Tool;
  serverId: string;
}

export function ToolRunner({ tool, serverId }: ToolRunnerProps) {
  const [result, setResult] = useState<ToolRunResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [activeTab, setActiveTab] = useState("request");

  const handleExecute = async (parameters: Record<string, unknown>) => {
    setIsRunning(true);
    const startTime = Date.now();

    try {
      const result = await api.tools.runTool(serverId, tool.id, {
        parameters,
      });
      setResult(result);
      setActiveTab("response");

      const executionTime = Date.now() - startTime;
      trackEvent(AnalyticsEvents.MCP_TOOL_EXECUTION_API_CALL, {
        tool_id: tool.id,
        tool_name: tool.name,
        server_id: serverId,
        execution_time_ms: executionTime,
        runtime_ms: result.runtimeMs,
        is_playground: true,
        success: !result.isError,
        http_method: tool.method,
        has_auth: !!tool.oAuthProviderId || !!tool.apiKeyProviderId,
        auth_type: tool.oAuthProviderId ? "oauth" : tool.apiKeyProviderId ? "api_key" : "none",
      });
    } catch (error) {
      log.error("Error running tool:", error);
      const errorResult: ToolRunResult = {
        isError: true,
        runtimeMs: 0,
        content: "An unexpected error occurred when attempting to run the tool",
      };
      setResult(errorResult);
      setActiveTab("response");

      // Track client-side error
      const executionTime = Date.now() - startTime;
      trackEvent(AnalyticsEvents.MCP_TOOL_EXECUTION_API_CALL, {
        tool_id: tool.id,
        tool_name: tool.name,
        server_id: serverId,
        execution_time_ms: executionTime,
        error: error instanceof Error ? error.message : "Unknown error",
        is_playground: true,
        is_client_error: true,
        success: false,
        http_method: tool.method,
        has_auth: !!tool.oAuthProviderId || !!tool.apiKeyProviderId,
        auth_type: tool.oAuthProviderId ? "oauth" : tool.apiKeyProviderId ? "api_key" : "none",
      });
    } finally {
      setIsRunning(false);
    }
  };

  const copyResponse = () => {
    if (result) {
      navigator.clipboard.writeText(result.content);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{tool.name}</CardTitle>
        <CardDescription>{tool.description || "No description provided"}</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="request">Request</TabsTrigger>
            <TabsTrigger value="response" disabled={!result}>
              Response
            </TabsTrigger>
          </TabsList>

          <div className="mt-4">
            <div className={activeTab === "request" ? "block" : "hidden"}>
              <div className="rounded-md border p-4">
                <ApiExec tool={tool} onExecute={handleExecute} isExecuting={isRunning} serverId={serverId} />
              </div>
            </div>

            <div className={activeTab === "response" ? "block" : "hidden"}>
              {result && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${result.isError ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"}`}
                        >
                          {result.isError ? "Error" : "Success"}
                        </span>
                      </p>
                      <p className="text-sm text-muted-foreground mt-2">
                        Run Time: {formatResponseTime(result.runtimeMs)}
                      </p>
                    </div>
                    <Button size="sm" variant="outline" onClick={copyResponse}>
                      <Copy className="h-4 w-4 mr-2" />
                      Copy
                    </Button>
                  </div>

                  <div className="rounded-md bg-muted p-4">
                    <h4 className="text-sm font-medium mb-2">Response</h4>
                    <pre className="text-xs font-mono whitespace-pre-wrap break-all">{result.content}</pre>
                  </div>
                </div>
              )}
            </div>
          </div>
        </Tabs>
      </CardContent>
    </Card>
  );
}
