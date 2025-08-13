import type { McpServer, Tool } from "@agentbridge/api";
import React, { createContext, useContext, useState } from "react";

interface ToolEditorContextType {
  tool: Tool | null;
  setTool: (tool: Tool) => void;
  server?: McpServer;
}

const ToolEditorContext = createContext<ToolEditorContextType | undefined>(undefined);

export const useToolEditor = () => {
  const ctx = useContext(ToolEditorContext);
  if (!ctx) throw new Error("useToolEditor must be used within ToolEditorProvider");
  return ctx;
};

export const ToolEditorProvider: React.FC<{
  initialTool: Tool | null;
  server?: McpServer;
  children: React.ReactNode;
}> = ({ initialTool, server, children }) => {
  const [tool, setTool] = useState<Tool | null>(initialTool);
  return <ToolEditorContext.Provider value={{ tool, setTool, server }}>{children}</ToolEditorContext.Provider>;
};
