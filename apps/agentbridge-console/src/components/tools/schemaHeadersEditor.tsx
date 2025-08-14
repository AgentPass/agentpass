import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Header } from "@agentbridge/api";
import { PlusCircle } from "lucide-react";
import React, { useState } from "react";

const headerTypeOptions = ["string", "number", "boolean"];

interface SchemaHeadersEditorProps {
  headers: Record<string, Header>;
  setHeaders: (headers: Record<string, Header>) => void;
}

export const SchemaHeadersEditor: React.FC<SchemaHeadersEditorProps> = ({ headers, setHeaders }) => {
  const [newHeaderName, setNewHeaderName] = useState("");
  const [newHeaderType, setNewHeaderType] = useState("string");
  const [newHeaderDescription, setNewHeaderDescription] = useState("");

  const handleAddHeader = () => {
    if (!newHeaderName.trim()) return;
    setHeaders({
      ...headers,
      [newHeaderName]: {
        schema: { type: newHeaderType },
        ...(newHeaderDescription ? { description: newHeaderDescription } : {}),
      },
    });
    setNewHeaderName("");
    setNewHeaderType("string");
    setNewHeaderDescription("");
  };

  const handleRemoveHeader = (name: string) => {
    const { [name]: _, ...rest } = headers;
    setHeaders(rest);
  };

  const handleEditHeader = (name: string, key: string, value: string) => {
    setHeaders({
      ...headers,
      [name]: {
        ...headers[name],
        ...(key === "type" ? { schema: { type: value } } : { [key]: value }),
      },
    });
  };

  return (
    <div className="space-y-4 m-2">
      <div className="mb-2">
        <div className="font-medium mb-1">Headers</div>
        {Object.keys(headers).length === 0 && <div className="text-muted-foreground text-sm">No headers defined.</div>}
        {Object.entries(headers).map(([name, header]) => (
          <div key={name} className="flex items-center gap-2 mb-2">
            <Input
              value={name}
              onChange={(e) => {
                const newName = e.target.value;
                if (!newName.trim()) return;
                const { [name]: oldHeader, ...rest } = headers;
                setHeaders({
                  ...rest,
                  [newName]: oldHeader,
                });
              }}
              className="w-32"
              placeholder="Header Name"
            />
            <Select
              value={header.schema?.type || "string"}
              onValueChange={(val) => handleEditHeader(name, "type", val)}
            >
              <SelectTrigger className="w-28">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                {headerTypeOptions.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              value={header.description || ""}
              onChange={(e) => handleEditHeader(name, "description", e.target.value)}
              className="flex-1"
              placeholder="Description"
            />
            <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleRemoveHeader(name)}>
              Remove
            </Button>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2 mb-2">
        <div>
          <Input
            value={newHeaderName}
            onChange={(e) => setNewHeaderName(e.target.value)}
            placeholder="Header name"
            className="w-32"
          />
        </div>
        <div>
          <Select value={newHeaderType} onValueChange={setNewHeaderType}>
            <SelectTrigger className="w-28">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              {headerTypeOptions.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex-1">
          <Input
            value={newHeaderDescription}
            onChange={(e) => setNewHeaderDescription(e.target.value)}
            placeholder="Description"
          />
        </div>
        <Button type="button" variant="outline" size="sm" onClick={handleAddHeader}>
          <PlusCircle className="h-4 w-4 mr-1" /> Add
        </Button>
      </div>
    </div>
  );
};
