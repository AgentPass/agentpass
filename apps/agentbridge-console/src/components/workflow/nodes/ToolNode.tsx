import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Tool } from "@agentbridge/api";
import { Handle, NodeProps, NodeToolbar, Position } from "@xyflow/react";
import { Key, Lock, Pencil, Play } from "lucide-react";
import React, { useCallback, useState } from "react";

export interface ToolNodeData {
  tool: Tool;
  serverId: string;
  serverName: string;
  onUpdate?: (updatedData: Partial<ToolNodeData>) => void;
  canAcceptDrop?: boolean;
  onAuthProviderDrop?: (providerId: string, providerType: "oauth" | "apikey") => void;
  onDebug?: () => void;
  onEdit?: () => void;
}

const ToolNode = ({ data, selected, id }: NodeProps) => {
  const nodeData = data as unknown as ToolNodeData;
  const { tool, canAcceptDrop, onDebug, onEdit } = nodeData;
  const isEnabled = tool.enabled;
  const [isDragOver, setIsDragOver] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const hasOAuth = !!tool.oAuthProviderId;
  const hasApiKey = !!tool.apiKeyProviderId;

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      if (canAcceptDrop) {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(true);
      }
    },
    [canAcceptDrop],
  );

  const handleDragLeave = useCallback(() => {
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    // The drag data is handled by the parent component
    // This just signals that a drop occurred on this node
  }, []);

  const handleDebugClick = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      onDebug?.();
    },
    [onDebug],
  );

  const handleEditClick = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      onEdit?.();
    },
    [onEdit],
  );

  return (
    <TooltipProvider delayDuration={300}>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          // Create a larger hover area that includes the toolbar space
          paddingTop: "50px", // Extra space for toolbar
          marginTop: "-50px", // Offset the padding to maintain visual position
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <NodeToolbar
          nodeId={id as string}
          isVisible={isHovered}
          position={Position.Top}
          style={{
            display: "flex",
            gap: "4px",
            padding: "4px",
            backgroundColor: "white",
            border: "1px solid #e5e7eb",
            borderRadius: "6px",
            boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
          }}
        >
          {onEdit && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={handleEditClick}
                  style={{
                    background: "none",
                    border: "none",
                    padding: "4px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: "4px",
                    transition: "background-color 0.2s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f3f4f6")}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                >
                  <Pencil size={16} color="#6b7280" />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Edit Tool</p>
              </TooltipContent>
            </Tooltip>
          )}
          {onDebug && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={handleDebugClick}
                  style={{
                    background: "none",
                    border: "none",
                    padding: "4px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: "4px",
                    transition: "background-color 0.2s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f3f4f6")}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                >
                  <Play size={16} color="#6b7280" />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Test Tool</p>
              </TooltipContent>
            </Tooltip>
          )}
        </NodeToolbar>
        {/* Square box with MCP logo */}
        <div
          style={{
            backgroundColor: "#ffffff",
            border: `2px solid ${isDragOver ? "#10b981" : selected ? "#ef4444" : "#64748b"}`,
            borderRadius: "8px",
            width: "80px",
            height: "80px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: isDragOver ? "0 0 0 3px rgba(16, 185, 129, 0.2)" : "0 2px 4px rgba(0, 0, 0, 0.1)",
            opacity: isEnabled ? 1 : 0.6,
            cursor: "pointer",
            position: "relative",
            transition: "all 0.2s ease",
          }}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <Handle
            type="target"
            position={Position.Left}
            id="target"
            style={{
              backgroundColor: "#64748b",
              width: "8px",
              height: "8px",
            }}
          />

          {/* MCP Icon */}
          <svg
            fill="currentColor"
            fillRule="evenodd"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
            style={{
              width: "40px",
              height: "40px",
              color: isEnabled ? "#3b82f6" : "#9ca3af",
            }}
          >
            <title>ModelContextProtocol</title>
            <path d="M15.688 2.343a2.588 2.588 0 00-3.61 0l-9.626 9.44a.863.863 0 01-1.203 0 .823.823 0 010-1.18l9.626-9.44a4.313 4.313 0 016.016 0 4.116 4.116 0 011.204 3.54 4.3 4.3 0 013.609 1.18l.05.05a4.115 4.115 0 010 5.9l-8.706 8.537a.274.274 0 000 .393l1.788 1.754a.823.823 0 010 1.18.863.863 0 01-1.203 0l-1.788-1.753a1.92 1.92 0 010-2.754l8.706-8.538a2.47 2.47 0 000-3.54l-.05-.049a2.588 2.588 0 00-3.607-.003l-7.172 7.034-.002.002-.098.097a.863.863 0 01-1.204 0 .823.823 0 010-1.18l7.273-7.133a2.47 2.47 0 00-.003-3.537z"></path>
            <path d="M14.485 4.703a.823.823 0 000-1.18.863.863 0 00-1.204 0l-7.119 6.982a4.115 4.115 0 000 5.9 4.314 4.314 0 006.016 0l7.12-6.982a.823.823 0 000-1.18.863.863 0 00-1.204 0l-7.119 6.982a2.588 2.588 0 01-3.61 0 2.47 2.47 0 010-3.54l7.12-6.982z"></path>
          </svg>

          <Handle
            type="source"
            position={Position.Right}
            id="source"
            style={{
              backgroundColor: "#64748b",
              width: "8px",
              height: "8px",
            }}
          />

          {/* Auth Provider Indicators */}
          {(hasOAuth || hasApiKey) && (
            <div
              style={{
                position: "absolute",
                top: "-8px",
                right: "-8px",
                display: "flex",
                gap: "4px",
              }}
            >
              {hasOAuth && (
                <div
                  style={{
                    backgroundColor: "#f3f4f6",
                    border: "2px solid #64748b",
                    borderRadius: "50%",
                    width: "24px",
                    height: "24px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
                  }}
                  title="OAuth Connected"
                >
                  <Lock size={12} color="#6366f1" />
                </div>
              )}
              {hasApiKey && (
                <div
                  style={{
                    backgroundColor: "#f3f4f6",
                    border: "2px solid #64748b",
                    borderRadius: "50%",
                    width: "24px",
                    height: "24px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
                    marginLeft: hasOAuth ? "-8px" : "0",
                  }}
                  title="API Key Connected"
                >
                  <Key size={12} color="#6366f1" />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Tool name below the box */}
        <div
          style={{
            marginTop: "8px",
            fontSize: "12px",
            fontWeight: "500",
            color: "#111827",
            textAlign: "center",
            maxWidth: "200px",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
          title={tool.name.length > 50 ? tool.name : undefined}
        >
          {tool.name.length > 50 ? tool.name.substring(0, 50) + "..." : tool.name}
        </div>
      </div>
    </TooltipProvider>
  );
};

export default ToolNode;
