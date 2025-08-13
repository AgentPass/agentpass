import { api } from "@/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trackEvent } from "@/utils/analytics";
import { Tool } from "@agentbridge/api";
import { AnalyticsEvents } from "@agentbridge/utils";
import { Key, Play } from "lucide-react";
import { useState } from "react";

interface Props {
  tool: Tool;
  serverId: string;
  onExecute: (parameters: Record<string, unknown>) => Promise<void>;
  isExecuting: boolean;
}

export function ApiExec({ tool, serverId, onExecute, isExecuting }: Props) {
  const [parameters, setParameters] = useState<Record<string, unknown>>({});
  const [paramErrors, setParamErrors] = useState<Record<string, string>>({});

  const providerId = tool.oAuthProviderId;
  const isAuthorized = tool.adminAuthorized;

  const getRequiredParams = (): string[] => {
    return Object.entries(tool.parameters || {})
      .filter(([_, parameter]) => parameter.required)
      .map(([name]) => name);
  };

  const requiredParams = getRequiredParams();

  const handleParameterChange = (name: string, value: unknown) => {
    const newParams = {
      ...parameters,
      [name]: value,
    };
    setParameters(newParams);

    if (requiredParams.includes(name)) {
      if (!value || value.toString().trim() === "") {
        setParamErrors((prev) => ({
          ...prev,
          [name]: "This field is required",
        }));
      } else {
        setParamErrors((prev) => {
          const newErrors = { ...prev };
          // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
          delete newErrors[name];
          return newErrors;
        });
      }
    }
  };

  const validateRequiredParams = (): boolean => {
    const missingParams: Record<string, string> = {};
    let isValid = true;

    for (const param of requiredParams) {
      if (!parameters[param] || parameters[param].toString().trim() === "") {
        missingParams[param] = "This field is required";
        isValid = false;
      }
    }

    setParamErrors(missingParams);
    return isValid;
  };

  const handleAuthorize = async () => {
    if (!providerId) {
      return;
    }

    // Track OAuth flow started
    trackEvent(AnalyticsEvents.OAUTH_FLOW_STARTED, {
      provider_id: providerId,
      server_id: serverId,
      tool_id: tool.id,
      scope: "tool",
    });

    await api.authProviders.authorize(serverId, providerId, tool.id);
  };

  const handleExecute = async () => {
    if (providerId && !isAuthorized) {
      return;
    }

    if (!validateRequiredParams()) {
      return;
    }

    const allParams = { ...parameters };

    await onExecute(allParams);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <span
            className={`inline-block px-2 py-1 text-xs font-medium rounded ${
              tool.method === "GET"
                ? "bg-blue-100 text-blue-800"
                : tool.method === "POST"
                  ? "bg-green-100 text-green-800"
                  : tool.method === "PUT"
                    ? "bg-amber-100 text-amber-800"
                    : tool.method === "DELETE"
                      ? "bg-red-100 text-red-800"
                      : "bg-gray-100 text-gray-800"
            }`}
          >
            {tool.method.toUpperCase()}
          </span>
          <span className="ml-2 text-sm font-mono text-muted-foreground">{tool.url}</span>
        </div>
      </div>

      {providerId && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isAuthorized ? "bg-blue-500" : "bg-yellow-500"}`}></div>
            <span className="text-sm">{isAuthorized ? "Authorized" : "Authorization required"}</span>
          </div>
          <Button onClick={handleAuthorize} variant="outline" className="w-full">
            <Key className="h-4 w-4 mr-2" />
            {isAuthorized ? "Re-Authorize" : "Authorize"}
          </Button>
        </div>
      )}

      <div className="space-y-4">
        <h3 className="text-sm font-medium">Query Parameters</h3>
        {Object.entries(tool.parameters || {}).map(([name, parameter]) => {
          const isEnum = typeof parameter === "object" && parameter.enum && Array.isArray(parameter.enum);
          const enumValues = isEnum ? parameter.enum : [];

          const isRequired = requiredParams.includes(name);
          const hasError = !!paramErrors[name];

          return (
            <div key={name} className="grid grid-cols-4 gap-4 items-start">
              <Label htmlFor={name} className="text-sm font-medium pt-2">
                {name}
                {isRequired && <span className="text-yellow-500 ml-1">*</span>}
              </Label>
              <div className="col-span-3 space-y-1">
                {isEnum ? (
                  <>
                    <Select
                      value={parameters[name]?.toString() || ""}
                      onValueChange={(value) => handleParameterChange(name, value)}
                    >
                      <SelectTrigger className={hasError ? "border-yellow-400 focus-visible:ring-yellow-400" : ""}>
                        <SelectValue placeholder={`Select ${name}`} />
                      </SelectTrigger>
                      <SelectContent>
                        {enumValues?.map((value: string) => (
                          <SelectItem key={value} value={value}>
                            {value}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {parameter.schema.description && (
                      <div className="text-xs text-muted-foreground pt-2">{parameter.schema.description}</div>
                    )}
                  </>
                ) : (
                  <>
                    <Input
                      id={name}
                      value={parameters[name]?.toString() || ""}
                      onChange={(e) => handleParameterChange(name, e.target.value)}
                      placeholder={
                        typeof parameter === "object" ? parameter.description || `Enter ${name}` : `Enter ${name}`
                      }
                      className={hasError ? "border-yellow-400 focus-visible:ring-yellow-400" : ""}
                    />
                    {parameter.schema.description && (
                      <div className="text-xs text-muted-foreground pt-2">{parameter.schema.description}</div>
                    )}
                  </>
                )}
                {hasError && <div className="text-xs text-yellow-500 mt-1">{paramErrors[name]}</div>}
              </div>
            </div>
          );
        })}
      </div>

      <Button
        onClick={handleExecute}
        disabled={isExecuting || Object.keys(paramErrors).length > 0 || (!!providerId && !isAuthorized)}
        className="w-full"
      >
        {isExecuting ? (
          <span className="flex items-center">
            <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground mr-2"></span>
            Executing...
          </span>
        ) : (
          <>
            <Play className="h-4 w-4 mr-2" />
            Execute
          </>
        )}
      </Button>
    </div>
  );
}
