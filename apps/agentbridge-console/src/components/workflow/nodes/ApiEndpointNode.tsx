import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Handle, NodeProps, NodeToolbar, Position } from "@xyflow/react";
import { ArrowDown, ArrowUp, Globe } from "lucide-react";
import { useState } from "react";

export interface ApiEndpointNodeData {
  url: string;
  method?: string;
  label?: string;
  onEditRequest?: () => void;
  onEditResponse?: () => void;
  [key: string]: unknown;
}

const ApiEndpointNode = ({ data, selected, id }: NodeProps) => {
  const nodeData = data as ApiEndpointNodeData;
  const { url, method = "GET", label, onEditRequest, onEditResponse } = nodeData;
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
          nodeId={id}
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
                onClick={() => onEditRequest?.()}
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
                <ArrowDown size={16} color="#6b7280" />
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Transform Request</p>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => onEditResponse?.()}
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
                <ArrowUp size={16} color="#6b7280" />
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Transform Response</p>
            </TooltipContent>
          </Tooltip>
        </NodeToolbar>
        {/* Square box with API icon */}
        <div
          style={{
            backgroundColor: "#ffffff",
            border: `2px solid ${selected ? "#ef4444" : "#64748b"}`,
            borderRadius: "8px",
            width: "80px",
            height: "80px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: selected ? "0 0 0 2px rgba(239, 68, 68, 0.3)" : "0 2px 4px rgba(0, 0, 0, 0.1)",
            position: "relative",
            cursor: "pointer",
            transition: "all 0.2s ease",
          }}
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

          {/* API/Globe Icon */}
          <Globe size={40} color="#6366f1" strokeWidth={1.5} />

          {/* Method Badge */}
          {method && (
            <div
              style={{
                position: "absolute",
                top: "-8px",
                left: "-8px",
                backgroundColor: getMethodColor(method),
                color: "white",
                borderRadius: "4px",
                padding: "2px 6px",
                fontSize: "10px",
                fontWeight: "bold",
                boxShadow: "0 1px 3px rgba(0, 0, 0, 0.2)",
              }}
            >
              {method}
            </div>
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

        {/* Label below the box */}
        <div
          style={{
            marginTop: "8px",
            fontSize: "12px",
            fontWeight: "500",
            color: "#111827",
            textAlign: "center",
            maxWidth: "100px",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {label || "HTTP Request"}
        </div>

        {/* URL below the label */}
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              style={{
                marginTop: "4px",
                fontSize: "10px",
                color: "#6b7280",
                textAlign: "center",
                maxWidth: "120px",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                cursor: "help",
              }}
            >
              {url}
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>{url}</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
};

const getMethodColor = (method: string) => {
  // All methods now use grey color
  return "#6b7280";
};

export default ApiEndpointNode;
