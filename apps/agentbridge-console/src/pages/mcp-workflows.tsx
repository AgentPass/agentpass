import { api } from "@/api";
import McpIconSvg from "@/assets/mcp-icon.svg";
import { CreateToolDialog } from "@/components/tools/createToolDialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AuthProviderItem } from "@/components/workflow/DraggableAuthProviderItem";
import { edgeTypes } from "@/components/workflow/edges";
import { AuthProviderEditModal } from "@/components/workflow/modals/AuthProviderEditModal";
import { AuthProviderSelectDialog } from "@/components/workflow/modals/AuthProviderSelectDialog";
import { EnhancedToolCreationSidePanel } from "@/components/workflow/modals/EnhancedToolCreationSidePanel";
import { ToolDebugModal } from "@/components/workflow/modals/ToolDebugModal";
import { ToolEditorModal } from "@/components/workflow/modals/ToolEditorModal";
import { nodeTypes } from "@/components/workflow/nodes";
import {
  ApiEndpointNodeData,
  AuthProviderNodeData,
  LLMNodeData,
  ServerNodeData,
  ToolNodeData,
  WorkflowEdge,
  WorkflowNode,
} from "@/components/workflow/types";
import { WorkflowAuthProvidersPanel } from "@/components/workflow/WorkflowAuthProvidersPanel";
import { WorkflowToolsPanel } from "@/components/workflow/WorkflowToolsPanel";
import { trackEvent } from "@/utils/analytics";
import { log } from "@/utils/log";
import {
  CreateToolRequest,
  McpServer,
  OAuthProvider,
  Tool,
  Folder as ToolFolder,
  UpdateToolRequest,
} from "@agentbridge/api";
import { AnalyticsEvents } from "@agentbridge/utils";
import {
  Background,
  BackgroundVariant,
  Connection,
  Controls,
  ReactFlow,
  ReactFlowProvider,
  addEdge,
  useEdgesState,
  useNodesState,
  useReactFlow,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useCallback, useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";

interface ServerContextType {
  server: McpServer;
}
const MCPWorkflowsPageInner = () => {
  const { server } = useOutletContext<ServerContextType>();
  const [nodes, setNodes, onNodesChange] = useNodesState<WorkflowNode>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<WorkflowEdge>([]);
  const [tools, setTools] = useState<Tool[]>([]);
  const [loading, setLoading] = useState(true);
  // const [saving, setSaving] = useState(false);
  const [showToolEditor, setShowToolEditor] = useState(false);
  const [showToolDebugModal, setShowToolDebugModal] = useState(false);
  const [selectedToolData, setSelectedToolData] = useState<ToolNodeData | null>(null);
  const [isRequestEditing, setIsRequestEditing] = useState(false);
  const [isResponseEditing, setIsResponseEditing] = useState(false);
  const [showApiGatewayModal, setShowApiGatewayModal] = useState(false);
  const [shouldRefreshWorkflow, setShouldRefreshWorkflow] = useState(false);
  const [selectedEdge, setSelectedEdge] = useState<WorkflowEdge | null>(null);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [selectedProviderNode, setSelectedProviderNode] = useState<WorkflowNode | null>(null);
  const [showProviderDeleteConfirmation, setShowProviderDeleteConfirmation] = useState(false);
  const [showAuthProvidersPanel, setShowAuthProvidersPanel] = useState(false);
  const [draggedType, setDraggedType] = useState<AuthProviderItem | null>(null);
  const [oauthProviders, setOauthProviders] = useState<OAuthProvider[]>([]);
  const [authProviderItems, setAuthProviderItems] = useState<AuthProviderItem[]>([]);
  const [showAuthSelectDialog, setShowAuthSelectDialog] = useState(false);
  const [selectedToolForAuth, setSelectedToolForAuth] = useState<string | null>(null);
  const [showCreateToolDialog, setShowCreateToolDialog] = useState(false);
  const [showToolCreationSidePanel, setShowToolCreationSidePanel] = useState(false);
  const [folders, setFolders] = useState<ToolFolder[]>([]);
  const [showAuthProviderEditModal, setShowAuthProviderEditModal] = useState(false);
  const [selectedAuthProviderId, setSelectedAuthProviderId] = useState<string | null>(null);
  const { screenToFlowPosition } = useReactFlow();

  // Connection validation
  const isValidConnection = useCallback(
    (connection: Connection | WorkflowEdge) => {
      const sourceNode = nodes.find((n) => n.id === connection.source);
      const targetNode = nodes.find((n) => n.id === connection.target);

      if (!sourceNode || !targetNode) return false;

      // Allow connections from tool nodes to auth provider nodes
      if (sourceNode.type === "tool" && targetNode.type === "auth-provider") {
        const toolData = sourceNode.data as unknown as ToolNodeData;
        const providerData = targetNode.data as unknown as AuthProviderNodeData;

        // Check if tool already has this type of auth
        if (providerData.providerType === "oauth" && toolData.tool.oAuthProviderId) {
          return false; // Already has OAuth
        }
        if (providerData.providerType === "apikey" && toolData.tool.apiKeyProviderId) {
          return false; // Already has API Key
        }

        return true;
      }

      // Allow other standard connections
      return true;
    },
    [nodes],
  );

  const onConnect = useCallback(
    (params: Connection) => {
      // Check if this is a tool-to-auth connection
      const sourceNode = nodes.find((n) => n.id === params.source);
      const targetNode = nodes.find((n) => n.id === params.target);

      if (sourceNode?.type === "tool" && targetNode?.type === "auth-provider") {
        // Update tool with the selected auth provider
        const toolData = sourceNode.data as unknown as ToolNodeData;
        const providerData = targetNode.data as unknown as AuthProviderNodeData;

        // Set the selected tool and provider for the modal
        setSelectedToolData(toolData);

        // Update the tool with the provider ID
        const updateRequest: UpdateToolRequest = {
          providerId: providerData.providerId,
        };

        api.tools
          .updateTool(server.id, toolData.tool.id, updateRequest)
          .then(() => {
            // Update local state
            const updatedTool = {
              ...toolData.tool,
              [providerData.providerType === "oauth" ? "oAuthProviderId" : "apiKeyProviderId"]: providerData.providerId,
            };
            return updatedTool;

            setTools((prevTools) => prevTools.map((t) => (t.id === toolData.tool.id ? updatedTool : t)));

            // Trigger workflow refresh
            setShouldRefreshWorkflow(true);
          })
          .catch((error) => {
            log.error("Failed to update tool:", error);
          });

        // Don't create the edge manually - let the refresh handle it
        return;
      }

      // For other connections, create the edge normally
      setEdges((eds: WorkflowEdge[]) => addEdge(params, eds));
    },
    [nodes, setEdges, server.id],
  );

  // Handle click on nodes
  const onNodeClick = useCallback((event: React.MouseEvent, node: WorkflowNode) => {
    event.stopPropagation();
    if (node.type === "api-gateway") {
      setShowApiGatewayModal(true);
    } else if (node.type === "auth-provider") {
      // Clicking auth provider node - user can select and press Delete key to remove
      // The node will be highlighted/selected by ReactFlow automatically
    }
    // Tool nodes no longer open edit modal on click - use toolbar edit button instead
  }, []);

  // Handle click on edges
  const onEdgeClick = useCallback((event: React.MouseEvent, edge: WorkflowEdge) => {
    event.stopPropagation();
    // Only allow deletion of auth-related edges
    if (edge.id.includes("tool-provider")) {
      setSelectedEdge(edge);
      setShowDeleteConfirmation(true);
    }
  }, []);

  // Handle edge deletion
  const handleDeleteEdge = useCallback(async () => {
    if (!selectedEdge) return;

    // Extract tool ID from edge ID (format: edge-tool-provider-{toolId}-{oauth|apikey})
    const match = selectedEdge.id.match(/edge-tool-provider-(.+)-(oauth|apikey)$/);
    if (!match) return;

    const toolId = match[1];
    const tool = tools.find((t) => t.id === toolId);

    if (tool) {
      try {
        // Update the tool via API - only send fields that UpdateToolRequest accepts
        const updateRequest: UpdateToolRequest = {
          providerId: null, // This removes authentication
        };

        await api.tools.updateTool(server.id, tool.id, updateRequest);

        // Update local state
        const updatedTool = {
          ...tool,
          oAuthProviderId: null,
          apiKeyProviderId: null,
        };

        setTools((prevTools) => prevTools.map((t) => (t.id === tool.id ? updatedTool : t)));

        // Trigger workflow refresh
        setShouldRefreshWorkflow(true);
      } catch (error) {
        log.error("Failed to remove authentication:", error);
      }
    }

    setShowDeleteConfirmation(false);
    setSelectedEdge(null);
  }, [selectedEdge, tools, server.id]);

  // Handle auth provider selection from dialog
  const handleAuthProviderSelected = useCallback(
    async (providerId: string) => {
      if (!selectedToolForAuth) return;

      const tool = tools.find((t) => t.id === selectedToolForAuth);
      const authProvider = authProviderItems.find((p) => p.id === providerId);

      if (!tool || !authProvider) return;

      try {
        // Update the tool via API
        const updateRequest: UpdateToolRequest = {
          providerId: authProvider.type === "oauth" ? providerId : null,
        };

        trackEvent(AnalyticsEvents.OAUTH_FLOW_SELECTED, {
          provider_id: providerId,
        });

        await api.tools.updateTool(server.id, tool.id, updateRequest);

        // Update local state
        const updatedTool = {
          ...tool,
          oAuthProviderId: authProvider.type === "oauth" ? providerId : tool.oAuthProviderId,
          apiKeyProviderId: authProvider.type === "apikey" ? providerId : tool.apiKeyProviderId,
        };

        setTools((prevTools) => prevTools.map((t) => (t.id === tool.id ? updatedTool : t)));

        // Trigger workflow refresh
        setShouldRefreshWorkflow(true);

        // Close dialog
        setShowAuthSelectDialog(false);
        setSelectedToolForAuth(null);
      } catch (error) {
        log.error("Failed to update tool with auth provider:", error);
      }
    },
    [selectedToolForAuth, tools, authProviderItems, server.id],
  );

  // Handle provider node deletion
  const handleProviderNodeDelete = useCallback(async () => {
    if (!selectedProviderNode || selectedProviderNode.type !== "auth-provider") return;

    const providerData = selectedProviderNode.data as AuthProviderNodeData;
    const { providerId, providerType } = providerData;

    try {
      // Find all tools connected to this provider
      const connectedTools = tools.filter((tool) => {
        if (providerType === "oauth") {
          return tool.oAuthProviderId === providerId;
        } else {
          return tool.apiKeyProviderId === providerId;
        }
      });

      // Remove authentication from all connected tools
      await Promise.all(
        connectedTools.map((tool) => {
          const updateRequest: UpdateToolRequest = {
            providerId: null,
          };
          return api.tools.updateTool(server.id, tool.id, updateRequest);
        }),
      );

      // Update local state
      setTools((prevTools) =>
        prevTools.map((tool) => {
          if (providerType === "oauth" && tool.oAuthProviderId === providerId) {
            return { ...tool, oAuthProviderId: null };
          } else if (providerType === "apikey" && tool.apiKeyProviderId === providerId) {
            return { ...tool, apiKeyProviderId: null };
          }
          return tool;
        }),
      );

      // Trigger workflow refresh
      setShouldRefreshWorkflow(true);
    } catch (error) {
      log.error("Failed to delete provider node:", error);
    }

    setShowProviderDeleteConfirmation(false);
    setSelectedProviderNode(null);
  }, [selectedProviderNode, tools, server.id]);

  // Handle node deletion (for ReactFlow's built-in delete)
  const onNodesDelete = useCallback(
    (nodesToDelete: WorkflowNode[]) => {
      // Check if any auth provider nodes are being deleted
      const providerNodes = nodesToDelete.filter((node) => node.type === "auth-provider");
      for (const node of nodesToDelete) {
        trackEvent(AnalyticsEvents.MCP_NODE_DELETED, {
          node_id: node.id,
          node_type: node.type,
        });
      }

      if (providerNodes.length > 0) {
        // For now, handle only the first provider node
        setSelectedProviderNode(providerNodes[0]);
        setShowProviderDeleteConfirmation(true);
        // Prevent the actual deletion - we'll handle it manually after confirmation
        return;
      }

      // For other node types, let ReactFlow handle the deletion
      setNodes((nodes: WorkflowNode[]) => nodes.filter((node) => !nodesToDelete.some((n) => n.id === node.id)));
    },
    [setNodes],
  );

  // Handle auth provider drop from panel
  const handleAuthProviderDrop = useCallback(
    (provider: AuthProviderItem, position: { x: number; y: number }) => {
      // Find the actual OAuth provider to check clientId
      const oauthProvider = oauthProviders.find((p) => p.id === provider.id);
      const hasClientId = oauthProvider?.clientId ? oauthProvider.clientId.trim().length > 0 : false;

      // Create a new auth provider node
      const nodeId = `auth-provider-${provider.id}-${Date.now()}`;

      trackEvent(AnalyticsEvents.OAUTH_FLOW_DROP, {
        provider_id: provider.id,
        provider_type: provider.type,
      });

      const newNode: WorkflowNode = {
        id: nodeId,
        type: "auth-provider",
        position,
        data: {
          label: provider.name,
          providerId: provider.id,
          providerName: provider.name,
          providerType: provider.type,
          connectedToolsCount: 0,
          hasClientId, // Add validation flag
          onDelete: () => {
            setSelectedProviderNode(nodes.find((n) => n.id === nodeId) as WorkflowNode | null);
            setShowProviderDeleteConfirmation(true);
          },
          onInfo: () => {
            // Open auth provider edit modal
            // Auth provider clicked
            if (oauthProvider) {
              setSelectedAuthProviderId(provider.id);
              setShowAuthProviderEditModal(true);
            } else {
              // No OAuth provider found for ID
            }
          },
        } as AuthProviderNodeData,
      };
      setNodes((nodes: WorkflowNode[]) => [...nodes, newNode]);
    },
    [setNodes, nodes, oauthProviders],
  );

  // Handle tool creation from panel or dialog
  const handleToolCreated = useCallback(
    async (tool: Tool) => {
      try {
        // Refresh the tools data from the API to get the latest state
        const serverTools = await api.tools.getTools(server.id);
        setTools(serverTools);
        // Close the dialog if it's open
        setShowCreateToolDialog(false);
        // Trigger workflow refresh
        setShouldRefreshWorkflow(true);
      } catch (error) {
        log.error("Failed to refresh tools:", error);
        // Fallback: add the tool to the current tools array
        setTools((prevTools) => [...prevTools, tool]);
      }
    },
    [server.id],
  );

  // Handle tool creation from dialog
  const handleCreateToolFromDialog = useCallback(
    async (toolData: Partial<Tool>) => {
      try {
        const newTool = await api.tools.createTool(server.id, toolData as CreateToolRequest);
        trackEvent(AnalyticsEvents.MCP_TOOL_CREATE_COMPLETED, {
          tool_id: newTool.id,
        });
        await handleToolCreated(newTool);
      } catch (error) {
        log.error("Failed to create tool:", error);
        trackEvent(AnalyticsEvents.MCP_TOOL_CREATE_FAILED, {
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    },
    [server.id, handleToolCreated],
  );

  // Handle auth provider update
  const handleAuthProviderUpdated = useCallback(
    (updatedProvider: OAuthProvider) => {
      // Update the OAuth providers list

      trackEvent(AnalyticsEvents.OAUTH_FLOW_UPDATE, {
        client_id: updatedProvider.clientId,
        provider_id: updatedProvider.id,
      });

      setOauthProviders((prev) => prev.map((p) => (p.id === updatedProvider.id ? updatedProvider : p)));

      // Update nodes to refresh validation state
      setNodes((prev) =>
        prev.map((node) => {
          if (node.type === "auth-provider" && node.data.providerId === updatedProvider.id) {
            const hasClientId = updatedProvider.clientId ? updatedProvider.clientId.trim().length > 0 : false;
            return {
              ...node,
              data: {
                ...node.data,
                hasClientId,
                providerName: updatedProvider.name,
              },
            };
          }
          return node;
        }),
      );
    },
    [setNodes],
  );

  // Update node data function
  const updateNodeData = useCallback(
    (nodeId: string, updatedData: Partial<WorkflowNode["data"]>) => {
      setNodes((nodes: WorkflowNode[]) =>
        nodes.map((node: WorkflowNode) => {
          if (node.id === nodeId) {
            return {
              ...node,
              data: {
                ...node.data,
                ...updatedData,
              },
            };
          }
          return node;
        }),
      );

      // Update edge colors if tool enabled status changed
      if (updatedData.status || (updatedData as ToolNodeData).enabled !== undefined) {
        const toolData = updatedData as ToolNodeData;
        const isEnabled = toolData.enabled ?? updatedData.status === "active";

        setEdges((edges: WorkflowEdge[]) =>
          edges.map((edge: WorkflowEdge) => {
            if (edge.target === nodeId) {
              return {
                ...edge,
                animated: isEnabled,
                style: {
                  ...edge.style,
                  stroke: isEnabled ? "#22c55e" : "#9ca3af",
                  strokeWidth: 2,
                },
              };
            }
            return edge;
          }),
        );
      }
    },
    [setNodes, setEdges],
  );

  // Handle tool editor save
  const handleToolEditorSave = useCallback(
    (updatedData: Partial<ToolNodeData>) => {
      if (selectedToolData && updatedData.tool) {
        const oldTool = selectedToolData.tool;
        const newTool = updatedData.tool;

        // Check if authentication was added
        const authAdded =
          !oldTool.oAuthProviderId &&
          !oldTool.apiKeyProviderId &&
          (newTool.oAuthProviderId || newTool.apiKeyProviderId);

        trackEvent(AnalyticsEvents.MCP_TOOL_UPDATE_COMPLETED, {
          tool_id: updatedData.tool?.id,
          auth_added: authAdded,
        });

        // Update the tool in the tools array
        setTools((prevTools) =>
          prevTools.map((tool) => (tool.id === selectedToolData.tool.id ? updatedData.tool! : tool)),
        );

        // If auth was added, trigger workflow refresh
        if (authAdded) {
          setShouldRefreshWorkflow(true);
        } else {
          // Otherwise just update the node data
          const toolNodeId = `tool-${updatedData.tool.id}`;
          updateNodeData(toolNodeId, {
            ...updatedData,
            tool: updatedData.tool,
          });
        }
      }
    },
    [selectedToolData, updateNodeData],
  );

  // Fetch tools data function
  const fetchTools = useCallback(async () => {
    try {
      setLoading(true);
      const serverTools = await api.tools.getTools(server.id);
      setTools(serverTools);
    } catch (error) {
      log.error("Failed to fetch tools:", error);
    } finally {
      setLoading(false);
    }
  }, [server.id]);

  // Fetch OAuth providers
  const fetchOAuthProviders = useCallback(async () => {
    try {
      const providers = await api.authProviders.getProviders();
      setOauthProviders(providers);

      // Will update auth provider items in a separate effect
    } catch (error) {
      log.error("Failed to fetch OAuth providers:", error);
    }
  }, []);

  // Update auth provider items when providers change
  useEffect(() => {
    const authItems: AuthProviderItem[] = [
      ...oauthProviders.map((provider) => ({
        id: provider.id,
        name: provider.name,
        type: "oauth" as const,
        provider,
      })),
      // API key providers will be added when backend support is available
    ];
    setAuthProviderItems(authItems);
  }, [oauthProviders]);

  // Fetch folders
  const fetchFolders = useCallback(async () => {
    try {
      const foldersData = await api.tools.getToolFolders(server.id);
      setFolders(foldersData);
    } catch (error) {
      log.error("Failed to fetch folders:", error);
    }
  }, [server.id]);

  // Generate initial nodes from fetched data
  const generateInitialNodes = useCallback(
    (serverData: McpServer, toolsData: Tool[], authProviders: OAuthProvider[]) => {
      const newNodes: WorkflowNode[] = [];
      const newEdges: WorkflowEdge[] = [];

      // Linear horizontal layout
      const nodeSpacing = 280;
      const verticalSpacing = 180;
      let currentX = 100;
      const centerY = 300;

      // Create LLM node
      const llmNode: WorkflowNode = {
        id: `llm-${serverData.id}`,
        type: "llm",
        position: { x: currentX, y: centerY },
        data: {
          label: "LLM Clients",
          serverId: serverData.id,
          serverName: serverData.name,
          status: "active",
        } as LLMNodeData,
      };
      newNodes.push(llmNode);

      // Update X position
      currentX += nodeSpacing;

      // Create MCP Server node (simple square)
      const serverNode: WorkflowNode = {
        id: `server-${serverData.id}`,
        type: "server",
        position: { x: currentX, y: centerY },
        data: {
          label: serverData.name,
          description: serverData.description,
          server: serverData,
          tools: toolsData,
          connectionStatus: "connected",
          onAddTool: () => {
            setShowToolCreationSidePanel(true);
          },
        } as ServerNodeData,
      };
      newNodes.push(serverNode);

      // Create edge from LLM to Server
      const llmToServerEdge: WorkflowEdge = {
        id: `edge-llm-server-${serverData.id}`,
        source: llmNode.id,
        target: serverNode.id,
        sourceHandle: "source",
        targetHandle: "target",
        animated: true,
        style: {
          stroke: "#64748b",
          strokeWidth: 2,
        },
        label: "calls a tool",
        labelStyle: {
          fontSize: "12px",
          fontWeight: 500,
          fill: "#64748b",
        },
      };
      newEdges.push(llmToServerEdge);

      // Update X position
      currentX += nodeSpacing;

      // Create individual tool nodes in a vertical layout
      let toolY = centerY - ((toolsData.length - 1) * verticalSpacing) / 2;

      toolsData.forEach((tool, index) => {
        const toolNode: WorkflowNode = {
          id: `tool-${tool.id}`,
          type: "tool",
          position: {
            x: currentX,
            y: toolY,
          },
          data: {
            label: tool.name,
            description: tool.description,
            tool: tool,
            serverId: serverData.id,
            serverName: serverData.name,
            enabled: tool.enabled || false,
            status: tool.enabled ? "active" : "inactive",
            onUpdate: (updatedData: Partial<ToolNodeData>) => {
              // TODO: Implement update logic
            },
          } as ToolNodeData,
        };
        newNodes.push(toolNode);

        // Create edge from Server to Tool
        const serverToToolEdge: WorkflowEdge = {
          id: `edge-server-tool-${tool.id}`,
          source: serverNode.id,
          target: toolNode.id,
          sourceHandle: "source",
          targetHandle: "target",
          style: {
            stroke: "#64748b",
            strokeWidth: 2,
          },
        };
        newEdges.push(serverToToolEdge);

        // Calculate positions for the flow
        // We need to account for auth provider if present
        const hasAuth = tool.oAuthProviderId || tool.apiKeyProviderId;
        const nextX = currentX + nodeSpacing;

        // Position calculations - all nodes use consistent spacing
        const authX = hasAuth ? nextX : 0;
        const apiX = hasAuth ? nextX + nodeSpacing : nextX;

        // Create API endpoint node
        const apiEndpointNode: WorkflowNode = {
          id: `api-endpoint-${tool.id}`,
          type: "api-endpoint",
          position: {
            x: apiX,
            y: toolY,
          },
          data: {
            label: "HTTP Request",
            url: tool.url || "/api/" + tool.name.toLowerCase().replace(/\s+/g, "-"),
            method: tool.method || "GET",
            onEditRequest: () => {
              const toolData: ToolNodeData = {
                label: tool.name,
                description: tool.description,
                tool: tool,
                serverId: server.id,
                serverName: server.name,
                enabled: tool.enabled || false,
                status: tool.enabled ? "active" : "inactive",
              };
              setSelectedToolData(toolData);
              setIsRequestEditing(true);
              setShowToolEditor(true);
            },
            onEditResponse: () => {
              const toolData: ToolNodeData = {
                label: tool.name,
                description: tool.description,
                tool: tool,
                serverId: server.id,
                serverName: server.name,
                enabled: tool.enabled || false,
                status: tool.enabled ? "active" : "inactive",
              };
              setSelectedToolData(toolData);
              setIsResponseEditing(true);
              setShowToolEditor(true);
            },
          } as ApiEndpointNodeData,
        };
        newNodes.push(apiEndpointNode);

        // If tool has auth, create auth provider node between tool and request
        if (hasAuth) {
          const authProviderId = tool.oAuthProviderId || tool.apiKeyProviderId;
          const authProviderType = tool.oAuthProviderId ? "oauth" : "apikey";

          // Find provider name and validation data
          let providerName = authProviderId;
          let hasClientId = true; // Default to true for API key providers

          if (authProviderType === "oauth") {
            const oauthProvider = authProviders.find((p) => p.id === authProviderId);
            if (oauthProvider) {
              providerName = oauthProvider.name;
              hasClientId = oauthProvider.clientId ? oauthProvider.clientId.trim().length > 0 : false;
            } else {
              hasClientId = false; // Provider not found
            }
          }

          const authProviderNode: WorkflowNode = {
            id: `auth-provider-${tool.id}-${authProviderId}`,
            type: "auth-provider",
            position: {
              x: authX,
              y: toolY,
            },
            data: {
              label: providerName,
              providerId: authProviderId,
              providerName: providerName,
              providerType: authProviderType,
              connectedToolsCount: 1,
              hasClientId, // Add validation flag
              onDelete: () => {
                const node = newNodes.find((n) => n.id === `auth-provider-${tool.id}-${authProviderId}`);
                if (node) {
                  setSelectedProviderNode(node);
                  setShowProviderDeleteConfirmation(true);
                }
              },
              onInfo: () => {
                // Open auth provider edit modal
                // Auth provider clicked (existing)
                if (authProviderType === "oauth" && authProviderId) {
                  setSelectedAuthProviderId(authProviderId);
                  setShowAuthProviderEditModal(true);
                } else {
                  // Not an OAuth provider, no edit dialog
                }
              },
            } as AuthProviderNodeData,
          };
          newNodes.push(authProviderNode);

          // Create edges: Tool -> Auth -> Request -> API -> Response
          const toolToAuthEdge: WorkflowEdge = {
            id: `edge-tool-auth-${tool.id}`,
            source: toolNode.id,
            target: authProviderNode.id,
            sourceHandle: "source",
            targetHandle: "target",
            type: "deletable",
            style: {
              stroke: "#64748b",
              strokeWidth: 2,
              strokeDasharray: "5 5",
            },
            data: {
              label: authProviderType === "oauth" ? "OAuth" : "API Key",
            },
          };
          newEdges.push(toolToAuthEdge);

          const authToApiEdge: WorkflowEdge = {
            id: `edge-auth-api-${tool.id}`,
            source: authProviderNode.id,
            target: apiEndpointNode.id,
            sourceHandle: "source",
            targetHandle: "target",
            style: {
              stroke: "#64748b",
              strokeWidth: 2,
            },
          };
          newEdges.push(authToApiEdge);
        } else {
          // Direct connection from Tool to API Endpoint with add auth button
          const toolToApiEdge: WorkflowEdge = {
            id: `edge-tool-api-${tool.id}`,
            source: toolNode.id,
            target: apiEndpointNode.id,
            sourceHandle: "source",
            targetHandle: "target",
            type: "toolToApi",
            style: {
              stroke: "#64748b",
              strokeWidth: 2,
            },
            data: {
              showAddButton: true,
              onAddAuth: () => {
                setSelectedToolForAuth(tool.id);
                setShowAuthSelectDialog(true);
              },
            },
          };
          newEdges.push(toolToApiEdge);
        }

        toolY += verticalSpacing;
      });

      setNodes(newNodes);
      setEdges(newEdges);
    },
    [setNodes, setEdges, setSelectedProviderNode, setShowProviderDeleteConfirmation, server.id, server.name],
  );

  // Fetch tools data for the current server
  useEffect(() => {
    fetchTools();
    fetchOAuthProviders();
    fetchFolders();
  }, [fetchTools, fetchOAuthProviders, fetchFolders]);

  // Regenerate workflow whenever tools change
  useEffect(() => {
    if (tools.length > 0 || !loading) {
      generateInitialNodes(server, tools, oauthProviders);
    }
  }, [tools, server, generateInitialNodes, oauthProviders, loading]);

  // Handle workflow refresh when authentication is added
  useEffect(() => {
    if (shouldRefreshWorkflow && tools.length > 0) {
      generateInitialNodes(server, tools, oauthProviders);
      setShouldRefreshWorkflow(false);
    }
  }, [shouldRefreshWorkflow, tools, server, generateInitialNodes, oauthProviders]);

  // Handle debug tool
  const handleDebugTool = useCallback((toolData: ToolNodeData) => {
    setSelectedToolData(toolData);
    setShowToolDebugModal(true);
  }, []);

  // Handle edit tool
  const handleEditTool = useCallback((toolData: ToolNodeData) => {
    setSelectedToolData(toolData);
    setIsRequestEditing(false);
    setIsResponseEditing(false);
    setShowToolEditor(true);
  }, []);

  // Handle drag over event
  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  // Handle drop event
  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      // Check if we have a dragged provider
      if (!draggedType) {
        return;
      }

      // Get the position where the node was dropped
      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      // Check if we're dropping on a tool node
      const targetElement = event.target as HTMLElement;
      const toolNodeElement = targetElement.closest("[data-id]");

      if (toolNodeElement) {
        const nodeId = toolNodeElement.getAttribute("data-id");
        const targetNode = nodes.find((n) => n.id === nodeId);

        if (targetNode && targetNode.type === "tool") {
          // Dropped on a tool node - create connection
          const toolData = targetNode.data as unknown as ToolNodeData;
          const canAccept =
            (draggedType.type === "oauth" && !toolData.tool.oAuthProviderId) ||
            (draggedType.type === "apikey" && !toolData.tool.apiKeyProviderId);

          if (canAccept) {
            // Update the tool with the auth provider
            const updateRequest: UpdateToolRequest = {
              providerId: draggedType.id,
            };

            api.tools
              .updateTool(server.id, toolData.tool.id, updateRequest)
              .then(() => {
                // Update local state
                const updatedTool = {
                  ...toolData.tool,
                  [draggedType.type === "oauth" ? "oAuthProviderId" : "apiKeyProviderId"]: draggedType.id,
                };
                return updatedTool;

                setTools((prevTools) => prevTools.map((t) => (t.id === toolData.tool.id ? updatedTool : t)));

                // Trigger workflow refresh
                setShouldRefreshWorkflow(true);
              })
              .catch((error) => {
                log.error("Failed to update tool with auth provider:", error);
              });

            setDraggedType(null);
            return;
          }
        }
      }

      // Not dropped on a tool - create new auth provider node
      handleAuthProviderDrop(draggedType, position);
      setDraggedType(null); // Clear the dragged type
    },
    [screenToFlowPosition, handleAuthProviderDrop, draggedType, nodes, server.id, setTools],
  );

  if (loading) {
    return (
      <div className="w-full h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading MCP servers and tools...</p>
        </div>
      </div>
    );
  }

  // Empty state when no tools exist
  if (!loading && tools.length === 0) {
    return (
      <div className="w-full h-screen bg-gray-50 flex flex-col">
        {/* Top Tools Navigation */}
        <WorkflowToolsPanel
          serverId={server.id}
          onToolCreated={handleToolCreated}
          onOpenToolCreationSidePanel={() => setShowToolCreationSidePanel(true)}
        />

        {/* Empty State */}
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-primary"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No tools yet</h3>
            <p className="text-gray-600 mb-6">
              Get started by creating your first tool. Tools allow your AI agents to interact with external APIs and
              services.
            </p>
            <Button onClick={() => setShowToolCreationSidePanel(true)} size="lg" className="gap-2">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create your first tool
            </Button>
          </div>
        </div>

        {/* Tool Creation Side Panel */}
        <EnhancedToolCreationSidePanel
          isOpen={showToolCreationSidePanel}
          serverId={server.id}
          existingTools={tools}
          folders={folders}
          authProviders={{
            oauth: oauthProviders,
          }}
          onClose={() => setShowToolCreationSidePanel(false)}
          onCreateManually={() => {
            setShowToolCreationSidePanel(false);
            setShowCreateToolDialog(true);
          }}
          onImportOpenAPI={() => {
            // OpenAPI import is now handled within the side panel
          }}
          onToolsGenerated={async (createdTools, authProvider) => {
            // Tools are already created by the AI chat component, just refresh the UI
            try {
              // Refresh tools list to show the new tools in the workflow
              await handleToolCreated(createdTools[0]); // This refreshes the tools list

              // If auth provider was created, refresh those too
              if (authProvider) {
                if ("provider_type" in authProvider && authProvider.provider_type === "oauth") {
                  await fetchOAuthProviders();
                }
              }

              // Keep the side panel open so user can continue the conversation
              // Successfully created tools via AI generation
            } catch {
              // Failed to refresh after AI tool creation
            }
          }}
        />

        {/* Create Tool Dialog */}
        <CreateToolDialog
          open={showCreateToolDialog}
          onOpenChange={setShowCreateToolDialog}
          folders={folders}
          providers={oauthProviders}
          onCreate={handleCreateToolFromDialog}
        />
      </div>
    );
  }

  return (
    <div className="w-full h-screen bg-gray-50 flex flex-col">
      {/* Tool Editor Modal */}
      {selectedToolData && (
        <ToolEditorModal
          open={showToolEditor}
          onOpenChange={(open) => {
            setShowToolEditor(open);
            if (!open) {
              setSelectedToolData(null);
              setIsRequestEditing(false);
              setIsResponseEditing(false);
            }
          }}
          toolData={selectedToolData}
          onSave={handleToolEditorSave}
          defaultTab={isRequestEditing ? "request" : isResponseEditing ? "formatting" : "general"}
        />
      )}

      {/* Tool Debug Modal */}
      {selectedToolData && (
        <ToolDebugModal
          open={showToolDebugModal}
          onOpenChange={(open) => {
            setShowToolDebugModal(open);
            if (!open) {
              setSelectedToolData(null);
            }
          }}
          toolData={selectedToolData}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteConfirmation} onOpenChange={setShowDeleteConfirmation}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Authentication</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove authentication from this tool? This will delete any OAuth or API Key
              configurations.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteConfirmation(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteEdge}>
              Remove Authentication
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Provider Delete Confirmation Dialog */}
      <Dialog open={showProviderDeleteConfirmation} onOpenChange={setShowProviderDeleteConfirmation}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Authentication Provider</DialogTitle>
            <DialogDescription>
              {selectedProviderNode && (
                <>
                  Are you sure you want to delete the{" "}
                  <strong>{(selectedProviderNode.data as AuthProviderNodeData).providerName}</strong> provider? This
                  will remove authentication from{" "}
                  {(selectedProviderNode.data as AuthProviderNodeData).connectedToolsCount} connected tool
                  {(selectedProviderNode.data as AuthProviderNodeData).connectedToolsCount !== 1 ? "s" : ""}.
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowProviderDeleteConfirmation(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleProviderNodeDelete}>
              Delete Provider
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* API Gateway Modal */}
      <Dialog open={showApiGatewayModal} onOpenChange={setShowApiGatewayModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>API Gateway Overview</DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto p-1">
            {/* Statistics Row */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-muted/50 p-4 rounded-lg">
                <div className="text-2xl font-bold">{tools.length}</div>
                <div className="text-sm text-muted-foreground">Total Tools</div>
              </div>
              <div className="bg-muted/50 p-4 rounded-lg">
                <div className="text-2xl font-bold">{tools.filter((t) => t.enabled).length}</div>
                <div className="text-sm text-muted-foreground">Active Tools</div>
              </div>
              <div className="bg-muted/50 p-4 rounded-lg">
                <div className="text-2xl font-bold">{new Set(tools.map((t) => t.method)).size}</div>
                <div className="text-sm text-muted-foreground">HTTP Methods</div>
              </div>
              <div className="bg-muted/50 p-4 rounded-lg">
                <div className="text-2xl font-bold">
                  {tools.filter((t) => t.oAuthProviderId || t.apiKeyProviderId).length}
                </div>
                <div className="text-sm text-muted-foreground">With Auth</div>
              </div>
            </div>

            {/* Tools Table */}
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tool</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>API Endpoint</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Auth</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tools.map((tool) => (
                  <TableRow key={tool.id}>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                          <img src={McpIconSvg} alt="MCP Tool" className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-medium">{tool.name}</div>
                          {tool.description && (
                            <div className="text-xs text-muted-foreground truncate max-w-xs">{tool.description}</div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground">
                        {tool.method || "N/A"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="font-mono text-sm break-all">{tool.url || "Not configured"}</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <div
                          className={`w-2 h-2 rounded-full ${tool.enabled ? "bg-green-500" : "bg-muted-foreground"}`}
                        ></div>
                        <span
                          className={`text-xs font-medium ${tool.enabled ? "text-green-700 dark:text-green-400" : "text-muted-foreground"}`}
                        >
                          {tool.enabled ? "Active" : "Inactive"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {tool.oAuthProviderId || tool.apiKeyProviderId ? (
                        <div className="flex items-center space-x-1">
                          <div className="w-4 h-4 bg-yellow-500 rounded-full flex items-center justify-center">
                            <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path
                                fillRule="evenodd"
                                d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </div>
                          <span className="text-xs text-yellow-700 dark:text-yellow-400">Required</span>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">None</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {tools.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <div className="text-lg font-medium">No tools configured</div>
                <div className="text-sm">Add tools to see their API connections here</div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Auth Provider Selection Dialog */}
      <AuthProviderSelectDialog
        isOpen={showAuthSelectDialog}
        setIsOpen={setShowAuthSelectDialog}
        providers={authProviderItems}
        onSelected={handleAuthProviderSelected}
      />

      {/* Create Tool Dialog */}
      <CreateToolDialog
        open={showCreateToolDialog}
        onOpenChange={setShowCreateToolDialog}
        folders={folders}
        providers={oauthProviders}
        onCreate={handleCreateToolFromDialog}
      />

      {/* Auth Provider Edit Modal */}
      {selectedAuthProviderId && (
        <AuthProviderEditModal
          isOpen={showAuthProviderEditModal}
          onClose={() => {
            setShowAuthProviderEditModal(false);
            setSelectedAuthProviderId(null);
          }}
          providerId={selectedAuthProviderId}
          onProviderUpdated={handleAuthProviderUpdated}
        />
      )}

      {/* Enhanced Tool Creation Side Panel */}
      <EnhancedToolCreationSidePanel
        isOpen={showToolCreationSidePanel}
        serverId={server.id}
        existingTools={tools}
        folders={folders}
        authProviders={{
          oauth: oauthProviders,
        }}
        onClose={() => setShowToolCreationSidePanel(false)}
        onCreateManually={() => {
          setShowToolCreationSidePanel(false);
          setShowCreateToolDialog(true);
        }}
        onImportOpenAPI={() => {
          // OpenAPI import is now handled within the side panel
        }}
        onToolsGenerated={async (createdTools, authProvider) => {
          // Tools are already created by the AI chat component, just refresh the UI
          try {
            // Refresh tools list to show the new tools in the workflow
            await handleToolCreated(createdTools[0]); // This refreshes the tools list

            // If auth provider was created, refresh those too
            if (authProvider) {
              if ("provider_type" in authProvider && authProvider.provider_type === "oauth") {
                await fetchOAuthProviders();
              }
            }

            // Keep the side panel open so user can continue the conversation
            // Successfully created tools via AI generation
          } catch {
            // Failed to refresh after AI tool creation
          }
        }}
      />

      <style>{`
        .react-flow__controls button {
          background-color: white !important;
          border: 1px solid #e5e7eb !important;
          border-radius: 6px !important;
          box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1) !important;
          color: #374151 !important;
          font-size: 14px !important;
          font-weight: 500 !important;
          padding: 8px !important;
          margin: 2px !important;
          cursor: pointer !important;
          transition: all 0.2s ease !important;
        }
        .react-flow__controls button:hover {
          background-color: #f9fafb !important;
          border-color: #d1d5db !important;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1) !important;
        }
        .react-flow__controls button:active {
          background-color: #f3f4f6 !important;
          transform: translateY(1px) !important;
        }
        .react-flow__controls button svg {
          width: 16px !important;
          height: 16px !important;
        }
        .react-flow__minimap {
          background-color: white !important;
          border: 1px solid #e5e7eb !important;
          border-radius: 6px !important;
          box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1) !important;
        }
      `}</style>

      {/* Top Tools Navigation */}
      <WorkflowToolsPanel
        serverId={server.id}
        onToolCreated={handleToolCreated}
        onOpenToolCreationSidePanel={() => setShowToolCreationSidePanel(true)}
      />

      {/* Workflow Canvas - Full Width */}
      <div className="flex-1 h-full relative">
        {/* Auth Providers Panel */}
        {showAuthProvidersPanel && (
          <WorkflowAuthProvidersPanel
            serverId={server.id}
            onProviderDrop={handleAuthProviderDrop}
            onDragStart={setDraggedType}
            onClose={() => setShowAuthProvidersPanel(false)}
          />
        )}

        <ReactFlow
          nodes={nodes.map((node) => {
            // Add drag-related props to tool nodes
            if (node.type === "tool" && draggedType) {
              const toolData = node.data as ToolNodeData;
              const canAccept =
                (draggedType.type === "oauth" && !toolData.tool.oAuthProviderId) ||
                (draggedType.type === "apikey" && !toolData.tool.apiKeyProviderId);

              return {
                ...node,
                data: {
                  ...node.data,
                  onUpdate: (updatedData: Partial<WorkflowNode["data"]>) => updateNodeData(node.id, updatedData),
                  canAcceptDrop: canAccept,
                  onDebug: () => handleDebugTool(toolData),
                  onEdit: () => handleEditTool(toolData),
                },
              };
            }

            // Add debug handler to tool nodes
            if (node.type === "tool") {
              const toolData = node.data as ToolNodeData;
              return {
                ...node,
                data: {
                  ...node.data,
                  onUpdate: (updatedData: Partial<WorkflowNode["data"]>) => updateNodeData(node.id, updatedData),
                  onDebug: () => handleDebugTool(toolData),
                  onEdit: () => handleEditTool(toolData),
                },
              };
            }

            return {
              ...node,
              data: {
                ...node.data,
                onUpdate: (updatedData: Partial<WorkflowNode["data"]>) => updateNodeData(node.id, updatedData),
              },
            };
          })}
          edges={edges.map((edge: WorkflowEdge) => {
            // Show auth provider edges with reduced opacity when not selected
            if (edge.type === "deletable") {
              const isSelected = selectedEdge?.id === edge.id;
              const isDragging = !!draggedType;

              return {
                ...edge,
                style: {
                  ...edge.style,
                  opacity: isSelected || isDragging ? 1 : 0.6,
                  strokeWidth: isSelected ? 3 : 2,
                },
                animated: isSelected,
              };
            }
            return edge;
          })}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          isValidConnection={isValidConnection}
          onNodeClick={onNodeClick}
          onEdgeClick={onEdgeClick}
          onNodesDelete={onNodesDelete}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          nodeTypes={nodeTypes as any}
          edgeTypes={edgeTypes}
          fitView
          className="bg-gray-100"
          onDrop={onDrop}
          onDragOver={onDragOver}
        >
          <Background variant={BackgroundVariant.Dots} />
          <Controls position="top-left" />
        </ReactFlow>
      </div>
    </div>
  );
};

const MCPWorkflowsPage = () => {
  return (
    <ReactFlowProvider>
      <MCPWorkflowsPageInner />
    </ReactFlowProvider>
  );
};

export default MCPWorkflowsPage;
