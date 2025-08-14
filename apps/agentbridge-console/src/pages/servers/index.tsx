import { api } from "@/api";
import { ImportServerModal } from "@/components/server/ImportServerModal";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ServerInstallTooltip } from "@/components/ui/server-install-tooltip.tsx";
import { StatusBadge } from "@/components/ui/status-badge";
import { TimeAgo } from "@/components/ui/time-ago";
import { useServerImport } from "@/contexts/mcp-config-context";
import { fetchData } from "@/hooks/fetch-data.ts";
import { validateOpenApiContent } from "@/pages/servers/openapiValidator.ts";
import { trackEvent } from "@/utils/analytics";
import { log } from "@/utils/log.ts";
import { McpServer } from "@agentbridge/api";
import { AnalyticsEvents } from "@agentbridge/utils";
import isNil from "lodash/isNil";
import { Plus, Search, ServerIcon, Upload, Zap } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import useAsyncEffect from "use-async-effect";

type EnabledStatus = "enabled" | "disabled";
type ServerStatus = "all" | EnabledStatus;

export default function ServersPage() {
  const navigate = useNavigate();
  const [servers, setServers] = useState<McpServer[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<ServerStatus>("all");
  const [creatingExample, setCreatingExample] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const { newMcpServerDetails, setNewMcpServerDetails } = useServerImport();

  useAsyncEffect(async () => {
    if (newMcpServerDetails) {
      try {
        setLoading(true);
        const server = await api.servers.importOpenApi({
          name: newMcpServerDetails.serverName,
          description: newMcpServerDetails.description,
          openApiContent: JSON.stringify(await validateOpenApiContent(newMcpServerDetails.fileContent)),
        });
        setNewMcpServerDetails(null);
        navigate(`/servers/${server.id}/general?provider=${server.oauthProviders?.[0]?.id || ""}`);
      } catch (error) {
        log.error("Error handling new mcp config:", error);
      }
    }
  }, [newMcpServerDetails, setNewMcpServerDetails]);

  useAsyncEffect(async () => {
    await fetchData([api.servers.getServers()], [setServers], setLoading);
  }, []);

  const handleTryExample = async () => {
    try {
      setCreatingExample(true);
      const server = await api.servers.createExampleServer();
      trackEvent(AnalyticsEvents.MCP_EXAMPLE_SERVER_CREATE_COMPLETED, {
        server_id: server.id,
        server_type: "Example",
      });

      navigate(`/servers/${server.id}/workflows`);
    } catch (error) {
      log.error("Error creating example server:", error);
      trackEvent(AnalyticsEvents.MCP_EXAMPLE_SERVER_CREATE_FAILED, {
        error: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setCreatingExample(false);
    }
  };

  const getStatusVariant = (enabled: boolean): "success" | "warning" | "error" | "default" => {
    return enabled ? "success" : "warning";
  };

  const filteredServers = servers
    ? servers.filter((server) => {
        const matchesSearch =
          server.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          server.description?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === "all" || (server.enabled && statusFilter === "enabled");
        return matchesSearch && matchesStatus;
      })
    : [];

  const statusCounts = servers
    ? servers.reduce(
        (acc, server) => {
          acc[server.enabled ? "enabled" : "disabled"] = (acc[server.enabled ? "enabled" : "disabled"] || 0) + 1;
          return acc;
        },
        {} as Record<EnabledStatus, number>,
      )
    : ({} as Record<EnabledStatus, number>);

  return (
    <div className="space-y-6">
      <PageHeader title="MCP Servers" description="Manage your MCP (Model Context Protocol) servers">
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setImportModalOpen(true)}>
            <Upload className="mr-2 h-4 w-4" />
            Import Server
          </Button>
          <Button asChild>
            <Link to="/servers/create">
              <Plus className="mr-2 h-4 w-4" />
              Create New Server
            </Link>
          </Button>
        </div>
      </PageHeader>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search servers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
        <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as ServerStatus)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Servers ({servers?.length || 0})</SelectItem>
            <SelectItem value="enabled">Enabled ({statusCounts.enabled || 0})</SelectItem>
            <SelectItem value="disabled">Disabled ({statusCounts.disabled || 0})</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading || isNil(servers) ? (
        <div className="flex items-center justify-center p-10">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : filteredServers.length === 0 ? (
        <Card className="border-dashed">
          <div className="flex flex-col items-center justify-center p-10 text-center">
            <ServerIcon className="h-10 w-10 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">No servers found</h3>
            <p className="text-sm text-muted-foreground mt-1 mb-4">
              {searchQuery || statusFilter !== "all"
                ? "Try adjusting your search or filters"
                : "Get started by creating your first MCP server"}
            </p>
            {!searchQuery && statusFilter === "all" && (
              <div className="flex flex-col items-center gap-4">
                <div className="flex items-center gap-4">
                  <Button asChild>
                    <Link to="/servers/create">
                      <Plus className="mr-2 h-4 w-4" />
                      Create New Server
                    </Link>
                  </Button>
                  <span className="text-muted-foreground text-sm">or</span>
                  <Button variant="outline" onClick={handleTryExample} disabled={creatingExample}>
                    <Zap className="mr-2 h-4 w-4" />
                    {creatingExample ? "Creating..." : "Try Example"}
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">Start with a To-Dos MCP example</p>
              </div>
            )}
          </div>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredServers.map((server) => (
            <ServerInstallTooltip key={server.id} serverId={server.id}>
              <Link to={`/servers/${server.id}/workflows`} className="group block h-full">
                <Card className="flex flex-col h-full transition-colors hover:border-primary/50 group-hover:shadow-sm">
                  <div className="flex-1 p-6">
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">
                        {server.name}
                      </h3>
                      <StatusBadge
                        status={server.enabled ? "Enabled" : "Disabled"}
                        variant={getStatusVariant(server.enabled)}
                      />
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">{server.description}</p>
                  </div>

                  <div className="flex justify-between items-center p-6 border-t border-border bg-muted/10">
                    {server.updatedAt && (
                      <div className="text-sm">
                        <span className="text-muted-foreground">Last updated:</span> <TimeAgo date={server.updatedAt} />
                      </div>
                    )}
                    <div className="flex items-center">
                      <span className="text-sm font-medium">{server.toolCount}</span>
                      <span className="text-sm text-muted-foreground ml-1">tools</span>
                    </div>
                  </div>
                </Card>
              </Link>
            </ServerInstallTooltip>
          ))}
        </div>
      )}

      <ImportServerModal
        isOpen={importModalOpen}
        onClose={() => {
          setImportModalOpen(false);
          // Refresh servers list after import
          fetchData([api.servers.getServers()], [setServers], setLoading);
        }}
      />
    </div>
  );
}
