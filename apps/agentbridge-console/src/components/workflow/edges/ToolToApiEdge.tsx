import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { BaseEdge, EdgeLabelRenderer, EdgeProps, getBezierPath } from "@xyflow/react";
import { Plus } from "lucide-react";

export interface ToolToApiEdgeData {
  label?: string;
  onAddAuth?: () => void;
  showAddButton?: boolean;
  [key: string]: unknown;
}

const ToolToApiEdge = ({
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
  const edgeData = data as ToolToApiEdgeData;

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  return (
    <TooltipProvider delayDuration={300}>
      <BaseEdge path={edgePath} markerEnd={markerEnd} style={style} />
      {/* Invisible wider path for better hover detection */}
      <path d={edgePath} strokeWidth={30} stroke="transparent" fill="none" style={{ cursor: "pointer" }} />
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

        {/* Add Auth Button always visible when showAddButton is true */}
        {edgeData?.showAddButton && (
          <div
            style={{
              position: "absolute",
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: "all",
              padding: "20px", // Large padding to keep hover active
            }}
            className="nodrag nopan"
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
              <Tooltip>
                <TooltipTrigger asChild>
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
                  >
                    <Plus size={16} color="#6b7280" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Add authentication</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
        )}
      </EdgeLabelRenderer>
    </TooltipProvider>
  );
};

export default ToolToApiEdge;
