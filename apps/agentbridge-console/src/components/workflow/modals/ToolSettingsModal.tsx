import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { FormattingConfig, Parameter, ParameterLocation, Tool } from "@agentbridge/api";
import React, { useEffect, useState } from "react";
import { ToolNodeData } from "../types";

interface ToolSettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  toolData: ToolNodeData;
  onSave: (updatedData: Partial<ToolNodeData>) => void;
}

export const ToolSettingsModal: React.FC<ToolSettingsModalProps> = ({ open, onOpenChange, toolData, onSave }) => {
  const [tool, setTool] = useState<Tool>(toolData.tool);
  const [parameters, setParameters] = useState<Record<string, unknown>>(toolData.parameters || {});
  const [enabled, setEnabled] = useState<boolean>(toolData.enabled ?? false);
  const [responseFormatting, setResponseFormatting] = useState<FormattingConfig>(tool.responseFormatting || {});

  useEffect(() => {
    setTool(toolData.tool);
    setParameters(toolData.parameters || {});
    setEnabled(toolData.enabled ?? false);
    setResponseFormatting(toolData.tool.responseFormatting || {});
  }, [toolData]);

  const handleSave = () => {
    const updatedTool: Tool = {
      ...tool,
      responseFormatting,
    };

    onSave({
      tool: updatedTool,
      parameters,
      enabled,
    });
    onOpenChange(false);
  };

  const handleParameterChange = (paramName: string, value: unknown) => {
    setParameters((prev) => ({
      ...prev,
      [paramName]: value,
    }));
  };

  const handleResponseFormattingChange = (field: keyof FormattingConfig, value: string) => {
    setResponseFormatting((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const renderParameterInput = (paramName: string, parameter: Parameter) => {
    const currentValue = parameters[paramName] || parameter.default || "";
    const paramType = parameter.schema?.type || "string";

    switch (paramType) {
      case "boolean":
        return (
          <div className="flex items-center space-x-2">
            <Switch checked={!!currentValue} onCheckedChange={(checked) => handleParameterChange(paramName, checked)} />
            <Label>{currentValue ? "True" : "False"}</Label>
          </div>
        );

      case "number":
        return (
          <Input
            type="number"
            value={currentValue as string}
            onChange={(e) => handleParameterChange(paramName, Number(e.target.value))}
            placeholder={parameter.schema?.description || `Enter ${paramName}`}
          />
        );

      case "array":
        return (
          <Textarea
            value={Array.isArray(currentValue) ? currentValue.join("\n") : (currentValue as string)}
            onChange={(e) => handleParameterChange(paramName, e.target.value.split("\n").filter(Boolean))}
            placeholder="Enter items, one per line"
            rows={3}
          />
        );

      case "object":
        return (
          <Textarea
            value={typeof currentValue === "object" ? JSON.stringify(currentValue, null, 2) : (currentValue as string)}
            onChange={(e) => {
              try {
                const parsed = JSON.parse(e.target.value);
                handleParameterChange(paramName, parsed);
              } catch {
                handleParameterChange(paramName, e.target.value);
              }
            }}
            placeholder="Enter JSON object"
            rows={4}
          />
        );

      default:
        if (parameter.enum && parameter.enum.length > 0) {
          return (
            <Select value={currentValue as string} onValueChange={(value) => handleParameterChange(paramName, value)}>
              <SelectTrigger>
                <SelectValue placeholder={`Select ${paramName}`} />
              </SelectTrigger>
              <SelectContent>
                {parameter.enum.map((option: string) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          );
        }

        return (
          <Input
            value={currentValue as string}
            onChange={(e) => handleParameterChange(paramName, e.target.value)}
            placeholder={parameter.schema?.description || `Enter ${paramName}`}
          />
        );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <span>Tool Settings: {tool.name}</span>
            <Badge variant={enabled ? "default" : "secondary"}>{enabled ? "Enabled" : "Disabled"}</Badge>
          </DialogTitle>
          <DialogDescription>Configure tool parameters and response formatting</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="flex items-center space-x-2">
            <Switch checked={enabled} onCheckedChange={setEnabled} id="tool-enabled" />
            <Label htmlFor="tool-enabled">Enable this tool</Label>
          </div>

          <div className="border-t" />

          <Tabs defaultValue="parameters" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="parameters">Parameters</TabsTrigger>
              <TabsTrigger value="request">Request Config</TabsTrigger>
              <TabsTrigger value="response">Response Format</TabsTrigger>
            </TabsList>

            <TabsContent value="parameters" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Tool Parameters</CardTitle>
                  <CardDescription>Configure the input parameters for this tool</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {Object.entries(tool.parameters || {}).length === 0 ? (
                    <p className="text-sm text-muted-foreground">No parameters available for this tool.</p>
                  ) : (
                    Object.entries(tool.parameters).map(([paramName, parameter]) => (
                      <div key={paramName} className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Label className="font-medium">{paramName}</Label>
                          {parameter.required && (
                            <Badge variant="destructive" className="text-xs">
                              Required
                            </Badge>
                          )}
                          <Badge variant="outline" className="text-xs">
                            {parameter.in || ParameterLocation.QUERY}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {parameter.schema?.type || "string"}
                          </Badge>
                        </div>
                        {parameter.description && (
                          <p className="text-sm text-muted-foreground">{parameter.description}</p>
                        )}
                        {renderParameterInput(paramName, parameter)}
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="request" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Request Configuration</CardTitle>
                  <CardDescription>View and configure the API request settings</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Method</Label>
                      <div className="p-2 bg-muted rounded">
                        <Badge variant="outline">{tool.method}</Badge>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>URL</Label>
                      <div className="p-2 bg-muted rounded font-mono text-sm">{tool.url}</div>
                    </div>
                  </div>

                  {tool.oAuthProviderId && (
                    <div className="space-y-2">
                      <Label>OAuth Provider</Label>
                      <div className="p-2 bg-muted rounded">
                        <Badge variant="default">OAuth: {tool.oAuthProviderId}</Badge>
                      </div>
                    </div>
                  )}

                  {tool.apiKeyProviderId && (
                    <div className="space-y-2">
                      <Label>API Key Provider</Label>
                      <div className="p-2 bg-muted rounded">
                        <Badge variant="default">API Key: {tool.apiKeyProviderId}</Badge>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="response" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Response Formatting</CardTitle>
                  <CardDescription>Configure how the tool response should be formatted</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="template">Response</Label>
                    <Textarea
                      id="template"
                      value={responseFormatting.template || ""}
                      onChange={(e) => handleResponseFormattingChange("template", e.target.value)}
                      placeholder="Use {{data}} to insert the response data"
                      rows={3}
                    />
                    <p className="text-xs text-muted-foreground">
                      Template for formatting the entire response. Use {"{{data}}"} for response data.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="itemTemplate">Item Template</Label>
                    <Textarea
                      id="itemTemplate"
                      value={responseFormatting.itemTemplate || ""}
                      onChange={(e) => handleResponseFormattingChange("itemTemplate", e.target.value)}
                      placeholder="Template for each item in array responses"
                      rows={2}
                    />
                    <p className="text-xs text-muted-foreground">
                      Template for individual items when response is an array.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="header">Header Text</Label>
                      <Input
                        id="header"
                        value={responseFormatting.header || ""}
                        onChange={(e) => handleResponseFormattingChange("header", e.target.value)}
                        placeholder="Text to show before response"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="separator">Item Separator</Label>
                      <Input
                        id="separator"
                        value={responseFormatting.separator || ""}
                        onChange={(e) => handleResponseFormattingChange("separator", e.target.value)}
                        placeholder="e.g., \n, , |"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="emptyResult">Empty Result Message</Label>
                    <Input
                      id="emptyResult"
                      value={responseFormatting.emptyResult || ""}
                      onChange={(e) => handleResponseFormattingChange("emptyResult", e.target.value)}
                      placeholder="Message when no data is returned"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="errorTemplate">Error Template</Label>
                    <Textarea
                      id="errorTemplate"
                      value={responseFormatting.errorTemplate || ""}
                      onChange={(e) => handleResponseFormattingChange("errorTemplate", e.target.value)}
                      placeholder="Template for error responses"
                      rows={2}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
