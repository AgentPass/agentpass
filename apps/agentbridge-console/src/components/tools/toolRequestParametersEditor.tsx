import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ParameterLocation, RequestParamConfig } from "@agentbridge/api";
import { Edit2, Plus, RotateCcw, Trash2 } from "lucide-react";
import React, { useEffect, useState } from "react";
import { RequestParameterDialog } from "./requestParameterDialog";
import { useToolEditor } from "./toolEditorContext";

interface RequestParameterRow {
  name: string;
  config: RequestParamConfig;
  isEnabled: boolean;
  isFromTool: boolean;
  originalLocation?: ParameterLocation;
}

export const ToolRequestParametersEditor: React.FC = () => {
  const { tool, setTool } = useToolEditor();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingParam, setEditingParam] = useState<RequestParameterRow | null>(null);
  const [parameters, setParameters] = useState<RequestParameterRow[]>([]);
  const [showAll, setShowAll] = useState(true);

  // Initialize parameters list
  useEffect(() => {
    if (!tool) return;

    // Initialize requestParameterOverrides if it's null and there are tool parameters
    if (tool.requestParameterOverrides === null && tool.parameters && Object.keys(tool.parameters).length > 0) {
      const defaultOverrides: Record<string, RequestParamConfig> = {};
      Object.entries(tool.parameters).forEach(([name, param]) => {
        defaultOverrides[name] = {
          value: `{{toolParams.${name}}}`,
          location: param.in || ParameterLocation.QUERY,
        };
      });
      setTool({ ...tool, requestParameterOverrides: defaultOverrides });
      return;
    }

    const rows: RequestParameterRow[] = [];
    const overrides = tool.requestParameterOverrides || {};

    // Add all tool parameters
    if (tool.parameters && showAll) {
      Object.entries(tool.parameters).forEach(([name, param]) => {
        const override = overrides[name];
        const isOverridden = !!override;

        rows.push({
          name,
          config:
            isOverridden && typeof override === "object"
              ? override
              : {
                  value: `{{toolParams.${name}}}`,
                  location: param.in || ParameterLocation.QUERY,
                },
          isEnabled: isOverridden,
          isFromTool: true,
          originalLocation: param.in,
        });
      });
    }

    // Add custom parameters (not in tool definition)
    Object.entries(overrides).forEach(([name, config]) => {
      if (!tool.parameters || !(name in tool.parameters)) {
        if (typeof config === "object") {
          rows.push({
            name,
            config,
            isEnabled: true,
            isFromTool: false,
          });
        }
      }
    });

    setParameters(rows);
  }, [tool, showAll, setTool]);

  if (!tool) return null;

  const handleToggleParameter = (paramName: string, enabled: boolean) => {
    let updatedOverrides = { ...(tool.requestParameterOverrides || {}) };

    if (enabled) {
      const param = parameters.find((p) => p.name === paramName);
      if (param) {
        updatedOverrides[paramName] = param.config;
      }
    } else {
      const { [paramName]: _, ...rest } = updatedOverrides;
      updatedOverrides = rest;
    }

    setTool({ ...tool, requestParameterOverrides: updatedOverrides });
  };

  const handleEditParameter = (param: RequestParameterRow) => {
    setEditingParam(param);
    setDialogOpen(true);
  };

  const handleAddParameter = () => {
    setEditingParam(null);
    setDialogOpen(true);
  };

  const handleSaveParameter = (name: string, config: RequestParamConfig, originalName?: string) => {
    let updatedOverrides = { ...(tool.requestParameterOverrides || {}) };

    // If renaming, remove the old name
    if (originalName && originalName !== name) {
      const { [originalName]: _, ...rest } = updatedOverrides;
      updatedOverrides = rest;
    }

    updatedOverrides[name] = config;
    setTool({ ...tool, requestParameterOverrides: updatedOverrides });
    setDialogOpen(false);
  };

  const handleDeleteParameter = (paramName: string) => {
    const updatedOverrides = { ...(tool.requestParameterOverrides || {}) };
    const { [paramName]: _, ...rest } = updatedOverrides;
    setTool({ ...tool, requestParameterOverrides: rest });
  };

  const handleResetParameter = (paramName: string) => {
    const param = tool.parameters?.[paramName];
    if (!param) return;

    const updatedOverrides = { ...(tool.requestParameterOverrides || {}) };
    updatedOverrides[paramName] = {
      value: `{{toolParams.${paramName}}}`,
      location: param.in || ParameterLocation.QUERY,
    };
    setTool({ ...tool, requestParameterOverrides: updatedOverrides });
  };

  const getValuePreview = (value: string) => {
    if (value.length > 40) {
      return value.substring(0, 37) + "...";
    }
    return value;
  };

  const hasLocationChanged = (param: RequestParameterRow) => {
    return param.isFromTool && param.originalLocation && param.config.location !== param.originalLocation;
  };

  return (
    <>
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-medium">Request Parameters</h3>
            <p className="text-sm text-muted-foreground">Configure how tool parameters are sent in the API request.</p>
          </div>
          <div className="flex gap-2">
            {!showAll && tool.parameters && Object.keys(tool.parameters).length > 0 && (
              <Button variant="outline" size="sm" onClick={() => setShowAll(true)}>
                Show All Tool Parameters
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={handleAddParameter}>
              <Plus className="mr-2 h-4 w-4" />
              Add Parameter
            </Button>
          </div>
        </div>

        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10"></TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Value</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {parameters.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    No parameters configured
                  </TableCell>
                </TableRow>
              ) : (
                parameters.map((param) => (
                  <TableRow key={param.name}>
                    <TableCell>
                      <Checkbox
                        checked={param.isEnabled}
                        onCheckedChange={(checked) => handleToggleParameter(param.name, checked as boolean)}
                      />
                    </TableCell>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {param.name}
                        {param.isFromTool && (
                          <Badge variant="outline" className="text-xs">
                            from tool
                          </Badge>
                        )}
                        {!param.isFromTool && (
                          <Badge variant="secondary" className="text-xs">
                            custom
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Badge variant={hasLocationChanged(param) ? "destructive" : "default"}>
                          {param.config.location}
                        </Badge>
                        {hasLocationChanged(param) && (
                          <span className="text-xs text-muted-foreground">(was: {param.originalLocation})</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <code className="text-xs bg-muted px-1 py-0.5 rounded">
                        {param.isEnabled ? getValuePreview(param.config.value) : "[not sent]"}
                      </code>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => handleEditParameter(param)}>
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        {param.isFromTool && param.isEnabled && (
                          <Button variant="ghost" size="icon" onClick={() => handleResetParameter(param.name)}>
                            <RotateCcw className="h-4 w-4" />
                          </Button>
                        )}
                        {!param.isFromTool && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleDeleteParameter(param.name)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <RequestParameterDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editingParam={editingParam}
        toolParameters={tool.parameters || {}}
        onSave={handleSaveParameter}
      />
    </>
  );
};
