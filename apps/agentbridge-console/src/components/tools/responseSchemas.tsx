import { Button } from "@/components/ui/button";
import { Header, Response } from "@agentbridge/api";
import { PlusCircle } from "lucide-react";
import React, { useState } from "react";
import { EditResponseDialog } from "./editResponseDialog";
import { JSONSchema } from "./responseDetailsViewer";

interface ResponseSchemasProps {
  responses: Record<string, Response> | undefined;
  setResponses: (responses: Record<string, Response>) => void;
}

export const ResponseSchemas: React.FC<ResponseSchemasProps> = ({ responses, setResponses }) => {
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingStatusCode, setEditingStatusCode] = useState<string | null>(null);
  const [editingResponse, setEditingResponse] = useState<Response | null>(null);
  // State for create dialog
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  // Handler for saving a new response
  const handleSaveCreate = (
    statusCode: string,
    description: string,
    schema: JSONSchema | undefined,
    headers: Record<string, Header>,
  ) => {
    if (!statusCode) return;
    const updated = { ...responses };
    const normalizedSchema = schema ?? { type: "object", properties: {} };
    updated[statusCode] = {
      statusCode: Number(statusCode),
      description,
      headers,
      content: {
        "application/json": {
          type: "object",
          schema: normalizedSchema,
        },
      },
    };
    setResponses(updated);
    setCreateDialogOpen(false);
  };

  // Default new response object
  const defaultNewResponse: Response = {
    statusCode: 0,
    description: "",
    headers: {},
    content: {
      "application/json": {
        type: "object",
        schema: { type: "object", properties: {} },
      },
    },
  };

  const handleRemove = (statusCode: string) => {
    const updated = { ...responses };
    // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
    delete updated[statusCode];
    setResponses(updated);
  };

  const handleEdit = (statusCode: string, response: Response) => {
    setEditingStatusCode(statusCode);
    setEditingResponse(response);
    setEditDialogOpen(true);
  };

  const handleSaveEdit = (
    newStatusCode: string,
    description: string,
    schema: JSONSchema | undefined,
    headers: Record<string, Header>,
  ) => {
    if (!editingStatusCode || !editingResponse) return;
    const updated = { ...responses };
    // Remove old status code if changed
    if (newStatusCode !== editingStatusCode) {
      // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
      delete updated[editingStatusCode];
    }
    updated[newStatusCode] = {
      ...editingResponse,
      description,
      headers,
      content: {
        ...(editingResponse.content || {}),
        "application/json": {
          type: "object",
          ...(editingResponse.content?.["application/json"] || {}),
          schema: schema ?? { type: "object", properties: {} },
        },
      },
    };
    setResponses(updated);
    setEditDialogOpen(false);
    setEditingStatusCode(null);
    setEditingResponse(null);
  };

  return (
    <div className="space-y-4">
      <div className="border rounded-lg">
        <div className="p-4 border-b">
          <h3 className="font-medium">Tool Responses</h3>
          <p className="text-sm text-muted-foreground">Define the responses your tool returns.</p>
        </div>
        {!responses || Object.keys(responses).length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-sm text-muted-foreground mb-4">No response schemas defined.</p>
            <Button size="sm" variant="outline" onClick={() => setCreateDialogOpen(true)}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Response
            </Button>
          </div>
        ) : (
          <div className="divide-y">
            {Object.entries(responses).map(([statusCode, response]) => (
              <div key={statusCode} className="rounded-md p-4">
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <h4 className="font-medium">Status Code {statusCode}</h4>
                      <span className="text-sm text-muted-foreground">{response.description}</span>
                    </div>
                    <div className="flex space-x-2">
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(statusCode, response)}>
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleRemove(statusCode)}
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {Object.keys(responses || {}).length > 0 && (
        <div className="flex justify-end">
          <Button variant="outline" onClick={() => setCreateDialogOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Response
          </Button>
        </div>
      )}

      {createDialogOpen && (
        <EditResponseDialog
          open={createDialogOpen}
          onClose={() => setCreateDialogOpen(false)}
          statusCode={""}
          description=""
          responseDetails={defaultNewResponse}
          onSave={handleSaveCreate}
        />
      )}

      {editingStatusCode && editingResponse && (
        <EditResponseDialog
          open={editDialogOpen}
          onClose={() => {
            setEditDialogOpen(false);
            setEditingStatusCode(null);
            setEditingResponse(null);
          }}
          statusCode={editingStatusCode}
          description={editingResponse?.description || ""}
          responseDetails={editingResponse}
          onSave={handleSaveEdit}
        />
      )}
    </div>
  );
};
