import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Handle, NodeProps, NodeToolbar, Position } from "@xyflow/react";
import { Plus, Server } from "lucide-react";
import { memo, useState } from "react";
import { ServerNodeData } from "../types";

interface ServerNodeProps extends NodeProps {
  data: ServerNodeData;
}

const ServerNode = memo(({ data, selected, id }: ServerNodeProps) => {
  const [isHovered, setIsHovered] = useState(false);

  // Simple square server node
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
                onClick={() => data.onAddTool?.()}
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
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#e0f2fe")}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
              >
                <Plus size={16} color="#0ea5e9" />
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Add new tool</p>
            </TooltipContent>
          </Tooltip>
        </NodeToolbar>
        {/* Square box with Server icon */}
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

          {/* Server Icon */}
          <Server size={40} color="#3b82f6" strokeWidth={1.5} />

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

        {/* Server name below the box */}
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
          {data.server.name}
        </div>

        {/* Server type label */}
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
          MCP Server
        </div>
      </div>
    </TooltipProvider>
  );
});

ServerNode.displayName = "ServerNode";

export default ServerNode;
