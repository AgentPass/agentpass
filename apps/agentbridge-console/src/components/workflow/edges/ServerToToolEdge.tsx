import { BaseEdge, EdgeLabelRenderer, EdgeProps, getBezierPath } from "@xyflow/react";
import { Sparkles } from "lucide-react";
import { useState } from "react";

export interface ServerToToolEdgeData {
  label?: string;
  onAnalyze?: () => void;
  showAnalyzeButton?: boolean;
  [key: string]: unknown;
}

const ServerToToolEdge = ({
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
  const edgeData = data as ServerToToolEdgeData;

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

        {/* Sparkle Analysis Button appears on hover */}
        {isHovered && edgeData?.showAnalyzeButton && (
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
              {/* AI Analysis Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  edgeData.onAnalyze?.();
                }}
                style={{
                  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  border: "none",
                  borderRadius: "8px",
                  padding: "8px 12px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                  transition: "all 0.2s",
                  boxShadow: "0 4px 12px rgba(102, 126, 234, 0.4)",
                  color: "white",
                  fontSize: "12px",
                  fontWeight: 500,
                  transform: "scale(1)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "scale(1.05)";
                  e.currentTarget.style.boxShadow = "0 6px 20px rgba(102, 126, 234, 0.6)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "scale(1)";
                  e.currentTarget.style.boxShadow = "0 4px 12px rgba(102, 126, 234, 0.4)";
                }}
                title="Generate AI Tool Analysis Report"
              >
                <Sparkles size={14} color="white" />
                <span>Analyze Tool</span>
              </button>
            </div>
          </div>
        )}
      </EdgeLabelRenderer>
    </>
  );
};

export default ServerToToolEdge;
