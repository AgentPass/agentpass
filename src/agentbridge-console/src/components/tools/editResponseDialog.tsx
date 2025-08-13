import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Header, Response } from "@agentbridge/api";
import React, { useEffect, useState } from "react";
import { ResponseDetailsDialog } from "./responseDetailsDialog";
import { JSONSchema } from "./responseDetailsViewer";
import { SchemaHeadersEditor } from "./schemaHeadersEditor";
import { SchemaPropertiesEditor } from "./schemaPropertiesEditor";

interface EditResponseDialogProps {
  open: boolean;
  onClose: () => void;
  statusCode: string;
  description: string;
  responseDetails: Response;
  onSave: (
    statusCode: string,
    description: string,
    schema: JSONSchema | undefined,
    headers: Record<string, Header>,
  ) => void;
}

export const EditResponseDialog: React.FC<EditResponseDialogProps> = ({
  open,
  onClose,
  statusCode: initialStatus,
  description: initialDescription,
  responseDetails,
  onSave,
}) => {
  const [statusCode, setStatusCode] = useState(initialStatus);
  const [description, setDescription] = useState(initialDescription);
  const [schema, setSchema] = useState<JSONSchema | undefined>(
    responseDetails.content?.["application/json"]?.schema as JSONSchema,
  );
  const [headers, setHeaders] = useState<Record<string, Header>>(responseDetails.headers || {});
  const [previewOpen, setPreviewOpen] = useState(false);

  useEffect(() => {
    setStatusCode(initialStatus);
    setDescription(initialDescription);
    setSchema(responseDetails.content?.["application/json"]?.schema as JSONSchema);
    setHeaders(responseDetails.headers || {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialStatus, initialDescription, JSON.stringify(responseDetails), open]);

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-3xl w-full">
          <DialogHeader>
            <DialogTitle>Edit Response</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Status Code</Label>
              <Input className="w-full" value={statusCode} onChange={(e) => setStatusCode(e.target.value)} />
            </div>
            <div className="min-w-0">
              <Label>Description</Label>
              <Input className="w-full" value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
            <div>
              <Label>Schema</Label>
              <div className="max-h-64 overflow-y-auto">
                <SchemaHeadersEditor headers={headers} setHeaders={setHeaders} />
              </div>
              {schema && (
                <div className="mt-6 max-h-64 overflow-y-auto">
                  <SchemaPropertiesEditor schema={schema} setSchema={setSchema} />
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPreviewOpen(true)}>
              Preview Response
            </Button>
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={() => onSave(statusCode, description, schema, headers)}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <ResponseDetailsDialog
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        details={{
          statusCode: parseInt(statusCode),
          description,
          headers,
          content:
            schema && schema.type === "object"
              ? JSON.parse(JSON.stringify(schema))
              : { "application/json": { type: "object", schema: schema } },
        }}
      />
    </>
  );
};
