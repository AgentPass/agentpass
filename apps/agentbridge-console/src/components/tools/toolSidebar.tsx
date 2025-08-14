import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { OAuthProvider, Tool, Folder as ToolFolder } from "@agentbridge/api";
import isNil from "lodash/isNil";
import { ChevronDown, ChevronRight, Folder, PlusCircle, Search, Settings } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { CreateFolderDialog } from "./createFolderDialog";
import { CreateToolDialog } from "./createToolDialog";
import { DeleteFolderDialog } from "./deleteFolderDialog";

interface ToolSidebarProps {
  tools: Tool[] | null;
  folders: ToolFolder[] | null;
  loading: boolean;
  providers: OAuthProvider[];
  handleCreateTool: (tool: Partial<Tool>) => Promise<void>;
  handleCreateFolder: (name: string) => Promise<void>;
  handleDeleteFolder: (folderId: string) => Promise<void>;
  handleToggleToolEnabled: (toolId: string, enabled: boolean) => Promise<void>;
  selectedToolId: string | null;
  setSelectedToolId: (id: string | null) => void;
}

// Helper component for the tool description with tooltip
const ToolDescription = ({ description }: { description: string | undefined }) => {
  const textRef = useRef<HTMLDivElement>(null);
  const [isTruncated, setIsTruncated] = useState(false);

  useEffect(() => {
    const checkTruncation = () => {
      if (textRef.current) {
        setIsTruncated(textRef.current.scrollWidth > textRef.current.clientWidth);
      }
    };

    checkTruncation();
    window.addEventListener("resize", checkTruncation);
    return () => window.removeEventListener("resize", checkTruncation);
  }, [description]);

  const content = (
    <div ref={textRef} className="text-xs text-muted-foreground truncate max-w-full">
      {description || "No description"}
    </div>
  );

  if (!isTruncated) {
    return content;
  }

  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>{content}</TooltipTrigger>
        <TooltipContent side="right" className="max-w-[500px] whitespace-normal">
          <p className="text-sm break-words whitespace-pre-wrap">{description || "No description"}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export const ToolSidebar: React.FC<ToolSidebarProps> = ({
  tools,
  folders,
  loading,
  providers,
  handleCreateTool,
  handleCreateFolder,
  handleDeleteFolder,
  handleToggleToolEnabled,
  selectedToolId,
  setSelectedToolId,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [newToolDialogOpen, setNewToolDialogOpen] = useState(false);
  const [folderDialogOpen, setFolderDialogOpen] = useState(false);
  const [collapsedFolders, setCollapsedFolders] = useState<Record<string, boolean>>({});

  useEffect(() => {
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

  const filteredTools = tools
    ? tools.filter(
        (tool) =>
          tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          tool.description.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : [];

  return (
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
        <CreateToolDialog
          open={newToolDialogOpen}
          onOpenChange={setNewToolDialogOpen}
          folders={folders ?? []}
          providers={providers}
          onCreate={handleCreateTool}
        />
        <CreateFolderDialog open={folderDialogOpen} onOpenChange={setFolderDialogOpen} onCreate={handleCreateFolder} />
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
              {searchQuery ? "Try a different search term" : "Add your first tool to get started"}
            </p>
            {!searchQuery && (
              <Button size="sm" variant="outline" onClick={() => setNewToolDialogOpen(true)}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Tool
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-1">
          {/* Add Tool button between folders and tools without folders */}
          <div className="flex justify-center my-2">
            <Button
              size="sm"
              className="w-full px-3 py-2 rounded-md flex items-center justify-center font-medium"
              onClick={() => setNewToolDialogOpen(true)}
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Tool
            </Button>
          </div>
          {/* Tools list */}
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
                    <div onClick={(e) => e.stopPropagation()}>
                      <DeleteFolderDialog onDelete={() => handleDeleteFolder(folder.id)} />
                    </div>
                  </div>
                </div>

                {!isFolderCollapsed && (
                  <div className="border-t border-border">
                    {folderTools.length === 0 ? (
                      <div className="p-2 text-center text-sm text-muted-foreground">No tools in this folder</div>
                    ) : (
                      folderTools.map((tool) => (
                        <div
                          key={tool.id}
                          className={`flex items-center justify-between p-2 hover:bg-secondary/10 border-b border-border last:border-b-0 ${
                            selectedToolId === tool.id ? "bg-secondary/25" : ""
                          } ${!tool.enabled ? "opacity-60" : ""}`}
                        >
                          <Button
                            variant="ghost"
                            className="flex-1 justify-start text-left h-auto py-1 px-2 hover:bg-transparent min-w-0 overflow-hidden"
                            onClick={() => setSelectedToolId(tool.id)}
                          >
                            <div className="w-full min-w-0 overflow-hidden">
                              <div className={`font-medium truncate ${!tool.enabled ? "text-muted-foreground" : ""}`}>
                                {tool.name}
                              </div>
                              <ToolDescription description={tool.description} />
                            </div>
                          </Button>
                          <div className="flex-shrink-0">
                            <Switch
                              checked={tool.enabled}
                              onCheckedChange={(checked) => handleToggleToolEnabled(tool.id, checked)}
                            />
                          </div>
                        </div>
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
              <div
                key={tool.id}
                className={`flex items-center justify-between p-2 hover:bg-secondary/10 border border-border rounded-md ${
                  selectedToolId === tool.id ? "bg-secondary/25" : ""
                } ${!tool.enabled ? "opacity-60" : ""}`}
              >
                <Button
                  variant="ghost"
                  className="flex-1 justify-start text-left h-auto py-1 px-2 hover:bg-transparent min-w-0 overflow-hidden"
                  onClick={() => setSelectedToolId(tool.id)}
                >
                  <div className="w-full min-w-0 overflow-hidden">
                    <div className={`font-medium truncate ${!tool.enabled ? "text-muted-foreground" : ""}`}>
                      {tool.name}
                    </div>
                    <ToolDescription description={tool.description} />
                  </div>
                </Button>
                <div className="flex-shrink-0">
                  <Switch
                    checked={tool.enabled}
                    onCheckedChange={(checked) => handleToggleToolEnabled(tool.id, checked)}
                  />
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
};
