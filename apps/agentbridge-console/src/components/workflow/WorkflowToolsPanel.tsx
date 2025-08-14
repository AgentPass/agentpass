import { api } from "@/api";
import { Button } from "@/components/ui/button";
import { CreateToolRequest, OAuthProvider, Tool, Folder as ToolFolder } from "@agentbridge/api";
import { Plus } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { CreateToolDialog } from "../tools/createToolDialog";

interface WorkflowToolsPanelProps {
  serverId: string;
  onToolCreated: (tool: Tool) => void;
  onOpenToolCreationSidePanel?: () => void;
}

export const WorkflowToolsPanel: React.FC<WorkflowToolsPanelProps> = ({
  serverId,
  onToolCreated,
  onOpenToolCreationSidePanel,
}) => {
  const [folders, setFolders] = useState<ToolFolder[]>([]);
  const [providers, setProviders] = useState<OAuthProvider[]>([]);
  const [, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  // Fetch folders and providers for tool creation
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [foldersData, providersData] = await Promise.all([
          api.tools.getToolFolders(serverId),
          api.authProviders.getProviders(),
        ]);

        setFolders(foldersData);
        setProviders(providersData);
      } catch {
        // Handle error silently
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [serverId]);

  // Handle tool creation
  const handleCreateTool = useCallback(
    async (toolData: Partial<Tool>) => {
      try {
        const newTool = await api.tools.createTool(serverId, toolData as CreateToolRequest);
        onToolCreated(newTool);
        setShowCreateDialog(false);
      } catch {
        // Handle error silently
      }
    },
    [serverId, onToolCreated],
  );

  return (
    <>
      <CreateToolDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        folders={folders}
        providers={providers}
        onCreate={handleCreateTool}
      />

      <div className="w-full h-16 bg-white border-b flex items-center px-6 shadow-sm">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <h2 className="text-lg font-semibold text-gray-900">Workflow Editor</h2>
          </div>

          <div className="border-l border-gray-200 pl-4">
            <Button
              onClick={() => (onOpenToolCreationSidePanel ? onOpenToolCreationSidePanel() : setShowCreateDialog(true))}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create New Tool
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};

export default WorkflowToolsPanel;
