import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
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
import { Parameter, ParameterLocation, RequestParamConfig } from "@agentbridge/api";
import { AlertTriangle } from "lucide-react";
import React, { useEffect, useState } from "react";
import { generateTemplateSuggestions } from "../../utils/templateSuggestions";
import { useToolEditor } from "./toolEditorContext";

interface RequestParameterDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingParam: {
    name: string;
    config: RequestParamConfig;
    isFromTool: boolean;
    originalLocation?: ParameterLocation;
  } | null;
  toolParameters: Record<string, Parameter>;
  onSave: (name: string, config: RequestParamConfig, originalName?: string) => void;
}

export const RequestParameterDialog: React.FC<RequestParameterDialogProps> = ({
  open,
  onOpenChange,
  editingParam,
  toolParameters,
  onSave,
}) => {
  const [name, setName] = useState("");
  const [value, setValue] = useState("");
  const [location, setLocation] = useState<ParameterLocation>(ParameterLocation.QUERY);
  const [nameError, setNameError] = useState("");

  useEffect(() => {
    if (editingParam) {
      setName(editingParam.name);
      setValue(editingParam.config.value);
      setLocation(editingParam.config.location);
    } else {
      setName("");
      setValue("");
      setLocation(ParameterLocation.QUERY);
    }
    setNameError("");
  }, [editingParam, open]);

  const validateName = (newName: string) => {
    if (!newName.trim()) {
      setNameError("Parameter name is required");
      return false;
    }

    // Check if name already exists (unless we're editing the same parameter)
    if (editingParam?.name !== newName && toolParameters[newName]) {
      setNameError("A tool parameter with this name already exists");
      return false;
    }

    setNameError("");
    return true;
  };

  const handleSave = () => {
    if (!validateName(name)) return;

    onSave(name, { value, location }, editingParam?.name);
  };

  const { server } = useToolEditor();
  const isLocationDifferent =
    editingParam?.isFromTool && editingParam.originalLocation && location !== editingParam.originalLocation;

  const suggestedVariables = generateTemplateSuggestions(toolParameters, server);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>{editingParam ? "Edit Parameter" : "Add Parameter"}</DialogTitle>
          <DialogDescription>Configure how this parameter will be sent in the API request.</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="param-name">Parameter Name</Label>
            <Input
              id="param-name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                validateName(e.target.value);
              }}
              placeholder="e.g., Authorization, apiKey, query"
              className={nameError ? "border-destructive" : ""}
            />
            {nameError && <p className="text-sm text-destructive">{nameError}</p>}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="param-location">Location</Label>
            <Select value={location} onValueChange={(value) => setLocation(value as ParameterLocation)}>
              <SelectTrigger id="param-location">
                <SelectValue placeholder="Select location" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ParameterLocation.QUERY}>Query</SelectItem>
                <SelectItem value={ParameterLocation.PATH}>Path</SelectItem>
                <SelectItem value={ParameterLocation.HEADER}>Header</SelectItem>
                <SelectItem value={ParameterLocation.BODY}>Body</SelectItem>
              </SelectContent>
            </Select>
            {isLocationDifferent && (
              <Alert className="mt-2">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  This parameter's location differs from the tool definition (was: {editingParam.originalLocation})
                </AlertDescription>
              </Alert>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="param-value">Value</Label>
            <Textarea
              id="param-value"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="Static value or template, e.g., {{toolParams.productId}}"
              rows={3}
              className="font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              Use Handlebars syntax to reference tool parameters. Available: {suggestedVariables.slice(0, 3).join(", ")}
              {suggestedVariables.length > 3 && ` and ${suggestedVariables.length - 3} more`}
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!name.trim() || !value.trim() || !!nameError}>
            {editingParam ? "Update" : "Add"} Parameter
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
