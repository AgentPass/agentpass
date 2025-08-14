import { api } from "@/api";
import { fetchData } from "@/hooks/fetch-data.ts";
import { trackEvent } from "@/utils/analytics";
import { log } from "@/utils/log";
import { McpServer, OAuthProvider, Tool, Folder as ToolFolder } from "@agentbridge/api";
import { AnalyticsEvents } from "@agentbridge/utils";
import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import useAsyncEffect from "use-async-effect";
import ToolEditor from "../../../components/tools/toolEditor";
import { ToolEditorProvider } from "../../../components/tools/toolEditorContext";
import { ToolSidebar } from "../../../components/tools/toolSidebar";

interface ServerContextType {
  server: McpServer;
}

export default function ServerToolsPage() {
  const { server } = useOutletContext<ServerContextType>();
  const [tools, setTools] = useState<Tool[] | null>(null);
  const [folders, setFolders] = useState<ToolFolder[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [providers, setProviders] = useState<OAuthProvider[]>([]);
  const [selectedToolId, setSelectedToolId] = useState<string | null>(null);
  const [selectedTool, setSelectedTool] = useState<Tool | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useAsyncEffect(async () => {
    await fetchData(
      [api.tools.getTools(server.id), api.tools.getToolFolders(server.id), api.authProviders.getProviders()],
      [setTools, setFolders, setProviders],
      setLoading,
    );
  }, [server.id]);

  useAsyncEffect(async () => {
    if (!selectedToolId) {
      setSelectedTool(null);
      return;
    }
    try {
      const tool = await api.tools.getTool(server.id, selectedToolId);
      setSelectedTool(tool || null);
    } catch (error) {
      log.error("Error loading tool:", error);
    }
  }, [selectedToolId]);

  const handleSaveTool = async (draftTool: Tool) => {
    draftTool.folderId = draftTool.folderId || null;
    draftTool.oAuthProviderId = draftTool.oAuthProviderId || null;
    draftTool.apiKeyProviderId = draftTool.apiKeyProviderId || null;

    setIsSaving(true);
    try {
      const updatedTool = await api.tools.updateTool(server.id, draftTool.id, {
        name: draftTool.name,
        description: draftTool.description,
        enabled: draftTool.enabled,
        folderId: draftTool.folderId,
        method: draftTool.method,
        url: draftTool.url,
        parameters: draftTool.parameters || {},
        providerId: draftTool.oAuthProviderId || draftTool.apiKeyProviderId || undefined,
        responseFormatting: draftTool.responseFormatting || undefined,
        requestParameterOverrides: draftTool.requestParameterOverrides || undefined,
        responses: draftTool.responses || undefined,
      });

      const changes = [];
      if (JSON.stringify(draftTool.parameters) !== JSON.stringify(selectedTool?.parameters)) changes.push("parameters");
      if (
        (draftTool.oAuthProviderId || draftTool.apiKeyProviderId) !==
        (selectedTool?.oAuthProviderId || selectedTool?.apiKeyProviderId)
      )
        changes.push("auth");
      if (draftTool.responseFormatting !== selectedTool?.responseFormatting) changes.push("formatting");
      if (draftTool.enabled !== selectedTool?.enabled) changes.push("enabled");

      trackEvent(AnalyticsEvents.MCP_TOOL_UPDATE_COMPLETED, {
        tool_id: updatedTool.id,
        tool_name: updatedTool.name,
        server_id: server.id,
        changes,
      });

      setSelectedTool(updatedTool);
      setTools(tools ? tools.map((t) => (t.id === updatedTool.id ? updatedTool : t)) : [updatedTool]);
      log.success("Tool saved", "Your changes have been saved successfully.");
    } catch {
      log.error("Error updating tool:", "There was an error saving your changes.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateTool = async (tool: Partial<Tool>) => {
    if (!tool.name?.trim() || !tool.url?.trim() || !tool.method) return;
    try {
      const newTool = await api.tools.createTool(server.id, {
        ...tool,
        name: tool.name?.trim() || "",
        description: tool.description?.trim() || "",
      });

      trackEvent(AnalyticsEvents.MCP_TOOL_CREATE_COMPLETED, {
        tool_id: newTool.id,
        tool_name: newTool.name,
        server_id: server.id,
        http_method: newTool.method,
        has_auth: !!newTool.oAuthProviderId || !!newTool.apiKeyProviderId,
        auth_type: newTool.oAuthProviderId ? "oauth" : newTool.apiKeyProviderId ? "api_key" : undefined,
        parameter_count: newTool.parameters ? Object.keys(newTool.parameters).length : 0,
        folder_id: newTool.folderId,
        creation_method: "manual",
      });

      setTools(tools ? [...tools, newTool] : [newTool]);
      setSelectedToolId(newTool.id);
    } catch (error) {
      log.error("Error creating tool:", error);
    }
  };

  const handleCreateFolder = async (name: string) => {
    try {
      const newFolder = await api.tools.createToolFolder(server.id, { name });
      setFolders(folders ? [...folders, newFolder] : [newFolder]);
      log.success("Folder created", "The folder has been created successfully.");
    } catch {
      log.error("Error creating folder:", "There was an error creating the folder.");
    }
  };

  const handleDeleteFolder = async (folderId: string) => {
    try {
      await api.tools.deleteToolFolder(server.id, folderId);
      setFolders(folders ? folders.filter((f) => f.id !== folderId) : null);
      log.success("Folder deleted", "The folder has been deleted successfully.");
    } catch {
      log.error("Error deleting folder:", "There was an error deleting the folder.");
    }
  };

  const handleDeleteTool = async () => {
    if (!selectedTool) return;
    try {
      await api.tools.deleteTool(server.id, selectedTool.id);
      setTools((prevTools) => (prevTools ? prevTools.filter((t) => t.id !== selectedTool.id) : null));
      setSelectedToolId(null);
      setSelectedTool(null);
      log.success("Tool deleted", "The tool has been deleted successfully.");
    } catch {
      log.error("Error deleting tool:", "There was an error deleting the tool.");
    }
  };

  const handleToggleToolEnabled = async (toolId: string, enabled: boolean) => {
    try {
      const updatedTool = enabled
        ? await api.tools.enableTool(server.id, toolId)
        : await api.tools.disableTool(server.id, toolId);

      setTools(tools ? tools.map((t) => (t.id === updatedTool.id ? updatedTool : t)) : [updatedTool]);

      if (selectedTool && selectedTool.id === updatedTool.id) {
        setSelectedTool(updatedTool);
      }

      log.success(
        enabled ? "Tool enabled" : "Tool disabled",
        `The tool has been ${enabled ? "enabled" : "disabled"} successfully.`,
      );
    } catch {
      log.error(
        enabled ? "Error enabling tool" : "Error disabling tool",
        `There was an error ${enabled ? "enabling" : "disabling"} the tool.`,
      );
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <ToolSidebar
        tools={tools}
        folders={folders}
        loading={loading}
        providers={providers}
        handleCreateTool={handleCreateTool}
        handleCreateFolder={handleCreateFolder}
        handleDeleteFolder={handleDeleteFolder}
        handleToggleToolEnabled={handleToggleToolEnabled}
        selectedToolId={selectedToolId}
        setSelectedToolId={setSelectedToolId}
      />
      <div className="md:col-span-2">
        <ToolEditorProvider key={selectedTool?.id} initialTool={selectedTool} server={server}>
          <ToolEditor
            folders={folders}
            providers={providers}
            handleDeleteTool={handleDeleteTool}
            isSaving={isSaving}
            onSave={handleSaveTool}
          />
        </ToolEditorProvider>
      </div>
    </div>
  );
}
