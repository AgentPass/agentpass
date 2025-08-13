import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { primitiveTypeOptions, typeOptions } from "@/utils/schema";
import { PlusCircle } from "lucide-react";
import React, { useState } from "react";
import { JSONSchema } from "./responseDetailsViewer";

interface SchemaPropertiesEditorProps {
  schema: JSONSchema;
  setSchema: (schema: JSONSchema) => void;
}

function ObjectSubPropertiesEditor({
  parentProp,
  onChange,
}: {
  parentProp: JSONSchema;
  onChange: (newSubProps: Record<string, JSONSchema>) => void;
}) {
  const subProps = parentProp.properties || {};
  const [newSubName, setNewSubName] = useState("");
  const [newSubType, setNewSubType] = useState("string");
  const [newSubDesc, setNewSubDesc] = useState("");

  const handleAdd = () => {
    if (!newSubName.trim()) return;
    onChange({
      ...subProps,
      [newSubName]: {
        type: newSubType,
        ...(newSubDesc ? { description: newSubDesc } : {}),
      },
    });
    setNewSubName("");
    setNewSubType("string");
    setNewSubDesc("");
  };
  const handleRemove = (name: string) => {
    const { [name]: _, ...rest } = subProps;
    onChange(rest);
  };
  const handleEdit = (name: string, key: string, value: string) => {
    onChange({
      ...subProps,
      [name]: {
        ...subProps[name],
        [key]: value,
      },
    });
  };
  return (
    <div className="mt-2 border-l pl-2">
      <div className="text-xs text-muted-foreground mb-2" style={{ marginLeft: 0 }}>
        Object Properties
      </div>
      {Object.keys(subProps).length === 0 && <div className="text-muted-foreground text-xs">No sub-properties.</div>}
      {Object.entries(subProps).map(([name, prop]) => (
        <div key={name} className="flex items-center gap-2 mb-1">
          <Input
            value={name}
            onChange={(e) => {
              const newName = e.target.value;
              if (!newName.trim()) return;
              const { [name]: oldProp, ...rest } = subProps;
              onChange({ ...rest, [newName]: oldProp });
            }}
            className="w-28"
            placeholder="Name"
          />
          <Select value={prop.type} onValueChange={(val) => handleEdit(name, "type", val)}>
            <SelectTrigger className="w-24">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              {primitiveTypeOptions.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            value={prop.description || ""}
            onChange={(e) => handleEdit(name, "description", e.target.value)}
            className="flex-1"
            placeholder="Description"
          />
          <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleRemove(name)}>
            Remove
          </Button>
        </div>
      ))}
      <div className="flex items-center gap-2 mb-1">
        <Input value={newSubName} onChange={(e) => setNewSubName(e.target.value)} placeholder="Name" className="w-28" />
        <Select value={newSubType} onValueChange={setNewSubType}>
          <SelectTrigger className="w-24">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            {primitiveTypeOptions.map((type) => (
              <SelectItem key={type} value={type}>
                {type}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          value={newSubDesc}
          onChange={(e) => setNewSubDesc(e.target.value)}
          className="flex-1"
          placeholder="Description"
        />
        <Button type="button" variant="outline" size="sm" onClick={handleAdd}>
          <PlusCircle className="h-4 w-4 mr-1" /> Add
        </Button>
      </div>
    </div>
  );
}

export const SchemaPropertiesEditor: React.FC<SchemaPropertiesEditorProps> = ({ schema, setSchema }) => {
  const [newPropName, setNewPropName] = useState("");
  const [newPropType, setNewPropType] = useState("string");
  const [newPropDescription, setNewPropDescription] = useState("");
  const [newPropArrayItemType, setNewPropArrayItemType] = useState("string");

  const properties = schema.type === "object" && schema.properties ? schema.properties : {};

  const handleAddProperty = () => {
    if (!newPropName.trim()) return;
    const newProp: JSONSchema = { type: newPropType };
    if (newPropDescription) newProp.description = newPropDescription;
    if (newPropType === "array") {
      newProp.items = { type: newPropArrayItemType };
    }
    setSchema({
      ...schema,
      type: "object",
      properties: {
        ...properties,
        [newPropName]: newProp,
      },
    });
    setNewPropName("");
    setNewPropType("string");
    setNewPropDescription("");
    setNewPropArrayItemType("string");
  };

  const handleRemoveProperty = (propName: string) => {
    const { [propName]: _, ...rest } = properties;
    setSchema({
      ...schema,
      type: "object",
      properties: rest,
    });
  };

  const handleEditProperty = (propName: string, key: string, value: string) => {
    const prop = properties[propName];
    const updatedProp = { ...prop, [key]: value };
    if (key === "type" && value === "array") {
      updatedProp.items = { type: "string" };
    } else if (key === "type" && value !== "array") {
      delete updatedProp.items;
    }
    setSchema({
      ...schema,
      type: "object",
      properties: {
        ...properties,
        [propName]: updatedProp,
      },
    });
  };

  const handleEditArrayItemType = (propName: string, itemType: string) => {
    const prop = properties[propName];
    setSchema({
      ...schema,
      type: "object",
      properties: {
        ...properties,
        [propName]: {
          ...prop,
          items: { type: itemType },
        },
      },
    });
  };

  return (
    <div className="space-y-4 max-h-80 m-2">
      <div className="mb-2">
        <div className="font-medium mb-1">Properties</div>
        {Object.keys(properties).length === 0 && (
          <div className="text-muted-foreground text-sm">No properties defined.</div>
        )}
        {Object.entries(properties).map(([name, prop]) => (
          <React.Fragment key={name}>
            <div className="flex items-center gap-2 mb-2">
              <Input
                value={name}
                onChange={(e) => {
                  const newName = e.target.value;
                  if (!newName.trim()) return;
                  const { [name]: oldProp, ...rest } = properties;
                  setSchema({
                    ...schema,
                    type: "object",
                    properties: {
                      ...rest,
                      [newName]: oldProp,
                    },
                  });
                }}
                className="w-32"
                placeholder="Name"
              />
              <Select value={prop.type} onValueChange={(val) => handleEditProperty(name, "type", val)}>
                <SelectTrigger className="w-28">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  {typeOptions.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {prop.type === "array" && (
                <Select
                  value={prop.items?.type || "string"}
                  onValueChange={(val) => handleEditArrayItemType(name, val)}
                >
                  <SelectTrigger className="w-28">
                    <SelectValue placeholder="Item Type" />
                  </SelectTrigger>
                  <SelectContent>
                    {typeOptions.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <Input
                value={prop.description || ""}
                onChange={(e) => handleEditProperty(name, "description", e.target.value)}
                className="flex-1"
                placeholder="Description"
              />
              <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleRemoveProperty(name)}>
                Remove
              </Button>
            </div>
            {/* Nested object property editor, now in a new row below */}
            {prop.type === "object" && (
              <div className="w-full bg-muted/50 rounded-md p-3 mb-2">
                <ObjectSubPropertiesEditor
                  parentProp={prop}
                  onChange={(newSubProps) => {
                    setSchema({
                      ...schema,
                      type: "object",
                      properties: {
                        ...properties,
                        [name]: {
                          ...prop,
                          properties: newSubProps,
                        },
                      },
                    });
                  }}
                />
              </div>
            )}
            {prop.type === "array" && prop.items?.type === "object" && (
              <div className="w-full bg-muted/50 rounded-md p-3 mb-2">
                <ObjectSubPropertiesEditor
                  parentProp={prop.items}
                  onChange={(newSubProps) => {
                    setSchema({
                      ...schema,
                      type: "object",
                      properties: {
                        ...properties,
                        [name]: {
                          ...prop,
                          items: {
                            ...prop.items,
                            type: "object",
                            properties: newSubProps,
                          },
                        },
                      },
                    });
                  }}
                />
              </div>
            )}
          </React.Fragment>
        ))}
      </div>
      <div className="flex items-end gap-2">
        <div>
          <Label className="block mb-1">Name</Label>
          <Input
            value={newPropName}
            onChange={(e) => setNewPropName(e.target.value)}
            placeholder="Property name"
            className="w-32"
          />
        </div>
        <div>
          <Label className="block mb-1">Type</Label>
          <Select value={newPropType} onValueChange={setNewPropType}>
            <SelectTrigger className="w-28">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              {typeOptions.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {newPropType === "array" && (
          <div>
            <Label className="block mb-1">Item Type</Label>
            <Select value={newPropArrayItemType} onValueChange={setNewPropArrayItemType}>
              <SelectTrigger className="w-28">
                <SelectValue placeholder="Item Type" />
              </SelectTrigger>
              <SelectContent>
                {typeOptions.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        <div className="flex-1">
          <Label className="block mb-1">Description</Label>
          <Input
            value={newPropDescription}
            onChange={(e) => setNewPropDescription(e.target.value)}
            placeholder="Description"
          />
        </div>
        <Button type="button" variant="outline" size="sm" onClick={handleAddProperty} className="mt-6">
          <PlusCircle className="h-4 w-4 mr-1" /> Add
        </Button>
      </div>
    </div>
  );
};
