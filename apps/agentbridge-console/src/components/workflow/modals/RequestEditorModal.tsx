import { ToolRequestParametersEditor } from "@/components/tools/toolRequestParametersEditor";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tool } from "@agentbridge/api";
import { Save } from "lucide-react";
import React, { createContext, useContext, useState } from "react";

interface RequestEditorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tool: Tool;
  onSave?: (updatedTool: Tool) => void;
}

// Create a simple context for the tool
interface ToolContextType {
  tool: Tool | null;
  setTool: (tool: Tool) => void;
}

const ToolContext = createContext<ToolContextType | undefined>(undefined);

export const useToolEditor = () => {
  const ctx = useContext(ToolContext);
  if (!ctx) throw new Error("useToolEditor must be used within ToolEditorProvider");
  return ctx;
};

const SimpleToolProvider: React.FC<{
  tool: Tool;
  onToolChange: (tool: Tool) => void;
  children: React.ReactNode;
}> = ({ tool, onToolChange, children }) => {
  return <ToolContext.Provider value={{ tool, setTool: onToolChange }}>{children}</ToolContext.Provider>;
};

export const RequestEditorModal: React.FC<RequestEditorModalProps> = ({ open, onOpenChange, tool, onSave }) => {
  const [localTool, setLocalTool] = useState<Tool>(tool);

  React.useEffect(() => {
    if (tool) {
      setLocalTool(tool);
    }
  }, [tool]);

  const handleSave = () => {
    onSave?.(localTool);
    onOpenChange(false);
  };

  const handleToolChange = (updatedTool: Tool) => {
    setLocalTool(updatedTool);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col p-0">
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle>Edit Request - {tool.name}</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-auto px-6 py-4">
          <div className="mb-4">
            <p className="text-sm text-muted-foreground">Configure how tool parameters are sent in the API request.</p>
          </div>
          <SimpleToolProvider tool={localTool} onToolChange={handleToolChange}>
            <ToolRequestParametersEditor />
          </SimpleToolProvider>
        </div>

        <div className="flex justify-end gap-2 px-6 py-4 border-t bg-muted/30">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} className="gap-2">
            <Save className="h-4 w-4" />
            Save Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
