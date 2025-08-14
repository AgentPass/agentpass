import { Handle, Position } from "@xyflow/react";
import React from "react";

export interface AuthNodeData {
  label: string;
  authToolCount: number;
  providers: string[];
}

interface AuthNodeProps {
  data: AuthNodeData;
}

const AuthNode: React.FC<AuthNodeProps> = ({ data }) => {
  const { label, authToolCount, providers } = data;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      {/* Square box with lock icon */}
      <div
        style={{
          backgroundColor: authToolCount > 0 ? "#fef3c7" : "#f3f4f6",
          border: `2px ${authToolCount > 0 ? "solid" : "dashed"} ${authToolCount > 0 ? "#f59e0b" : "#9ca3af"}`,
          borderRadius: "8px",
          width: "80px",
          height: "80px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
          position: "relative",
          transition: "all 0.2s ease",
        }}
      >
        <Handle
          type="target"
          position={Position.Left}
          id="target"
          style={{
            backgroundColor: "#f59e0b",
            width: "8px",
            height: "8px",
          }}
        />

        {/* Lock Icon */}
        <svg
          width="40"
          height="40"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{ color: authToolCount > 0 ? "#f59e0b" : "#9ca3af" }}
        >
          <path
            d="M12 2C9.243 2 7 4.243 7 7V9H6C4.895 9 4 9.895 4 11V19C4 20.105 4.895 21 6 21H18C19.105 21 20 20.105 20 19V11C20 9.895 19.105 9 18 9H17V7C17 4.243 14.757 2 12 2ZM9 7C9 5.346 10.346 4 12 4C13.654 4 15 5.346 15 7V9H9V7ZM12 14C12.552 14 13 14.448 13 15C13 15.552 12.552 16 12 16C11.448 16 11 15.552 11 15C11 14.448 11.448 14 12 14Z"
            fill="currentColor"
          />
        </svg>

        <Handle
          type="source"
          position={Position.Right}
          id="source"
          style={{
            backgroundColor: "#f59e0b",
            width: "8px",
            height: "8px",
          }}
        />

        {/* Badge with count */}
        {authToolCount > 0 && (
          <div
            style={{
              position: "absolute",
              top: "-8px",
              right: "-8px",
              backgroundColor: "#dc2626",
              color: "white",
              borderRadius: "50%",
              width: "24px",
              height: "24px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "12px",
              fontWeight: "bold",
              boxShadow: "0 2px 4px rgba(0, 0, 0, 0.2)",
            }}
          >
            {authToolCount}
          </div>
        )}
      </div>

      {/* Node label */}
      <div
        style={{
          marginTop: "8px",
          fontSize: "12px",
          fontWeight: "600",
          color: authToolCount > 0 ? "#92400e" : "#6b7280",
          textAlign: "center",
        }}
      >
        {label}
      </div>

      {/* Provider types */}
      {providers.length > 0 && (
        <div
          style={{
            marginTop: "4px",
            fontSize: "10px",
            color: "#b45309",
            textAlign: "center",
          }}
        >
          {providers.join(", ")}
        </div>
      )}
    </div>
  );
};

export default AuthNode;
