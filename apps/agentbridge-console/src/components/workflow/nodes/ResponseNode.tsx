import { Handle, NodeProps, NodeToolbar, Position } from "@xyflow/react";
import { Edit, RefreshCw } from "lucide-react";
import React from "react";

export interface ResponseNodeData {
  transform?: string;
  validation?: unknown;
  onEdit?: () => void;
  [key: string]: unknown;
}

const ResponseNode: React.FC<NodeProps> = ({ data, selected, id }) => {
  const nodeData = data as unknown as ResponseNodeData;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <NodeToolbar
        nodeId={id as string}
        isVisible={selected}
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
        <button
          onClick={() => nodeData.onEdit?.()}
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
          title="Edit Response"
        >
          <Edit size={16} color="#6b7280" />
        </button>
      </NodeToolbar>

      {/* Square box with Response icon */}
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

        {/* Response Transform Icon */}
        <RefreshCw size={40} color="#6366f1" strokeWidth={1.5} />

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

      {/* Label */}
      <div
        style={{
          marginTop: "8px",
          fontSize: "12px",
          fontWeight: "500",
          color: "#111827",
          textAlign: "center",
        }}
      >
        Transform response to LLM
      </div>
    </div>
  );
};

export default ResponseNode;
