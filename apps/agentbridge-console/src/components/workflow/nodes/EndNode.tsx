import { Handle, NodeProps, Position } from "@xyflow/react";
import { CheckCircle } from "lucide-react";
import React from "react";

export interface EndNodeData {
  label?: string;
  [key: string]: unknown;
}

const EndNode: React.FC<NodeProps> = ({ data, selected }) => {
  const nodeData = data as unknown as EndNodeData;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      {/* Circular end node */}
      <div
        style={{
          backgroundColor: "#f8fafc",
          border: `2px solid ${selected ? "#10b981" : "#64748b"}`,
          borderRadius: "50%",
          width: "60px",
          height: "60px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: selected ? "0 0 0 2px rgba(16, 185, 129, 0.3)" : "0 2px 4px rgba(0, 0, 0, 0.1)",
          position: "relative",
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

        {/* Check Circle Icon */}
        <CheckCircle size={32} color="#10b981" strokeWidth={2} fill="none" />
      </div>

      {/* Label */}
      <div
        style={{
          marginTop: "8px",
          fontSize: "11px",
          fontWeight: "500",
          color: "#6b7280",
          textAlign: "center",
          maxWidth: "80px",
        }}
      >
        {nodeData?.label || "End"}
      </div>
    </div>
  );
};

export default EndNode;
