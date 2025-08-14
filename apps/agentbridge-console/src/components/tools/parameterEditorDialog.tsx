import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Parameter } from "@agentbridge/api";
import { Info, Plus, X } from "lucide-react";
import React, { ChangeEvent } from "react";

interface ParameterForm {
  name: string;
  type: Parameter.type;
  required: boolean;
  description: string;
  enum: string[];
  arrayItemType: Parameter.type;
  arrayObjectProperties: Record<string, { type: Parameter.type; description: string; required: boolean }>;
  objectProperties: Record<string, { type: Parameter.type; description: string; required: boolean }>;
}

interface ParameterEditorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingParameter: Parameter | null;
  paramForm: ParameterForm;
  setParamForm: React.Dispatch<React.SetStateAction<ParameterForm>>;
  handleSaveParameter: () => void;
}

export const ParameterEditorDialog: React.FC<ParameterEditorDialogProps> = ({
  open,
  onOpenChange,
  editingParameter,
  paramForm,
  setParamForm,
  handleSaveParameter,
}) => {
  const [newProp, setNewProp] = React.useState({
    name: "",
    type: Parameter.type.STRING,
    required: false,
    description: "",
  });

  const [newObjectProp, setNewObjectProp] = React.useState({
    name: "",
    type: Parameter.type.STRING,
    required: false,
    description: "",
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="min-w-[400px] max-w-[45vw] max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{editingParameter ? "Edit Parameter" : "Add Parameter"}</DialogTitle>
          <DialogDescription>Define a parameter for this tool.</DialogDescription>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto p-1">
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="param-name">Name</Label>
              <Input
                id="param-name"
                value={paramForm.name}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setParamForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="productId"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="param-type">Data Type</Label>
                <Select
                  value={paramForm.type}
                  onValueChange={(value) =>
                    setParamForm((f) => ({
                      ...f,
                      type: value as Parameter.type,
                      arrayItemType: value === Parameter.type.ARRAY ? Parameter.type.STRING : f.arrayItemType,
                    }))
                  }
                >
                  <SelectTrigger id="param-type">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={Parameter.type.STRING}>String</SelectItem>
                    <SelectItem value={Parameter.type.NUMBER}>Number</SelectItem>
                    <SelectItem value={Parameter.type.BOOLEAN}>Boolean</SelectItem>
                    <SelectItem value={Parameter.type.ARRAY}>Array</SelectItem>
                    <SelectItem value={Parameter.type.OBJECT}>Object</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {/* Default value, enums, etc. can be added here */}
              {paramForm.type === Parameter.type.ARRAY && (
                <div className="space-y-2">
                  <Label htmlFor="array-item-type">Array Item Type</Label>
                  <Select
                    value={paramForm.arrayItemType}
                    onValueChange={(value) => setParamForm((f) => ({ ...f, arrayItemType: value as Parameter.type }))}
                  >
                    <SelectTrigger id="array-item-type">
                      <SelectValue placeholder="Select item type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={Parameter.type.STRING}>String</SelectItem>
                      <SelectItem value={Parameter.type.NUMBER}>Number</SelectItem>
                      <SelectItem value={Parameter.type.BOOLEAN}>Boolean</SelectItem>
                      <SelectItem value={Parameter.type.OBJECT}>Object</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="param-description">Description</Label>
              <Textarea
                id="param-description"
                value={paramForm.description}
                onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
                  setParamForm((f) => ({ ...f, description: e.target.value }))
                }
                placeholder="Describe what this parameter does"
                rows={2}
              />
            </div>

            {/* Enum Values Section - Only show for string type */}
            {paramForm.type === Parameter.type.STRING && (
              <div className="space-y-2">
                <Label htmlFor="param-enum" className="flex items-center gap-2">
                  Enum Values (Optional)
                  <span className="text-xs text-muted-foreground">Restrict this parameter to specific values</span>
                </Label>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Input
                      id="new-enum-value"
                      placeholder="Add enum value"
                      onKeyPress={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          const input = e.target as HTMLInputElement;
                          const value = input.value.trim();
                          if (value && !paramForm.enum.includes(value)) {
                            setParamForm((f) => ({ ...f, enum: [...f.enum, value] }));
                            input.value = "";
                          }
                        }
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const input = document.getElementById("new-enum-value") as HTMLInputElement;
                        const value = input?.value.trim();
                        if (value && !paramForm.enum.includes(value)) {
                          setParamForm((f) => ({ ...f, enum: [...f.enum, value] }));
                          if (input) input.value = "";
                        }
                      }}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>

                  {paramForm.enum.length > 0 && (
                    <div className="space-y-1">
                      <div className="flex flex-wrap gap-1">
                        {paramForm.enum.map((value, index) => (
                          <div
                            key={index}
                            className="inline-flex items-center gap-1 px-2 py-1 bg-muted rounded-md text-sm"
                          >
                            <span className="font-mono">{value}</span>
                            <button
                              type="button"
                              onClick={() => {
                                setParamForm((f) => ({
                                  ...f,
                                  enum: f.enum.filter((_, i) => i !== index),
                                }));
                              }}
                              className="hover:bg-muted-foreground/20 rounded p-0.5"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {paramForm.enum.length > 0 && (
                    <Alert>
                      <Info className="h-4 w-4" />
                      <AlertDescription className="text-sm">
                        <strong>Enum Information:</strong>
                        <ul className="mt-2 space-y-1 text-xs">
                          <li>
                            • This parameter will be restricted to {paramForm.enum.length} predefined value
                            {paramForm.enum.length !== 1 ? "s" : ""}
                          </li>
                          <li>• Users will see a dropdown selector instead of a text input</li>
                          <li>• The first value can serve as a default if no other default is specified</li>
                          <li>• Enum values are case-sensitive</li>
                        </ul>
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </div>
            )}

            <div className="flex items-center space-x-2">
              <Checkbox
                id="param-required"
                checked={paramForm.required}
                onCheckedChange={(checked: boolean | string | undefined) =>
                  setParamForm((f) => ({ ...f, required: checked === true }))
                }
              />
              <Label htmlFor="param-required" className="text-sm font-normal">
                Parameter is required
              </Label>
            </div>
            {paramForm.type === Parameter.type.ARRAY && paramForm.arrayItemType === Parameter.type.OBJECT && (
              <div className="space-y-2 border rounded p-4 mt-2 bg-muted">
                <div className="flex items-center justify-between mb-2">
                  <Label className="font-semibold">Object Properties</Label>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm border rounded">
                    <thead>
                      <tr className="bg-muted">
                        <th className="px-2 py-1 text-left">Name</th>
                        <th className="px-2 py-1 text-left">Type</th>
                        <th className="px-2 py-1 text-center">Required</th>
                        <th className="px-2 py-1 text-left">Description</th>
                        <th className="px-2 py-1 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(paramForm.arrayObjectProperties).map(([key, prop]) => (
                        <tr key={key} className="border-t hover:bg-accent">
                          <td className="px-2 py-1">{key}</td>
                          <td className="px-2 py-1">{prop.type}</td>
                          <td className="px-2 py-1 text-center">{prop.required ? "Yes" : "No"}</td>
                          <td className="px-2 py-1">{prop.description}</td>
                          <td className="px-2 py-1 text-center">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() =>
                                setParamForm((f) => {
                                  const newProps = Object.fromEntries(
                                    Object.entries(f.arrayObjectProperties).filter(([k]) => k !== key),
                                  );
                                  return { ...f, arrayObjectProperties: newProps };
                                })
                              }
                              aria-label="Remove"
                            >
                              <span className="sr-only">Remove</span>
                              <svg
                                width="16"
                                height="16"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                viewBox="0 0 24 24"
                              >
                                <path d="M18 6L6 18M6 6l12 12" />
                              </svg>
                            </Button>
                          </td>
                        </tr>
                      ))}
                      {/* New property input row */}
                      <tr>
                        <td className="px-2 py-1">
                          <Input
                            value={newProp.name}
                            onChange={(e) => setNewProp((p) => ({ ...p, name: e.target.value }))}
                            placeholder="Property name"
                            className="w-32"
                          />
                        </td>
                        <td className="px-2 py-1">
                          <Select
                            value={newProp.type}
                            onValueChange={(value) => setNewProp((p) => ({ ...p, type: value as Parameter.type }))}
                          >
                            <SelectTrigger className="w-28">
                              <SelectValue placeholder="Type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value={Parameter.type.STRING}>String</SelectItem>
                              <SelectItem value={Parameter.type.NUMBER}>Number</SelectItem>
                              <SelectItem value={Parameter.type.BOOLEAN}>Boolean</SelectItem>
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="px-2 py-1 text-center">
                          <Checkbox
                            checked={newProp.required}
                            onCheckedChange={(checked) => setNewProp((p) => ({ ...p, required: checked === true }))}
                          />
                        </td>
                        <td className="px-2 py-1">
                          <Input
                            value={newProp.description}
                            onChange={(e) => setNewProp((p) => ({ ...p, description: e.target.value }))}
                            placeholder="Description"
                            className="w-48"
                          />
                        </td>
                        <td className="px-2 py-1 text-center">
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={!newProp.name.trim() || !!paramForm.arrayObjectProperties[newProp.name]}
                            onClick={() => {
                              setParamForm((f) => ({
                                ...f,
                                arrayObjectProperties: {
                                  ...f.arrayObjectProperties,
                                  [newProp.name]: {
                                    type: newProp.type,
                                    required: newProp.required,
                                    description: newProp.description,
                                  },
                                },
                              }));
                              setNewProp({
                                name: "",
                                type: Parameter.type.STRING,
                                required: false,
                                description: "",
                              });
                            }}
                          >
                            Add
                          </Button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            {paramForm.type === Parameter.type.OBJECT && (
              <div className="space-y-2 border rounded p-4 mt-2 bg-muted">
                <div className="flex items-center justify-between mb-2">
                  <Label className="font-semibold">Object Properties</Label>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm border rounded">
                    <thead>
                      <tr className="bg-muted">
                        <th className="px-2 py-1 text-left">Name</th>
                        <th className="px-2 py-1 text-left">Type</th>
                        <th className="px-2 py-1 text-center">Required</th>
                        <th className="px-2 py-1 text-left">Description</th>
                        <th className="px-2 py-1 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(paramForm.objectProperties).map(([key, prop]) => (
                        <tr key={key} className="border-t hover:bg-accent">
                          <td className="px-2 py-0 align-middle">
                            <span>{key}</span>
                          </td>
                          <td className="px-2 py-0 align-middle">
                            <span>{prop.type}</span>
                          </td>
                          <td className="px-2 py-0 align-middle text-center">
                            <span>{prop.required ? "Yes" : "No"}</span>
                          </td>
                          <td className="px-2 py-0 align-middle">
                            <span>{prop.description}</span>
                          </td>
                          <td className="px-2 py-0 align-middle text-center">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() =>
                                setParamForm((f) => {
                                  const newProps = Object.fromEntries(
                                    Object.entries(f.objectProperties).filter(([k]) => k !== key),
                                  );
                                  return { ...f, objectProperties: newProps };
                                })
                              }
                              aria-label="Remove"
                            >
                              <span className="sr-only">Remove</span>
                              <svg
                                width="16"
                                height="16"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                viewBox="0 0 24 24"
                              >
                                <path d="M18 6L6 18M6 6l12 12" />
                              </svg>
                            </Button>
                          </td>
                        </tr>
                      ))}
                      {/* New property input row */}
                      <tr>
                        <td className="px-2 py-1">
                          <Input
                            value={newObjectProp.name}
                            onChange={(e) => setNewObjectProp((p) => ({ ...p, name: e.target.value }))}
                            placeholder="Property name"
                            className="w-32"
                          />
                        </td>
                        <td className="px-2 py-1">
                          <Select
                            value={newObjectProp.type}
                            onValueChange={(value) =>
                              setNewObjectProp((p) => ({ ...p, type: value as Parameter.type }))
                            }
                          >
                            <SelectTrigger className="w-28">
                              <SelectValue placeholder="Type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value={Parameter.type.STRING}>String</SelectItem>
                              <SelectItem value={Parameter.type.NUMBER}>Number</SelectItem>
                              <SelectItem value={Parameter.type.BOOLEAN}>Boolean</SelectItem>
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="px-2 py-1 text-center">
                          <Checkbox
                            checked={newObjectProp.required}
                            onCheckedChange={(checked) =>
                              setNewObjectProp((p) => ({ ...p, required: checked === true }))
                            }
                          />
                        </td>
                        <td className="px-2 py-1">
                          <Input
                            value={newObjectProp.description}
                            onChange={(e) => setNewObjectProp((p) => ({ ...p, description: e.target.value }))}
                            placeholder="Description"
                            className="w-48"
                          />
                        </td>
                        <td className="px-2 py-1 text-center">
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={!newObjectProp.name.trim() || !!paramForm.objectProperties[newObjectProp.name]}
                            onClick={() => {
                              setParamForm((f) => ({
                                ...f,
                                objectProperties: {
                                  ...f.objectProperties,
                                  [newObjectProp.name]: {
                                    type: newObjectProp.type,
                                    required: newObjectProp.required,
                                    description: newObjectProp.description,
                                  },
                                },
                              }));
                              setNewObjectProp({
                                name: "",
                                type: Parameter.type.STRING,
                                required: false,
                                description: "",
                              });
                            }}
                          >
                            Add
                          </Button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
        <DialogFooter className="flex-shrink-0 pt-4 border-t mt-4">
          <Button
            variant="outline"
            onClick={() => {
              onOpenChange(false);
            }}
          >
            Cancel
          </Button>
          <Button onClick={handleSaveParameter}>{editingParameter ? "Update" : "Add"} Parameter</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
