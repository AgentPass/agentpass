import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, ArrowRight, ChevronDown, ChevronRight, Folder } from "lucide-react";
import { useState } from "react";

export interface ToolInfo {
  name: string;
  description: string;
  operationId: string;
  folder?: string;
}

export interface FolderGroup {
  name: string;
  tools: ToolInfo[];
}

interface ToolSelectionStepProps {
  tools: ToolInfo[];
  selectedTools: string[];
  onSelectedToolsChange: (selectedTools: string[]) => void;
  onBack: () => void;
  onNext: () => void;
  loading?: boolean;
}

export default function ToolSelectionStep({
  tools,
  selectedTools,
  onSelectedToolsChange,
  onBack,
  onNext,
  loading = false,
}: ToolSelectionStepProps) {
  const [collapsedFolders, setCollapsedFolders] = useState<Record<string, boolean>>({});

  // Group tools by folder
  const folderGroups = tools.reduce<Record<string, ToolInfo[]>>((acc, tool) => {
    const folderName = tool.folder || "General";
    if (!acc[folderName]) {
      acc[folderName] = [];
    }
    acc[folderName].push(tool);
    return acc;
  }, {});

  const toggleFolder = (folderName: string) => {
    setCollapsedFolders((prev) => ({
      ...prev,
      [folderName]: !prev[folderName],
    }));
  };

  const handleSelectAll = () => {
    onSelectedToolsChange(tools.map((tool) => tool.name));
  };

  const handleDeselectAll = () => {
    onSelectedToolsChange([]);
  };

  const handleSelectFolderAll = (folderName: string) => {
    const folderTools = folderGroups[folderName] || [];
    const folderToolNames = folderTools.map((tool) => tool.name);
    const currentlySelected = selectedTools.filter((name) => !folderToolNames.includes(name));
    onSelectedToolsChange([...currentlySelected, ...folderToolNames]);
  };

  const handleDeselectFolderAll = (folderName: string) => {
    const folderTools = folderGroups[folderName] || [];
    const folderToolNames = folderTools.map((tool) => tool.name);
    onSelectedToolsChange(selectedTools.filter((name) => !folderToolNames.includes(name)));
  };

  const handleToolToggle = (toolName: string, checked: boolean) => {
    if (checked) {
      onSelectedToolsChange([...selectedTools, toolName]);
    } else {
      onSelectedToolsChange(selectedTools.filter((name) => name !== toolName));
    }
  };

  const isFolderFullySelected = (folderName: string) => {
    const folderTools = folderGroups[folderName] || [];
    return folderTools.every((tool) => selectedTools.includes(tool.name));
  };

  const isFolderPartiallySelected = (folderName: string) => {
    const folderTools = folderGroups[folderName] || [];
    return folderTools.some((tool) => selectedTools.includes(tool.name)) && !isFolderFullySelected(folderName);
  };

  return (
    <Card className="border shadow-sm">
      <CardHeader>
        <CardTitle>Select Tools to Activate</CardTitle>
        <CardDescription>
          Choose which tools you want to activate. Unselected tools will still be created but disabled.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Header with counters and select all */}
        <div className="flex items-center justify-between border-b pb-4">
          <div className="flex items-center space-x-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleSelectAll}
              disabled={selectedTools.length === tools.length}
            >
              Select All
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleDeselectAll}
              disabled={selectedTools.length === 0}
            >
              Deselect All
            </Button>
          </div>
          <div className="text-sm text-blue-600 font-medium">
            {selectedTools.length} of {tools.length} selected
          </div>
        </div>

        {/* Tools grouped by folder */}
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {Object.entries(folderGroups).map(([folderName, folderTools]) => {
            const isCollapsed = collapsedFolders[folderName] || false;
            const isFullySelected = isFolderFullySelected(folderName);
            const isPartiallySelected = isFolderPartiallySelected(folderName);

            return (
              <div key={folderName} className="border border-border rounded-md overflow-hidden">
                {/* Folder Header */}
                <div className="bg-secondary/25 hover:bg-secondary/40 transition-colors">
                  <div className="flex items-center justify-between px-3 py-2">
                    <button
                      type="button"
                      className="flex items-center flex-1 text-left"
                      onClick={() => toggleFolder(folderName)}
                    >
                      <Folder className="h-4 w-4 mr-2 text-primary" />
                      <span className="text-sm font-semibold">{folderName}</span>
                      <div className="ml-2">
                        {isCollapsed ? (
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                    </button>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        checked={isFullySelected}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            handleSelectFolderAll(folderName);
                          } else {
                            handleDeselectFolderAll(folderName);
                          }
                        }}
                        className={isPartiallySelected ? "data-[state=checked]:bg-orange-500" : ""}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-xs"
                        onClick={() => {
                          if (isFullySelected) {
                            handleDeselectFolderAll(folderName);
                          } else {
                            handleSelectFolderAll(folderName);
                          }
                        }}
                      >
                        {isFullySelected ? "Deselect All" : "Select All"}
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Folder Tools */}
                {!isCollapsed && (
                  <div className="border-t border-border">
                    {folderTools.map((tool) => (
                      <div
                        key={tool.name}
                        className="flex items-center justify-between px-3 py-2 hover:bg-secondary/10 border-b border-border last:border-b-0"
                      >
                        <div className="flex items-center space-x-3 flex-1">
                          <Checkbox
                            checked={selectedTools.includes(tool.name)}
                            onCheckedChange={(checked) => handleToolToggle(tool.name, checked as boolean)}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="font-mono text-sm font-medium truncate">{tool.name}</div>
                            <div className="text-xs text-muted-foreground truncate">{tool.description}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-4 p-3 bg-muted/50 rounded-lg text-sm text-muted-foreground">
          You can add or remove tools later after your server is created
        </div>
      </CardContent>
      <CardFooter className="flex justify-between border-t p-6">
        <Button type="button" variant="outline" onClick={onBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Button type="button" onClick={onNext} disabled={loading}>
          {loading ? (
            <>
              <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></span>
              Creating...
            </>
          ) : (
            <>
              Generate MCP Server
              <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
