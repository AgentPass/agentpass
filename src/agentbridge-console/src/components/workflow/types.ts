import { McpServer, Tool } from "@agentbridge/api";
import { Edge, Node } from "@xyflow/react";

// Workflow node types
export type WorkflowNodeType =
  | "llm"
  | "server"
  | "tool"
  | "auth"
  | "auth-provider"
  | "api-endpoint"
  | "api-gateway"
  | "request"
  | "response"
  | "start"
  | "end";

// Base node data interface
export interface BaseNodeData {
  label: string;
  description?: string;
  status?: "active" | "inactive" | "error";
  onUpdate?: (updatedData: Partial<BaseNodeData>) => void;
  [key: string]: unknown;
}

// Tool node data interface
export interface ToolNodeData extends BaseNodeData {
  tool: Tool;
  serverId: string;
  serverName: string;
  parameters?: Record<string, unknown>;
  enabled?: boolean;
}

// Server node data interface
export interface ServerNodeData extends BaseNodeData {
  server: McpServer;
  tools: Tool[];
  connectionStatus: "connected" | "disconnected" | "connecting";
  onAddTool?: () => void;
}

// API endpoint node data interface
export interface ApiEndpointNodeData extends BaseNodeData {
  endpoint?: string;
  url?: string;
  method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  headers?: Record<string, string>;
  body?: unknown;
}

// API Gateway node data interface
export interface ApiGatewayNodeData extends BaseNodeData {
  connectionCount: number;
  methodCounts: {
    GET: number;
    POST: number;
    PUT: number;
    PATCH: number;
    DELETE: number;
  };
}

// Auth node data interface
export interface AuthNodeData extends BaseNodeData {
  authToolCount: number;
  providers: string[];
}

// Auth Provider node data interface
export interface AuthProviderNodeData extends BaseNodeData {
  providerId: string;
  providerName: string;
  providerType: "oauth" | "apikey";
  connectedToolsCount: number;
  hasClientId?: boolean; // Add validation flag for OAuth providers
  onDelete?: () => void;
  onInfo?: () => void;
}

// Start/End node data interface
export interface StartEndNodeData extends BaseNodeData {
  type: "start" | "end";
}

// LLM node data interface
export interface LLMNodeData extends BaseNodeData {
  serverId: string;
  serverName: string;
}

// Union type for all node data
export type WorkflowNodeData =
  | LLMNodeData
  | ServerNodeData
  | ToolNodeData
  | AuthNodeData
  | AuthProviderNodeData
  | ApiEndpointNodeData
  | ApiGatewayNodeData
  | StartEndNodeData;

// Workflow node interface
export interface WorkflowNode extends Node<WorkflowNodeData> {
  type: WorkflowNodeType;
}

// Workflow edge data interface
export interface WorkflowEdgeData {
  label?: string;
  condition?: string;
  animated?: boolean;
  style?: React.CSSProperties;
  onDelete?: () => void;
  showAddButton?: boolean;
  onAddAuth?: () => void;
  showAnalyzeButton?: boolean;
  onAnalyze?: () => void;
  [key: string]: unknown;
}

// Workflow edge interface
export type WorkflowEdge = Edge<WorkflowEdgeData>;

// Workflow definition interface
export interface WorkflowDefinition {
  id: string;
  name: string;
  description?: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  metadata?: {
    version: string;
    createdAt: string;
    updatedAt: string;
    author?: string;
  };
}

// Workflow execution context
export interface WorkflowExecutionContext {
  workflowId: string;
  nodeId: string;
  input: unknown;
  output?: unknown;
  error?: string;
  timestamp: string;
  executionTime?: number;
}

// Workflow validation result
export interface WorkflowValidationResult {
  isValid: boolean;
  errors: Array<{
    nodeId?: string;
    edgeId?: string;
    message: string;
    type: "error" | "warning";
  }>;
}
