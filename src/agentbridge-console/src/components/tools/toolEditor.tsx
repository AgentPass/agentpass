import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { OAuthProvider, Tool, Folder as ToolFolder } from "@agentbridge/api";
import { Save, Settings } from "lucide-react";
import React from "react";
import { DeleteToolDialog } from "./deleteToolDialog";
import { useToolEditor } from "./toolEditorContext";
import { ToolEditorTabs } from "./toolEditorTabs";

interface ToolEditorProps {
  folders: ToolFolder[] | null;
  providers: OAuthProvider[];
  handleDeleteTool: () => Promise<void>;
  isSaving: boolean;
  onSave: (tool: Tool) => Promise<void>;
}

const ToolEditor: React.FC<ToolEditorProps> = ({ folders, providers, handleDeleteTool, isSaving, onSave }) => {
  const { tool } = useToolEditor();

  if (!tool) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center p-10 text-center">
          <Settings className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">No tool selected</h3>
          <p className="text-sm text-muted-foreground mt-1 mb-6 max-w-md">
            Select a tool from the list to edit its settings, or create a new tool to get started.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-6">
        <ToolEditorTabs folders={folders} providers={providers} />
        <div className="flex justify-end mt-6 pt-4 border-t border-border">
          <div className="flex space-x-2">
            <DeleteToolDialog onDelete={async () => await handleDeleteTool()} />
            <Button onClick={() => onSave(tool)} /* disabled={!isDirty || isSaving} */>
              {isSaving ? (
                <span className="flex items-center">
                  <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></span>
                  Saving...
                </span>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ToolEditor;
