import { Response } from "@agentbridge/api";
import React from "react";
import ReactJson from "react-json-view";

export type JSONSchema = {
  type: string;
  properties?: Record<string, JSONSchema>;
  items?: JSONSchema;
  description?: string;
};

export const ResponseDetailsViewer: React.FC<{ details: Response }> = ({ details }) => {
  if (!details) return <span className="text-muted-foreground">No details</span>;
  let jsonData: Record<string, unknown> = details;
  // If details is a string, try to parse it as JSON
  if (typeof details === "string") {
    try {
      jsonData = JSON.parse(details);
    } catch {
      // If parsing fails, fallback to showing the string
      return <pre className="bg-muted rounded p-2 text-xs overflow-x-auto max-h-64 overflow-y-auto">{details}</pre>;
    }
  }
  return (
    <div className="overflow-x-auto max-h-96 overflow-y-auto">
      <ReactJson
        src={jsonData}
        name={false}
        collapsed={8}
        enableClipboard={false}
        displayDataTypes={false}
        theme="brewer"
      />
    </div>
  );
};
