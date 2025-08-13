import { api } from "@/api";
import { ToolRunner } from "@/components/playground/toolRunner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { fetchData } from "@/hooks/fetch-data.ts";
import { trackEvent } from "@/utils/analytics";
import { McpServer, Tool, Folder as ToolFolder } from "@agentbridge/api";
import { AnalyticsEvents } from "@agentbridge/utils";
import isNil from "lodash/isNil";
import { ChevronDown, ChevronRight, Folder, MonitorCog, Search, Settings } from "lucide-react";
import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import useAsyncEffect from "use-async-effect";

interface ServerContextType {
  server: McpServer;
}

export default function ServerPlaygroundPage() {
  const { server } = useOutletContext<ServerContextType>();
  const [tools, setTools] = useState<Tool[] | null>(null);
  const [folders, setFolders] = useState<ToolFolder[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedToolId, setSelectedToolId] = useState<string | null>(null);
  const [selectedTool, setSelectedTool] = useState<Tool | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [collapsedFolders, setCollapsedFolders] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const queryParams = new URLSearchParams(window.location.search);
    if (!queryParams.has("state")) {
      return;
    }
    const toolId = queryParams.get("state");
    setSelectedToolId(toolId);
    window.history.replaceState({}, document.title, window.location.pathname);
  }, []);

  useAsyncEffect(async () => {
    await fetchData(
      [api.tools.getTools(server.id), api.tools.getToolFolders(server.id)],
      [setTools, setFolders],
      setLoading,
    );
  }, [server.id]);

  useAsyncEffect(() => {
    if (folders) {
      const initialCollapsedState = folders.reduce(
        (acc, folder) => {
          acc[folder.id] = true;
          return acc;
        },
        {} as Record<string, boolean>,
      );
      setCollapsedFolders(initialCollapsedState);
    }
  }, [folders]);

  useAsyncEffect(() => {
    if (!selectedToolId || !tools) {
      setSelectedTool(null);
      return;
    }

    const tool = tools.find((t) => t.id === selectedToolId);
    setSelectedTool(tool || null);

    if (tool) {
      trackEvent(AnalyticsEvents.MCP_TOOL_PLAYGROUND_OPENED, {
        tool_id: tool.id,
        tool_name: tool.name,
        server_id: server.id,
        server_name: server.name,
      });
    }
  }, [selectedToolId, tools, server]);

  const filteredTools = tools
    ? tools.filter(
        (tool) =>
          tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          tool.description.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : [];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="md:col-span-1 space-y-4">
        <div className="flex items-center space-x-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search tools..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 pl-9"
            />
          </div>
        </div>

        {loading || isNil(tools) || isNil(folders) ? (
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        ) : filteredTools.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center p-6 text-center">
              <Settings className="h-8 w-8 text-muted-foreground mb-3" />
              <h3 className="font-medium">No tools found</h3>
              <p className="text-sm text-muted-foreground mt-1 mb-4">
                {searchQuery ? "Try a different search term" : "No tools available in the playground"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-1">
            {/* Folders and tools list */}
            {folders.map((folder) => {
              const folderTools = filteredTools.filter((tool) => tool.folderId === folder.id);
              const isFolderCollapsed = collapsedFolders[folder.id] || false;

              return (
                <div key={folder.id} className="border border-border rounded-md overflow-hidden">
                  <div
                    className="w-full flex items-center justify-between px-3 py-2 bg-secondary/25 hover:bg-secondary/40 transition-colors cursor-pointer"
                    onClick={() =>
                      setCollapsedFolders({
                        ...collapsedFolders,
                        [folder.id]: !collapsedFolders[folder.id],
                      })
                    }
                    aria-label={collapsedFolders[folder.id] ? "Expand folder" : "Collapse folder"}
                  >
                    <div className="flex items-center">
                      <Folder className="h-4 w-4 mr-2 text-primary" />
                      <h3 className="text-sm font-semibold">{folder.name}</h3>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setCollapsedFolders({
                            ...collapsedFolders,
                            [folder.id]: !collapsedFolders[folder.id],
                          });
                        }}
                        aria-label={collapsedFolders[folder.id] ? "Expand folder" : "Collapse folder"}
                        className="p-1"
                      >
                        {collapsedFolders[folder.id] ? (
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        )}
                      </button>
                    </div>
                  </div>

                  {!isFolderCollapsed && (
                    <div className="border-t border-border">
                      {folderTools.length === 0 ? (
                        <div className="p-2 text-center text-sm text-muted-foreground">No tools in this folder</div>
                      ) : (
                        folderTools.map((tool) => (
                          <Button
                            key={tool.id}
                            variant={selectedToolId === tool.id ? "secondary" : "ghost"}
                            className="w-full justify-start text-left h-auto py-2 px-3"
                            onClick={() => setSelectedToolId(tool.id)}
                          >
                            <div className="truncate">
                              <div className="font-medium">{tool.name}</div>
                              <div className="text-xs text-muted-foreground truncate">
                                {tool.description || "No description"}
                              </div>
                            </div>
                          </Button>
                        ))
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Tools without folders */}
            {filteredTools
              .filter((tool) => !tool.folderId)
              .map((tool) => (
                <Button
                  key={tool.id}
                  variant={selectedToolId === tool.id ? "secondary" : "ghost"}
                  className="w-full justify-start text-left h-auto py-2 px-3"
                  onClick={() => setSelectedToolId(tool.id)}
                >
                  <div className="truncate">
                    <div className="font-medium">{tool.name}</div>
                    <div className="text-xs text-muted-foreground truncate">{tool.description || "No description"}</div>
                  </div>
                </Button>
              ))}
          </div>
        )}
      </div>
      <div className="md:col-span-2">
        {selectedTool ? (
          <ToolRunner tool={selectedTool} serverId={server.id} />
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center p-10 text-center">
              <MonitorCog className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">Tool Playground</h3>
              <p className="text-sm text-muted-foreground mt-1 mb-6 max-w-md">
                Select a tool from the list to interact with it in the playground.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
