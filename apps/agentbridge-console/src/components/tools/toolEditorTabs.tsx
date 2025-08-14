import { ResponseSchemas } from "@/components/tools/responseSchemas";
import { ToolAuth } from "@/components/tools/toolAuth.tsx";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { TimeAgo } from "@/components/ui/time-ago";
import { isSnakeCase } from "@/utils/string";
import { OAuthProvider, Response, Folder as ToolFolder } from "@agentbridge/api";
import snakeCase from "lodash/snakeCase";
import React, { useState } from "react";
import { HttpRequestEditor } from "./httpRequestEditor";
import { useToolEditor } from "./toolEditorContext";
import { ToolFormattingEditor } from "./toolFormattingEditor";
import { ToolParametersEditor } from "./toolParametersEditor";

// Local Required asterisk component
const Required = () => <span className="text-destructive ml-1">*</span>;

interface ToolEditorTabsProps {
  folders: ToolFolder[] | null;
  providers: OAuthProvider[];
  defaultTab?: string;
  disabledTabs?: string[];
}

export const ToolEditorTabs: React.FC<ToolEditorTabsProps> = ({
  folders,
  providers,
  defaultTab = "general",
  disabledTabs = [],
}) => {
  const { tool, setTool } = useToolEditor();

  // Local state for all editable fields
  const [editName, setEditName] = useState(tool?.name || "");
  const [editDescription, setEditDescription] = useState(tool?.description || "");
  const [editFolderId, setEditFolderId] = useState<string | undefined>(tool?.folderId || undefined);
  const [editResponses, setEditResponses] = useState<Record<string, Response> | undefined>(tool?.responses || {});

  // Sync local state with context tool when tool changes
  React.useEffect(() => {
    setEditName(tool?.name || "");
    setEditDescription(tool?.description || "");
    setEditFolderId(tool?.folderId || undefined);
    setEditResponses(tool?.responses || {});
  }, [tool]);

  // Update context tool when any field changes
  React.useEffect(() => {
    if (!tool) return;
    setTool({
      ...tool,
      name: editName,
      description: editDescription,
      folderId: editFolderId,
      url: tool.url,
      method: tool.method,
      responses: editResponses,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    editName,
    editDescription,
    editFolderId,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    JSON.stringify(editResponses),
  ]);

  if (!tool) return null;

  return (
    <Tabs defaultValue={defaultTab} className="w-full">
      <TabsList className="grid grid-cols-4 w-full mb-6">
        <TabsTrigger value="general" disabled={disabledTabs.includes("general")}>
          General
        </TabsTrigger>
        <TabsTrigger value="parameters" disabled={disabledTabs.includes("parameters")}>
          Tool Parameters
        </TabsTrigger>
        <TabsTrigger value="request" disabled={disabledTabs.includes("request")}>
          HTTP Request
        </TabsTrigger>
        <TabsTrigger value="formatting" disabled={disabledTabs.includes("formatting")}>
          Response to LLM
        </TabsTrigger>
      </TabsList>

      <TabsContent value="general" className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="tool-name">
            Name <Required />
          </Label>
          <Input id="tool-name" value={editName} onChange={(e) => setEditName(e.target.value)} />
          {editName && !isSnakeCase(editName) && (
            <p className="text-sm text-yellow-600 dark:text-yellow-500">
              Name will be converted to: {snakeCase(editName)}
            </p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="tool-description">Description</Label>
          <Textarea
            id="tool-description"
            value={editDescription}
            onChange={(e) => setEditDescription(e.target.value)}
            rows={3}
          />
        </div>

        <ToolAuth tool={tool} providers={providers} />

        <div className="space-y-2">
          <Label htmlFor="tool-folder">Folder</Label>
          <Select
            value={editFolderId || "none"}
            onValueChange={(value) => setEditFolderId(value === "none" ? undefined : value)}
          >
            <SelectTrigger id="tool-folder">
              <SelectValue placeholder="No folder" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No folder</SelectItem>
              {folders?.map((folder) => (
                <SelectItem key={folder.id} value={folder.id}>
                  {folder.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="pt-2 flex items-center justify-between text-sm text-muted-foreground border-t border-border mt-4">
          <div>Last updated: {tool.updatedAt ? <TimeAgo date={tool.updatedAt} /> : "N/A"}</div>
        </div>
      </TabsContent>

      <TabsContent value="parameters" className="space-y-4">
        <ToolParametersEditor />
      </TabsContent>

      <TabsContent value="request" className="space-y-4">
        <HttpRequestEditor />
      </TabsContent>

      <TabsContent value="responses">
        <ResponseSchemas responses={editResponses} setResponses={setEditResponses} />
      </TabsContent>

      <TabsContent value="formatting">
        <ToolFormattingEditor />
      </TabsContent>
    </Tabs>
  );
};
