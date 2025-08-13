import { BaseEdge, EdgeLabelRenderer, EdgeProps, getBezierPath } from "@xyflow/react";
import { Plus, Trash2 } from "lucide-react";
import React, { useState } from "react";

export interface CustomDeletableEdgeData {
  label?: string;
  onDelete?: () => void;
  onAddAuth?: () => void;
  showAddButton?: boolean;
  [key: string]: unknown;
}

const CustomDeletableEdge = ({
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
  const edgeData = data as CustomDeletableEdgeData;

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const handleDelete = (event: React.MouseEvent) => {
    event.stopPropagation();
    // Trigger the edge click handler which will show the confirmation dialog
    const edgeElement = document.querySelector(`[data-id="${id}"]`);
    if (edgeElement) {
      edgeElement.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    }
  };

  return (
    <>
      <BaseEdge path={edgePath} markerEnd={markerEnd} style={style} />
      {/* Invisible wider path for better hover detection */}
      <path
        d={edgePath}
        strokeWidth={30}
        stroke="transparent"
        fill="none"
        onMouseEnter={(e) => {
          setIsHovered(true);
        }}
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

        {/* Action buttons appear on hover */}
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
            <div
              style={{
                display: "flex",
                gap: "8px",
                alignItems: "center",
                position: "relative",
                top: edgeData?.label ? "30px" : "0px", // Position below label if it exists
              }}
            >
              {/* Add Auth Button */}
              {edgeData?.showAddButton && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    edgeData.onAddAuth?.();
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
                    e.currentTarget.style.backgroundColor = "#dcfce7";
                    e.currentTarget.style.borderColor = "#4ade80";
                    const plusIcon = e.currentTarget.querySelector("svg");
                    if (plusIcon) plusIcon.style.color = "#16a34a";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "white";
                    e.currentTarget.style.borderColor = "#e5e7eb";
                    const plusIcon = e.currentTarget.querySelector("svg");
                    if (plusIcon) plusIcon.style.color = "#6b7280";
                  }}
                  title="Add authentication"
                >
                  <Plus size={16} color="#6b7280" />
                </button>
              )}

              {/* Delete Button */}
              <button
                onClick={handleDelete}
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
                  e.currentTarget.style.backgroundColor = "#fee2e2";
                  e.currentTarget.style.borderColor = "#fecaca";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "white";
                  e.currentTarget.style.borderColor = "#e5e7eb";
                }}
                title="Delete connection"
              >
                <Trash2 size={16} color="#ef4444" />
              </button>
            </div>
          </div>
        )}
      </EdgeLabelRenderer>
    </>
  );
};

export default CustomDeletableEdge;
