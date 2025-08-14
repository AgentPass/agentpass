import { BaseEdge, EdgeLabelRenderer, EdgeProps, getBezierPath } from "@xyflow/react";
import { Plus } from "lucide-react";
import { useState } from "react";

export interface AddToolEdgeData {
  label?: string;
  onAdd?: () => void;
  [key: string]: unknown;
}

const AddToolEdge = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  data,
}: EdgeProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const edgeData = data as AddToolEdgeData;

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  return (
    <>
      <BaseEdge path={edgePath} markerEnd={markerEnd} style={style} />
      {/* Invisible wider path for better hover detection */}
      <path
        d={edgePath}
        strokeWidth={30}
        stroke="transparent"
        fill="none"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{ cursor: "pointer" }}
      />
      <EdgeLabelRenderer>
        {/* Label always in the middle */}
        {edgeData?.label && (
          <div
            style={{
              position: "absolute",
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: "none",
            }}
            className="nodrag nopan"
          >
            <div
              style={{
                background: "white",
                padding: "4px 8px",
                borderRadius: "4px",
                fontSize: "12px",
                fontWeight: 500,
                border: "1px solid #e5e7eb",
                color: "#374151",
              }}
            >
              {edgeData.label}
            </div>
          </div>
        )}

        {/* Add button appears on hover */}
        {isHovered && (
          <div
            style={{
              position: "absolute",
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: "all",
              padding: "20px", // Large padding to keep hover active
            }}
            className="nodrag nopan"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                edgeData?.onAdd?.();
              }}
              style={{
                background: "white",
                border: "1px solid #e5e7eb",
                borderRadius: "6px",
                padding: "6px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.2s",
                boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#e0f2fe";
                e.currentTarget.style.borderColor = "#7dd3fc";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "white";
                e.currentTarget.style.borderColor = "#e5e7eb";
              }}
              title="Add new tool"
            >
              <Plus size={16} color="#0ea5e9" />
            </button>
          </div>
        )}
      </EdgeLabelRenderer>
    </>
  );
};

export default AddToolEdge;
