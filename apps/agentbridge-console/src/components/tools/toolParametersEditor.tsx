import { Button } from "@/components/ui/button";
import { Parameter, ParameterLocation } from "@agentbridge/api";
import { PlusCircle } from "lucide-react";
import React, { useState } from "react";
import { ParameterEditorDialog } from "./parameterEditorDialog";
import { useToolEditor } from "./toolEditorContext";

// Define a type for the parameter form state
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

export const ToolParametersEditor: React.FC = () => {
  const { tool, setTool } = useToolEditor();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingParameter, setEditingParameter] = useState<Parameter | null>(null);
  const [paramForm, setParamForm] = useState<ParameterForm>({
    name: "",
    type: Parameter.type.STRING,
    required: false,
    description: "",
    enum: [],
    arrayItemType: Parameter.type.STRING,
    arrayObjectProperties: {},
    objectProperties: {},
  });

  if (!tool) return null;

  // Helper to get parameters as array
  const getParametersArray = (toolObj: typeof tool) => {
    if (!toolObj.parameters) return [];
    // Ensure each parameter has a name field
    return Object.entries(toolObj.parameters).map(([key, param]) => ({
      ...param,
      name: param.name || key, // Use the key as name if name is missing
    }));
  };

  // Handler for Add
  const handleAddParameter = () => {
    setEditingParameter(null);
    setParamForm({
      name: "",
      type: Parameter.type.STRING,
      required: false,
      description: "",
      enum: [],
      arrayItemType: Parameter.type.STRING,
      arrayObjectProperties: {},
      objectProperties: {},
    });
    setDialogOpen(true);
  };

  // Handler for Edit
  const handleEditParameter = (param: Parameter) => {
    setEditingParameter(param);
    // Handle both new schema format and legacy format
    const paramType = param.schema?.type || Parameter.type.STRING;
    const properties = param.schema?.properties || {};

    setParamForm({
      name: param.name ?? "",
      type: paramType,
      required: param.required ?? false,
      description: param.description ?? "",
      enum: param.schema?.enum ?? param.enum ?? [],
      arrayItemType: param.schema?.items?.type ?? Parameter.type.STRING,
      arrayObjectProperties:
        param.schema?.items?.type === Parameter.type.OBJECT ? (param.schema?.items?.properties ?? {}) : {},
      objectProperties: paramType === Parameter.type.OBJECT ? properties : {},
    });
    setDialogOpen(true);
  };

  // Handler for Save
  const handleSaveParameter = () => {
    if (!paramForm.name.trim()) return;
    // Create the schema object according to OpenAPI spec
    const schema: Parameter["schema"] = {
      type: paramForm.type,
      ...(paramForm.type === Parameter.type.STRING && paramForm.enum.length > 0 ? { enum: paramForm.enum } : {}),
      ...(paramForm.type === Parameter.type.ARRAY
        ? {
            items: {
              type: paramForm.arrayItemType,
              ...(paramForm.arrayItemType === Parameter.type.OBJECT
                ? { properties: paramForm.arrayObjectProperties }
                : {}),
            },
          }
        : {}),
      ...(paramForm.type === Parameter.type.OBJECT ? { properties: paramForm.objectProperties } : {}),
    };

    // Create the parameter object according to OpenAPI spec
    const newParam: Parameter = {
      name: paramForm.name,
      in: editingParameter?.in || ParameterLocation.QUERY, // Preserve existing location or default to query
      required: paramForm.required,
      schema,
      description: paramForm.description,
    };

    const updatedParameters = { ...tool.parameters };
    if (editingParameter && editingParameter.name in updatedParameters) {
      // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
      delete updatedParameters[editingParameter.name];
    }
    updatedParameters[newParam.name] = newParam;
    setTool({ ...tool, parameters: updatedParameters });
    setDialogOpen(false);
  };

  // Handler for removing a parameter
  const handleRemoveParameter = (paramName: string) => {
    const updatedParameters = { ...tool.parameters };
    // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
    delete updatedParameters[paramName];
    setTool({ ...tool, parameters: updatedParameters });
  };

  return (
    <>
      <div className="border rounded-lg">
        <div className="p-4 border-b">
          <h3 className="font-medium">Tool Parameters</h3>
          <p className="text-sm text-muted-foreground">Define the parameters your tool accepts.</p>
        </div>
        {getParametersArray(tool).length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-sm text-muted-foreground mb-4">No parameters defined yet.</p>
            <Button size="sm" variant="outline" onClick={handleAddParameter}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Parameter
            </Button>
          </div>
        ) : (
          <div className="divide-y">
            {getParametersArray(tool).map((param) => (
              <div key={param.name} className="p-4 flex justify-between items-start">
                <div className="flex-1">
                  <div className="font-medium">{param.name}</div>
                  <div className="text-sm text-muted-foreground">{param.description}</div>
                  <div className="flex flex-wrap gap-1 text-xs mt-1">
                    <span className="inline-block px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                      {param.schema?.type || "unknown"}
                    </span>
                    {param.required && (
                      <span className="inline-block px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">
                        required
                      </span>
                    )}
                    {param.schema && Array.isArray(param.schema.enum) && param.schema.enum.length > 0 && (
                      <span
                        className="inline-block px-2 py-0.5 rounded-full bg-muted text-muted-foreground cursor-help text-xs"
                        title={`Allowed values: ${param.schema.enum.join(", ")}`}
                      >
                        enum ({param.schema.enum.length})
                      </span>
                    )}
                  </div>
                  {param.schema && Array.isArray(param.schema.enum) && param.schema.enum.length > 0 && (
                    <div className="mt-2 p-2 bg-muted/50 rounded-md">
                      <p className="text-xs font-medium text-foreground mb-1">Allowed values:</p>
                      <div className="flex flex-wrap gap-1">
                        {param.schema.enum.map((value: string, index: number) => (
                          <span
                            key={index}
                            className="inline-block px-2 py-0.5 bg-background rounded text-xs font-mono border"
                          >
                            {value}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex space-x-2">
                  <Button variant="ghost" size="sm" onClick={() => handleEditParameter(param)}>
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => handleRemoveParameter(param.name)}
                  >
                    Remove
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      {getParametersArray(tool).length > 0 && (
        <div className="flex justify-end">
          <Button variant="outline" onClick={handleAddParameter}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Parameter
          </Button>
        </div>
      )}
      <ParameterEditorDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editingParameter={editingParameter}
        paramForm={paramForm}
        setParamForm={setParamForm}
        handleSaveParameter={handleSaveParameter}
      />
    </>
  );
};
