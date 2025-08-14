import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Handle, NodeProps, NodeToolbar, Position } from "@xyflow/react";
import { AlertTriangle, Info, Trash2 } from "lucide-react";
import React, { useState } from "react";

export interface AuthProviderNodeData {
  providerId: string;
  providerName: string;
  providerType: "oauth" | "apikey";
  connectedToolsCount: number;
  hasClientId?: boolean; // Add validation flag
  onDelete?: () => void;
  onInfo?: () => void;
  [key: string]: unknown;
}

const AuthProviderNode: React.FC<NodeProps> = ({ data, selected, id }) => {
  const { providerName, providerType, hasClientId, onDelete, onInfo } = data as unknown as AuthProviderNodeData;
  const isOAuth = providerType === "oauth";
  const hasWarning = isOAuth && !hasClientId; // Show warning for OAuth nodes missing clientId
  const [isHovered, setIsHovered] = useState(false);

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
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => onInfo?.()}
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
                <Info size={16} color="#6b7280" />
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Provider Info</p>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => onDelete?.()}
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
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#fee2e2")}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
              >
                <Trash2 size={16} color="#ef4444" />
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Delete Provider</p>
            </TooltipContent>
          </Tooltip>
        </NodeToolbar>
        {/* Square box with provider icon */}
        <div
          style={{
            backgroundColor: "#ffffff",
            border: `2px solid ${hasWarning ? "#f59e0b" : selected ? "#ef4444" : "#64748b"}`,
            borderRadius: "8px",
            width: "80px",
            height: "80px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: hasWarning
              ? "0 0 0 2px rgba(245, 158, 11, 0.3)"
              : selected
                ? "0 0 0 2px rgba(239, 68, 68, 0.3)"
                : "0 2px 4px rgba(0, 0, 0, 0.1)",
            position: "relative",
            cursor: "pointer",
            transition: "all 0.2s ease",
          }}
        >
          {/* Warning indicator badge */}
          {hasWarning && (
            <div
              style={{
                position: "absolute",
                top: "-8px",
                right: "-8px",
                backgroundColor: "#f59e0b",
                borderRadius: "50%",
                width: "20px",
                height: "20px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
                zIndex: 10,
              }}
            >
              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    <AlertTriangle size={12} color="white" />
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>OAuth provider missing Client ID</p>
                </TooltipContent>
              </Tooltip>
            </div>
          )}
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

          {/* Provider Icon */}
          {isOAuth ? (
            // OAuth Icon
            <svg
              width="40"
              height="40"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              style={{ color: "#6366f1" }}
            >
              <path
                d="M12 2C9.243 2 7 4.243 7 7V9H6C4.895 9 4 9.895 4 11V19C4 20.105 4.895 21 6 21H18C19.105 21 20 20.105 20 19V11C20 9.895 19.105 9 18 9H17V7C17 4.243 14.757 2 12 2ZM9 7C9 5.346 10.346 4 12 4C13.654 4 15 5.346 15 7V9H9V7ZM12 14C12.552 14 13 14.448 13 15C13 15.552 12.552 16 12 16C11.448 16 11 15.552 11 15C11 14.448 11.448 14 12 14Z"
                fill="currentColor"
              />
            </svg>
          ) : (
            // API Key Icon
            <svg
              width="40"
              height="40"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              style={{ color: "#6366f1" }}
            >
              <path
                d="M7 14C5.9 14 5 13.1 5 12C5 10.9 5.9 10 7 10C8.1 10 9 10.9 9 12C9 13.1 8.1 14 7 14ZM12.65 10C11.83 7.67 9.61 6 7 6C3.69 6 1 8.69 1 12C1 15.31 3.69 18 7 18C9.61 18 11.83 16.33 12.65 14H17V18H21V14H23V10H12.65Z"
                fill="currentColor"
              />
            </svg>
          )}

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
        </div>

        {/* Provider name */}
        <div
          style={{
            marginTop: "8px",
            fontSize: "12px",
            fontWeight: "600",
            color: "#111827",
            textAlign: "center",
            maxWidth: "100px",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {providerName}
        </div>

        {/* Provider type label */}
        <div
          style={{
            marginTop: "4px",
            fontSize: "10px",
            color: "#64748b",
            textAlign: "center",
            fontWeight: "500",
            textTransform: "uppercase",
            letterSpacing: "0.5px",
          }}
        >
          {isOAuth ? "OAuth" : "API Key"}
        </div>
      </div>
    </TooltipProvider>
  );
};

export default AuthProviderNode;
