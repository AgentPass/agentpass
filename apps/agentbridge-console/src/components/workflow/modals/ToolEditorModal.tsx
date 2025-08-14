import { api } from "@/api";
import { ToolEditorProvider, useToolEditor } from "@/components/tools/toolEditorContext";
import { ToolEditorTabs } from "@/components/tools/toolEditorTabs";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { OAuthProvider, Tool, Folder as ToolFolder } from "@agentbridge/api";
import { Save, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { ToolNodeData } from "../types";

interface ToolEditorWrapperProps {
  folders: ToolFolder[];
  providers: OAuthProvider[];
  onToolChange: (tool: Tool) => void;
  defaultTab?: string;
  disabledTabs?: string[];
}

const ToolEditorWrapper: React.FC<ToolEditorWrapperProps> = ({
  folders,
  providers,
  onToolChange,
  defaultTab,
  disabledTabs,
}) => {
  const { tool } = useToolEditor();

  // Update parent when tool changes
  useEffect(() => {
    if (tool) {
      onToolChange(tool);
    }
  }, [tool, onToolChange]);

  return <ToolEditorTabs folders={folders} providers={providers} defaultTab={defaultTab} disabledTabs={disabledTabs} />;
};

interface ToolEditorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  toolData: ToolNodeData;
  onSave: (updatedData: Partial<ToolNodeData>) => void;
  defaultTab?: string;
  disabledTabs?: string[];
}

export const ToolEditorModal: React.FC<ToolEditorModalProps> = ({
  open,
  onOpenChange,
  toolData,
  onSave,
  defaultTab,
  disabledTabs,
}) => {
  const [folders, setFolders] = useState<ToolFolder[]>([]);
  const [providers, setProviders] = useState<OAuthProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editedTool, setEditedTool] = useState<Tool | null>(null);

  // Fetch folders and providers
  useEffect(() => {
    const fetchData = async () => {
      if (!open) return;

      try {
        setLoading(true);
        const [foldersData, providersData] = await Promise.all([
          api.tools.getToolFolders(toolData.serverId),
          api.authProviders.getProviders(),
        ]);
        setFolders(foldersData);
        setProviders(providersData);
      } catch {
        // Error handled silently
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [open, toolData.serverId]);

  // Initialize edited tool when modal opens
  useEffect(() => {
    if (open && toolData.tool) {
      setEditedTool(toolData.tool);
    }
  }, [open, toolData.tool]);

  // Handle save
  const handleSave = useCallback(async () => {
    if (!editedTool) return;

    try {
      setSaving(true);

      // Create clean payload matching the tools page structure
      const payload = {
        name: editedTool.name,
        description: editedTool.description,
        enabled: editedTool.enabled,
        folderId: editedTool.folderId,
        method: editedTool.method,
        url: editedTool.url,
        parameters: editedTool.parameters || {},
        providerId: editedTool.oAuthProviderId || editedTool.apiKeyProviderId || undefined,
        responseFormatting: editedTool.responseFormatting || undefined,
        requestParameterOverrides: editedTool.requestParameterOverrides || undefined,
        responses: editedTool.responses || undefined,
      };

      // Update the tool via API
      const updatedTool = await api.tools.updateTool(toolData.serverId, editedTool.id, payload);

      // Update the node data with the updated tool
      onSave({
        ...toolData,
        tool: updatedTool,
        label: updatedTool.name,
        description: updatedTool.description,
      });

      // Show success toast instead of closing modal
      toast({
        title: "Tool updated successfully",
        description: `${updatedTool.name} has been updated.`,
        variant: "success",
      });
    } catch {
      // Show error toast
      toast({
        title: "Failed to update tool",
        description: "There was an error saving your changes. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }, [editedTool, toolData, onSave]);

  // Handle cancel
  const handleCancel = useCallback(() => {
    setEditedTool(toolData.tool);
    onOpenChange(false);
  }, [toolData.tool, onOpenChange]);

  // Handle dialog close events (ESC, click outside, etc.)
  const handleDialogOpenChange = useCallback(
    (open: boolean) => {
      if (!open) {
        // Only close if user explicitly cancels, not on successful save
        handleCancel();
      }
    },
    [handleCancel],
  );

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>Edit Tool: {toolData.tool.name}</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="p-1">
              {editedTool && (
                <ToolEditorProvider initialTool={editedTool}>
                  <ToolEditorWrapper
                    folders={folders}
                    providers={providers}
                    onToolChange={setEditedTool}
                    defaultTab={defaultTab}
                    disabledTabs={disabledTabs}
                  />
                </ToolEditorProvider>
              )}
            </div>
          )}
        </div>

        <div className="flex-shrink-0 flex justify-end space-x-2 pt-4 border-t">
          <Button variant="outline" onClick={handleCancel} disabled={saving}>
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving || loading} className="bg-blue-600 hover:bg-blue-700">
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
