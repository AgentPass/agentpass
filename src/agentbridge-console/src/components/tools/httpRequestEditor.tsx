import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { HttpMethod, ParameterLocation, RequestParamConfig } from "@agentbridge/api";
import Editor from "@monaco-editor/react";
import { Check, ChevronDown, ChevronRight, Copy, Info, Plus, Trash2 } from "lucide-react";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useToolEditor } from "./toolEditorContext";

interface ParameterRow {
  id: string; // Unique identifier for React keys
  key: string;
  value: string;
  enabled: boolean;
  isIncluded?: boolean; // Track if parameter is included in HTTP request
  isRequired?: boolean; // Track if parameter is required
}

// New structure for HTTP request overrides
interface HttpRequestOverrides {
  query?: Record<string, string>;
  headers?: Record<string, string>;
  path?: Record<string, string>;
  body?: unknown;
  bodyFormat?: string;
}

// Legacy format interface
interface LegacyOverrideConfig {
  location: ParameterLocation;
  value: string;
}

interface LegacyOverrides {
  _include?: string[];
  [key: string]: LegacyOverrideConfig | string[] | unknown;
}

// Type guard to check if overrides use the new format
function isNewFormatOverrides(overrides: unknown): overrides is HttpRequestOverrides {
  return (
    overrides !== null &&
    typeof overrides === "object" &&
    ((overrides as HttpRequestOverrides).query !== undefined ||
      (overrides as HttpRequestOverrides).headers !== undefined ||
      (overrides as HttpRequestOverrides).path !== undefined ||
      (overrides as HttpRequestOverrides).body !== undefined)
  );
}

export const HttpRequestEditor: React.FC = () => {
  const { tool, setTool } = useToolEditor();
  const [queryParams, setQueryParams] = useState<ParameterRow[]>([]);
  const [headers, setHeaders] = useState<ParameterRow[]>([]);
  const [pathParams, setPathParams] = useState<ParameterRow[]>([]);
  const [bodyContent, setBodyContent] = useState("");
  const [bodyFormat, setBodyFormat] = useState<"json" | "xml" | "form">("json");
  const [formFields, setFormFields] = useState<ParameterRow[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [lastToolId, setLastToolId] = useState<string | null>(null);
  const [lastOverridesString, setLastOverridesString] = useState<string>("");
  const [hasLoadedOverrides, setHasLoadedOverrides] = useState(false);
  const [copiedParam, setCopiedParam] = useState<string | null>(null);
  const [parametersExpanded, setParametersExpanded] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Use refs to always have access to the latest state
  const queryParamsRef = useRef(queryParams);
  const headersRef = useRef(headers);
  const pathParamsRef = useRef(pathParams);
  const bodyContentRef = useRef(bodyContent);
  const bodyFormatRef = useRef(bodyFormat);
  const formFieldsRef = useRef(formFields);

  // Update refs when state changes
  useEffect(() => {
    queryParamsRef.current = queryParams;
  }, [queryParams]);

  useEffect(() => {
    headersRef.current = headers;
  }, [headers]);

  useEffect(() => {
    pathParamsRef.current = pathParams;
  }, [pathParams]);

  useEffect(() => {
    bodyContentRef.current = bodyContent;
  }, [bodyContent]);

  useEffect(() => {
    bodyFormatRef.current = bodyFormat;
  }, [bodyFormat]);

  useEffect(() => {
    formFieldsRef.current = formFields;
  }, [formFields]);

  // Initialize state from tool configuration only once
  useEffect(() => {
    if (!tool) return;

    // Reset initialization if tool changed or overrides changed
    const overridesString = JSON.stringify(tool.requestParameterOverrides || {});

    // Re-initialize when tool changes or when overrides exist but haven't been loaded yet
    if (tool.id !== lastToolId) {
      setIsInitialized(false);
      setLastToolId(tool.id);
      setLastOverridesString(overridesString);
      setHasLoadedOverrides(false);
    } else if (overridesString !== lastOverridesString) {
      // If overrides changed and we haven't loaded them yet, re-initialize once
      if (!hasLoadedOverrides && overridesString !== "{}") {
        setIsInitialized(false);
      }
      setLastOverridesString(overridesString);
    }

    if (isInitialized) return;

    const overrides = tool.requestParameterOverrides || {};
    const params: ParameterRow[] = [];
    const headerList: ParameterRow[] = [];
    const pathList: ParameterRow[] = [];
    const bodyData: Record<string, string> = {}; // Initialize bodyData here
    const formFieldList: ParameterRow[] = [];
    let rawBodyContent = "";
    let detectedFormat: "json" | "xml" | "form" = "json";

    // Check if we have the new format (with query/headers/path/body structure)
    if (isNewFormatOverrides(overrides)) {
      // Process new format overrides - this is now the preferred format

      // Use a timestamp base to ensure unique IDs
      const timestampBase = Date.now();
      let counter = 0;

      if (overrides.query) {
        Object.entries(overrides.query).forEach(([key, value]) => {
          params.push({
            id: `query-${key}-${timestampBase}-${counter++}`,
            key,
            value: value as string,
            enabled: true,
            isIncluded: true,
          });
        });
      }

      if (overrides.headers) {
        Object.entries(overrides.headers).forEach(([key, value]) => {
          headerList.push({
            id: `header-${key}-${timestampBase}-${counter++}`,
            key,
            value: value as string,
            enabled: true,
            isIncluded: true,
          });
        });
      }

      if (overrides.path) {
        Object.entries(overrides.path).forEach(([key, value]) => {
          pathList.push({
            id: `path-${key}-${timestampBase}-${counter++}`,
            key,
            value: value as string,
            enabled: true,
            isIncluded: true,
          });
        });
      }

      if (overrides.body !== undefined) {
        const bodyFormatValue = (overrides as HttpRequestOverrides).bodyFormat;
        if (bodyFormatValue === "form" && typeof overrides.body === "object") {
          // Handle form-encoded body
          detectedFormat = "form";
          let counter = 0;
          const timestampBase = Date.now();
          Object.entries(overrides.body as Record<string, string>).forEach(([key, value]) => {
            formFieldList.push({
              id: `form-${key}-${timestampBase}-${counter++}`,
              key,
              value: value as string,
              enabled: true,
              isIncluded: true,
            });
          });
        } else if (typeof overrides.body === "object") {
          rawBodyContent = JSON.stringify(overrides.body, null, 2);
          detectedFormat = "json";
        } else {
          rawBodyContent = overrides.body as string;
          detectedFormat = (bodyFormatValue as "json" | "xml" | "form") || "json";
        }
      }

      // For new format, set the state and continue to finalize initialization
    } else {
      // Get included parameters list (default to including all tool parameters)
      const legacyOverrides = overrides as LegacyOverrides;
      const includedParams = legacyOverrides._include || [];

      // Process existing overrides and tool parameters
      Object.entries(overrides).forEach(([name, config]) => {
        // Skip special internal parameters
        if (name.startsWith("_")) {
          if (
            typeof config === "object" &&
            config !== null &&
            (config as LegacyOverrideConfig).location === ParameterLocation.BODY
          ) {
            if (name === "_body") {
              rawBodyContent = (config as LegacyOverrideConfig).value;
            } else if (name === "_bodyFormat") {
              detectedFormat = (config as LegacyOverrideConfig).value as "json" | "xml";
            }
          }
          return;
        }

        if (typeof config === "object" && config !== null) {
          const configObj = config as LegacyOverrideConfig;
          switch (configObj.location) {
            case ParameterLocation.QUERY:
              params.push({
                id: `param-${name}-${Date.now()}`,
                key: name,
                value: configObj.value,
                enabled: true,
                isIncluded: true, // Custom parameters in overrides are always included
              });
              break;
            case ParameterLocation.HEADER:
              headerList.push({
                id: `header-${name}-${Date.now()}`,
                key: name,
                value: configObj.value,
                enabled: true,
                isIncluded: true, // Custom parameters in overrides are always included
              });
              break;
            case ParameterLocation.PATH:
              pathList.push({
                id: `path-${name}-${Date.now()}`,
                key: name,
                value: configObj.value,
                enabled: true,
                isIncluded: true, // Custom parameters in overrides are always included
              });
              break;
            case ParameterLocation.BODY:
              // Skip the default body placeholder
              if (name === "body" && configObj.value === "{{toolParams.body}}") {
                // Skip default body placeholder
              } else {
                bodyData[name] = configObj.value;
              }
              break;
          }
        }
      });

      // Add tool parameters that aren't already in overrides (at the beginning)
      if (tool.parameters) {
        Object.entries(tool.parameters).forEach(([name, param]) => {
          // Skip if already has an override
          if (overrides[name]) return;

          const defaultValue = `{{toolParams.${name}}}`;

          // Tool parameters are included by default, unless explicitly excluded via _include array
          const isToolParamIncluded = includedParams.length === 0 || includedParams.includes(name);

          switch (param.in) {
            case ParameterLocation.PATH:
              pathList.push({
                id: `tool-path-${name}`,
                key: name,
                value: defaultValue,
                enabled: true,
                isIncluded: isToolParamIncluded,
                isRequired: param.required || false,
              });
              break;
            case ParameterLocation.HEADER:
              headerList.push({
                id: `tool-header-${name}`,
                key: name,
                value: defaultValue,
                enabled: true,
                isIncluded: isToolParamIncluded,
                isRequired: param.required || false,
              });
              break;
            case ParameterLocation.QUERY:
            case undefined: // Default to query for backward compatibility
              params.push({
                id: `tool-query-${name}`,
                key: name,
                value: defaultValue,
                enabled: true,
                isIncluded: isToolParamIncluded,
                isRequired: param.required || false,
              });
              break;
            // Skip body parameters - they're handled separately
            case ParameterLocation.BODY:
              break;
          }
        });
      }
      // Handle body content for old format
      if (rawBodyContent) {
        // Use stored raw body content
      } else if (Object.keys(bodyData).length > 0) {
        // Legacy format with individual body parameters
        const hasNonPlaceholderBodyData = Object.keys(bodyData).some(
          (key) => !(key === "body" && bodyData[key] === "{{toolParams.body}}"),
        );

        if (hasNonPlaceholderBodyData) {
          detectedFormat = "json";
          rawBodyContent = JSON.stringify(bodyData, null, 2);
        } else {
          detectedFormat = "json";
          rawBodyContent = "";
        }
      } else {
        detectedFormat = "json";
        rawBodyContent = "";
      }
    } // End of old format processing

    setQueryParams(params);
    setHeaders(headerList);
    setPathParams(pathList);

    // Set body content and format
    setBodyContent(rawBodyContent);
    setBodyFormat(detectedFormat);
    setFormFields(formFieldList);

    setIsInitialized(true);
    setHasLoadedOverrides(true);
  }, [tool, isInitialized, lastToolId, lastOverridesString, hasLoadedOverrides]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  const saveChanges = useCallback(() => {
    if (!tool) return;

    // New structure to store exact HTTP request format
    const httpRequestOverrides: {
      query?: Record<string, string>;
      headers?: Record<string, string>;
      path?: Record<string, string>;
      body?: unknown;
      bodyFormat?: string;
    } = {};

    // Use refs to get the latest state
    const currentQueryParams = queryParamsRef.current;
    const currentHeaders = headersRef.current;
    const currentPathParams = pathParamsRef.current;
    const currentBodyContent = bodyContentRef.current;
    const currentBodyFormat = bodyFormatRef.current;
    const currentFormFields = formFieldsRef.current;

    // Build query parameters object
    const queryParams: Record<string, string> = {};
    currentQueryParams.forEach((param) => {
      // Only include parameters that are included and have a key
      if (param.isIncluded && param.key && !param.key.startsWith("_")) {
        queryParams[param.key] = param.value;
      }
    });

    // Only add query to overrides if there are parameters
    if (Object.keys(queryParams).length > 0) {
      httpRequestOverrides.query = queryParams;
    }

    // Build headers object
    const headers: Record<string, string> = {};
    currentHeaders.forEach((header) => {
      // Only include headers that are included and have a key
      if (header.isIncluded && header.key && !header.key.startsWith("_")) {
        headers[header.key] = header.value;
      }
    });

    // Only add headers to overrides if there are any
    if (Object.keys(headers).length > 0) {
      httpRequestOverrides.headers = headers;
    }

    // Build path parameters object
    const pathParams: Record<string, string> = {};
    currentPathParams.forEach((param) => {
      // Only include path parameters that are included and have a key
      if (param.isIncluded && param.key && !param.key.startsWith("_")) {
        pathParams[param.key] = param.value;
      }
    });

    // Only add path to overrides if there are parameters
    if (Object.keys(pathParams).length > 0) {
      httpRequestOverrides.path = pathParams;
    }

    // Handle body content
    if (currentBodyFormat === "form") {
      // Handle form-encoded body
      const formData: Record<string, string> = {};
      currentFormFields.forEach((field) => {
        if (field.isIncluded && field.key && !field.key.startsWith("_")) {
          formData[field.key] = field.value;
        }
      });
      if (Object.keys(formData).length > 0) {
        httpRequestOverrides.body = formData;
        httpRequestOverrides.bodyFormat = "form";
      }
    } else if (currentBodyContent) {
      try {
        // Try to parse JSON body
        if (currentBodyFormat === "json") {
          httpRequestOverrides.body = JSON.parse(currentBodyContent);
        } else {
          // For XML or other formats, store as string
          httpRequestOverrides.body = currentBodyContent;
        }
        httpRequestOverrides.bodyFormat = currentBodyFormat;
      } catch {
        // If JSON parsing fails, store as string
        httpRequestOverrides.body = currentBodyContent;
        httpRequestOverrides.bodyFormat = currentBodyFormat;
      }
    }
    setTool({ ...tool, requestParameterOverrides: httpRequestOverrides as Record<string, RequestParamConfig> });
  }, [tool, setTool]);

  const deferredSave = useCallback(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = setTimeout(() => {
      saveChanges();
    }, 500);
  }, [saveChanges]);

  // Get all available parameters from tool definition
  const availableParameters = React.useMemo(() => {
    if (!tool || !tool.parameters) return [];

    const params: Array<{
      name: string;
      variable: string;
      location: string;
      description?: string;
      enum?: string[];
      default?: string;
    }> = [];

    Object.entries(tool.parameters).forEach(([name, param]) => {
      if (param.in === ParameterLocation.BODY && param.schema?.properties) {
        // For body parameters with schema, show each property
        Object.entries(param.schema.properties).forEach(([propName, propSchema]: [string, unknown]) => {
          const schemaObj = propSchema as {
            description?: string;
            enum?: string[];
            default?: string;
          };
          params.push({
            name: `${name}.${propName}`,
            variable: `{{toolParams.${name}.${propName}}}`,
            location: "body",
            description: schemaObj.description || `Body property: ${propName}`,
            enum: schemaObj.enum,
            default: schemaObj.default,
          });
        });
      } else if ((param.in as string) === "formData") {
        // Handle formData parameters (not in ParameterLocation enum)
        const schema = param.schema as
          | {
              enum?: string[];
              default?: string;
            }
          | undefined;
        params.push({
          name,
          variable: `{{toolParams.${name}}}`,
          location: "formData",
          description: param.description,
          enum: schema?.enum,
          default: schema?.default,
        });
      } else {
        // Regular parameters
        const schema = param.schema as
          | {
              enum?: string[];
              default?: string;
            }
          | undefined;
        params.push({
          name,
          variable: `{{toolParams.${name}}}`,
          location: param.in || "query",
          description: param.description,
          enum: schema?.enum,
          default: schema?.default,
        });
      }
    });

    return params;
  }, [tool]);

  const copyToClipboard = useCallback((text: string, paramName: string) => {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        setCopiedParam(paramName);
        setTimeout(() => {
          setCopiedParam(null);
        }, 2000);
        return undefined;
      })
      .catch(() => {
        // Handle clipboard error silently
      });
  }, []);

  if (!tool) return null;

  const handleMethodChange = (method: HttpMethod) => {
    setTool({ ...tool, method });
  };

  const handleUrlChange = (url: string) => {
    setTool({ ...tool, url });
  };

  const addParameter = () => {
    const newParams = [
      ...queryParams,
      { id: `custom-query-${Date.now()}`, key: "", value: "", enabled: true, isIncluded: true },
    ];
    setQueryParams(newParams);
    // Don't trigger save immediately when adding empty parameter
    // deferredSave();
  };

  const updateParameter = (index: number, field: keyof ParameterRow, value: string | boolean) => {
    const updated = [...queryParams];
    updated[index] = { ...updated[index], [field]: value };
    setQueryParams(updated);
    deferredSave();
  };

  const toggleParameterInclusion = (index: number) => {
    const updated = [...queryParams];
    updated[index] = { ...updated[index], isIncluded: !updated[index].isIncluded };
    setQueryParams(updated);
    deferredSave();
  };

  const deleteParameter = (index: number) => {
    const newParams = queryParams.filter((_, i) => i !== index);
    setQueryParams(newParams);
    deferredSave();
  };

  const addHeader = () => {
    const newHeaders = [
      ...headers,
      { id: `custom-header-${Date.now()}`, key: "", value: "", enabled: true, isIncluded: true },
    ];
    setHeaders(newHeaders);
    // Don't trigger save immediately when adding empty parameter
    // deferredSave();
  };

  const updateHeader = (index: number, field: keyof ParameterRow, value: string | boolean) => {
    const updated = [...headers];
    updated[index] = { ...updated[index], [field]: value };
    setHeaders(updated);
    deferredSave();
  };

  const toggleHeaderInclusion = (index: number) => {
    const updated = [...headers];
    updated[index] = { ...updated[index], isIncluded: !updated[index].isIncluded };
    setHeaders(updated);
    deferredSave();
  };

  const deleteHeader = (index: number) => {
    const newHeaders = headers.filter((_, i) => i !== index);
    setHeaders(newHeaders);
    deferredSave();
  };

  const addPathParam = () => {
    const newParams = [
      ...pathParams,
      { id: `custom-path-${Date.now()}`, key: "", value: "", enabled: true, isIncluded: true },
    ];
    setPathParams(newParams);
    // Don't trigger save immediately when adding empty parameter
    // deferredSave();
  };

  const updatePathParam = (index: number, field: keyof ParameterRow, value: string | boolean) => {
    const updated = [...pathParams];
    updated[index] = { ...updated[index], [field]: value };
    setPathParams(updated);
    deferredSave();
  };

  const togglePathParamInclusion = (index: number) => {
    const updated = [...pathParams];
    updated[index] = { ...updated[index], isIncluded: !updated[index].isIncluded };
    setPathParams(updated);
    deferredSave();
  };

  const deletePathParam = (index: number) => {
    const newParams = pathParams.filter((_, i) => i !== index);
    setPathParams(newParams);
    deferredSave();
  };

  const handleBodyChange = (value: string | undefined) => {
    const newContent = value || "";
    setBodyContent(newContent);
    deferredSave();
  };

  const handleFormFieldChange = (id: string, field: "key" | "value", value: string) => {
    setFormFields((prev) => prev.map((item) => (item.id === id ? { ...item, [field]: value } : item)));
    deferredSave();
  };

  const handleFormFieldToggle = (id: string) => {
    setFormFields((prev) => prev.map((item) => (item.id === id ? { ...item, isIncluded: !item.isIncluded } : item)));
    deferredSave();
  };

  const handleFormFieldRemove = (id: string) => {
    setFormFields((prev) => prev.filter((item) => item.id !== id));
    deferredSave();
  };

  const handleFormFieldAdd = () => {
    setFormFields((prev) => [
      ...prev,
      {
        id: `form-${Date.now()}`,
        key: "",
        value: "",
        enabled: true,
        isIncluded: true,
      },
    ]);
  };

  const handleBodyFormatChange = (format: "json" | "xml" | "form") => {
    setBodyFormat(format);
    // Clear body content when switching formats
    if (format === "json") {
      setBodyContent("{}");
      setFormFields([]);
    } else if (format === "xml") {
      setBodyContent('<?xml version="1.0" encoding="UTF-8"?>\n<root>\n  \n</root>');
      setFormFields([]);
    } else if (format === "form") {
      setBodyContent("");
      // Initialize with one empty form field
      setFormFields([
        {
          id: `form-${Date.now()}`,
          key: "",
          value: "",
          enabled: true,
          isIncluded: true,
        },
      ]);
    }
    deferredSave();
  };

  const getMethodColor = (method: string) => {
    switch (method.toUpperCase()) {
      case "GET":
        return "bg-green-100 text-green-800";
      case "POST":
        return "bg-blue-100 text-blue-800";
      case "PUT":
        return "bg-yellow-100 text-yellow-800";
      case "PATCH":
        return "bg-orange-100 text-orange-800";
      case "DELETE":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-4">
      {/* Available Parameters Section */}
      <div className="border rounded-lg bg-muted/30">
        <button
          onClick={() => setParametersExpanded(!parametersExpanded)}
          className="w-full p-4 flex items-center gap-2 text-left hover:bg-muted/50 transition-colors rounded-lg"
        >
          {parametersExpanded ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )}
          <Info className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-medium flex-1">Available Parameters</h3>
          {availableParameters.length > 0 && (
            <span className="text-xs text-muted-foreground">
              {availableParameters.length} parameter{availableParameters.length !== 1 ? "s" : ""}
            </span>
          )}
        </button>
        {parametersExpanded && (
          <div className="px-4 pb-4">
            {availableParameters.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No parameters defined. Add parameters in the "Tool Parameters" tab.
              </p>
            ) : (
              <div className="space-y-2">
                {availableParameters.map((param) => (
                  <div key={param.variable} className="border-b border-border/50 last:border-0 pb-2 mb-2 last:mb-0">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <span className="text-sm font-medium">{param.name}</span>
                        <code className="text-xs bg-background px-2 py-0.5 rounded font-mono">{param.variable}</code>
                        <span className="text-xs text-muted-foreground">({param.location})</span>
                        {param.enum && (
                          <span className="text-xs px-1.5 py-0.5 bg-muted text-muted-foreground rounded">enum</span>
                        )}
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 flex-shrink-0 relative"
                        onClick={() => copyToClipboard(param.variable, param.name)}
                        title="Copy to clipboard"
                      >
                        <Copy
                          className={`h-3 w-3 transition-all duration-200 ${copiedParam === param.name ? "scale-0 opacity-0" : "scale-100 opacity-100"}`}
                        />
                        <Check
                          className={`h-3 w-3 text-green-500 absolute transition-all duration-200 ${copiedParam === param.name ? "scale-100 opacity-100" : "scale-0 opacity-0"}`}
                        />
                      </Button>
                    </div>
                    {param.description && (
                      <p className="text-xs text-muted-foreground mt-1 ml-2">{param.description}</p>
                    )}
                    {param.enum && (
                      <div className="text-xs text-muted-foreground mt-1 ml-2">
                        <span className="font-medium">Allowed values:</span> {param.enum.join(", ")}
                      </div>
                    )}
                    {param.default && (
                      <div className="text-xs text-muted-foreground mt-1 ml-2">
                        <span className="font-medium">Default:</span> <span className="font-mono">{param.default}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-3">
              Click the copy button to copy a parameter, then paste it where needed (URL, headers, body, etc.)
            </p>
          </div>
        )}
      </div>

      {/* URL Bar with Reset Button */}
      <div className="flex justify-between items-center mb-2">
        <div className="flex gap-2 flex-1">
          <Select value={tool.method} onValueChange={handleMethodChange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.values(HttpMethod).map((method) => (
                <SelectItem key={method} value={method}>
                  <span className={`px-2 py-1 text-xs font-medium rounded ${getMethodColor(method)}`}>{method}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            value={tool.url}
            onChange={(e) => handleUrlChange(e.target.value)}
            placeholder="https://api.example.com/endpoint"
            className="flex-1"
          />
        </div>
      </div>

      {/* Request Configuration Tabs */}
      <Tabs defaultValue="params" className="w-full">
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="params">Params</TabsTrigger>
          <TabsTrigger value="headers">Headers</TabsTrigger>
          <TabsTrigger value="path">Path Variables</TabsTrigger>
          <TabsTrigger value="body">Body</TabsTrigger>
        </TabsList>

        {/* Query Parameters */}
        <TabsContent value="params" className="space-y-2">
          <div className="flex justify-between items-center mb-2">
            <Label>Query Parameters</Label>
            <Button size="sm" variant="outline" onClick={addParameter}>
              <Plus className="h-4 w-4 mr-1" />
              Add
            </Button>
          </div>
          {queryParams.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No query parameters. Click "Add" to create one.
            </p>
          ) : (
            <div className="border rounded-md">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="w-10 p-2"></th>
                    <th className="text-left p-2 text-sm font-medium">Key</th>
                    <th className="text-left p-2 text-sm font-medium">Value</th>
                    <th className="w-20 p-2"></th>
                    <th className="w-10 p-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {queryParams.map((param, index) => {
                    const isToolParam = tool.parameters && tool.parameters[param.key];
                    return (
                      <tr key={param.id} className={`border-b last:border-0 ${!param.isIncluded ? "opacity-60" : ""}`}>
                        <td className="p-2">
                          <input
                            type="checkbox"
                            checked={param.isIncluded}
                            onChange={() => toggleParameterInclusion(index)}
                            className="rounded border-gray-300"
                          />
                        </td>
                        <td className="p-2">
                          <Input
                            placeholder="Key"
                            value={param.key}
                            onChange={(e) => updateParameter(index, "key", e.target.value)}
                            className="w-full"
                            disabled={!!isToolParam}
                            readOnly={!!isToolParam}
                          />
                        </td>
                        <td className="p-2">
                          <Input
                            placeholder="Value"
                            value={param.value}
                            onChange={(e) => updateParameter(index, "value", e.target.value)}
                            className="w-full"
                            disabled={!param.isIncluded}
                          />
                        </td>
                        <td className="p-2 text-center">
                          <span className="text-xs text-muted-foreground">
                            {isToolParam ? "(from tool)" : "(custom)"}
                          </span>
                        </td>
                        <td className="p-2">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => deleteParameter(index)}
                            className={isToolParam ? "invisible" : "text-destructive hover:text-destructive"}
                            disabled={!!isToolParam}
                            title="Remove custom parameter"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>

        {/* Headers */}
        <TabsContent value="headers" className="space-y-2">
          <div className="flex justify-between items-center mb-2">
            <Label>Headers</Label>
            <Button size="sm" variant="outline" onClick={addHeader}>
              <Plus className="h-4 w-4 mr-1" />
              Add
            </Button>
          </div>
          {headers.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No headers. Click "Add" to create one.</p>
          ) : (
            <div className="border rounded-md">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="w-10 p-2"></th>
                    <th className="text-left p-2 text-sm font-medium">Key</th>
                    <th className="text-left p-2 text-sm font-medium">Value</th>
                    <th className="w-20 p-2"></th>
                    <th className="w-10 p-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {headers.map((header, index) => {
                    const isToolParam = tool.parameters && tool.parameters[header.key];
                    return (
                      <tr
                        key={header.id}
                        className={`border-b last:border-0 ${!header.isIncluded ? "opacity-60" : ""}`}
                      >
                        <td className="p-2">
                          <input
                            type="checkbox"
                            checked={header.isIncluded}
                            onChange={() => toggleHeaderInclusion(index)}
                            className="rounded border-gray-300"
                          />
                        </td>
                        <td className="p-2">
                          <Input
                            placeholder="Key"
                            value={header.key}
                            onChange={(e) => updateHeader(index, "key", e.target.value)}
                            className="w-full"
                            disabled={!!isToolParam}
                            readOnly={!!isToolParam}
                          />
                        </td>
                        <td className="p-2">
                          <Input
                            placeholder="Value"
                            value={header.value}
                            onChange={(e) => updateHeader(index, "value", e.target.value)}
                            className="w-full"
                            disabled={!header.isIncluded}
                          />
                        </td>
                        <td className="p-2 text-center">
                          <span className="text-xs text-muted-foreground">
                            {isToolParam ? "(from tool)" : "(custom)"}
                          </span>
                        </td>
                        <td className="p-2">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => deleteHeader(index)}
                            className={isToolParam ? "invisible" : "text-destructive hover:text-destructive"}
                            disabled={!!isToolParam}
                            title="Remove custom header"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>

        {/* Path Variables */}
        <TabsContent value="path" className="space-y-2">
          <div className="flex justify-between items-center mb-2">
            <Label>Path Variables</Label>
            <Button size="sm" variant="outline" onClick={addPathParam}>
              <Plus className="h-4 w-4 mr-1" />
              Add
            </Button>
          </div>
          {pathParams.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No path variables. Click "Add" to create one.
            </p>
          ) : (
            <div className="border rounded-md">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="w-10 p-2"></th>
                    <th className="text-left p-2 text-sm font-medium">Key</th>
                    <th className="text-left p-2 text-sm font-medium">Value</th>
                    <th className="w-20 p-2"></th>
                    <th className="w-10 p-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {pathParams.map((param, index) => {
                    const isToolParam = tool.parameters && tool.parameters[param.key];
                    return (
                      <tr key={param.id} className={`border-b last:border-0 ${!param.isIncluded ? "opacity-60" : ""}`}>
                        <td className="p-2">
                          <input
                            type="checkbox"
                            checked={param.isIncluded}
                            onChange={() => togglePathParamInclusion(index)}
                            className="rounded border-gray-300"
                          />
                        </td>
                        <td className="p-2">
                          <Input
                            placeholder="Key"
                            value={param.key}
                            onChange={(e) => updatePathParam(index, "key", e.target.value)}
                            className="w-full"
                            disabled={!!isToolParam}
                            readOnly={!!isToolParam}
                          />
                        </td>
                        <td className="p-2">
                          <Input
                            placeholder="Value"
                            value={param.value}
                            onChange={(e) => updatePathParam(index, "value", e.target.value)}
                            className="w-full"
                            disabled={!param.isIncluded}
                          />
                        </td>
                        <td className="p-2 text-center">
                          <span className="text-xs text-muted-foreground">
                            {isToolParam ? "(from tool)" : "(custom)"}
                          </span>
                        </td>
                        <td className="p-2">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => deletePathParam(index)}
                            className={isToolParam ? "invisible" : "text-destructive hover:text-destructive"}
                            disabled={!!isToolParam}
                            title="Remove custom parameter"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          <p className="text-xs text-muted-foreground mt-2">
            Use path variables in your URL like: /users/{"{userId}"}/posts/{"{postId}"}
          </p>
        </TabsContent>

        {/* Body */}
        <TabsContent value="body" className="space-y-2">
          <div className="space-y-3">
            <Label>Request Body</Label>
            <RadioGroup
              value={bodyFormat}
              onValueChange={(value) => handleBodyFormatChange(value as "json" | "xml" | "form")}
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="json" id="json" />
                <Label htmlFor="json" className="font-normal cursor-pointer">
                  JSON
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="xml" id="xml" />
                <Label htmlFor="xml" className="font-normal cursor-pointer">
                  XML
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="form" id="form" />
                <Label htmlFor="form" className="font-normal cursor-pointer">
                  x-www-form-urlencoded
                </Label>
              </div>
            </RadioGroup>
          </div>
          {bodyFormat === "form" ? (
            <div className="space-y-2">
              <div className="border rounded-md p-2">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-sm text-gray-600">
                      <th className="w-8"></th>
                      <th className="px-2">Key</th>
                      <th className="px-2">Value</th>
                      <th className="w-8"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {formFields.map((field) => (
                      <tr key={field.id} className={`border-t ${!field.isIncluded ? "opacity-50" : ""}`}>
                        <td className="w-8 p-1">
                          <input
                            type="checkbox"
                            checked={field.isIncluded}
                            onChange={() => handleFormFieldToggle(field.id)}
                            className="rounded"
                          />
                        </td>
                        <td className="px-2 py-1">
                          <Input
                            placeholder="Key"
                            value={field.key}
                            onChange={(e) => handleFormFieldChange(field.id, "key", e.target.value)}
                            disabled={!field.isIncluded}
                            className="h-8"
                          />
                        </td>
                        <td className="px-2 py-1">
                          <Input
                            placeholder="Value"
                            value={field.value}
                            onChange={(e) => handleFormFieldChange(field.id, "value", e.target.value)}
                            disabled={!field.isIncluded}
                            className="h-8"
                          />
                        </td>
                        <td className="w-8 p-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleFormFieldRemove(field.id)}
                            className="h-8 w-8 p-0"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <Button variant="outline" size="sm" onClick={handleFormFieldAdd} className="mt-2 w-full">
                  <Plus className="h-4 w-4 mr-1" />
                  Add Field
                </Button>
              </div>
              <p className="text-xs text-gray-500">
                Form fields will be sent as application/x-www-form-urlencoded in the request body. Use template
                variables like {"{{toolParams.paramName}}"} to reference tool parameters.
              </p>
            </div>
          ) : (
            <>
              <div className="border rounded-md overflow-hidden">
                <Editor
                  height="300px"
                  language={bodyFormat === "xml" ? "xml" : "json"}
                  value={bodyContent}
                  onChange={handleBodyChange}
                  theme="vs-dark"
                  options={{
                    minimap: { enabled: false },
                    fontSize: 14,
                    lineNumbers: "on",
                    scrollBeyondLastLine: false,
                    wordWrap: "on",
                    wrappingStrategy: "advanced",
                    formatOnPaste: true,
                    formatOnType: true,
                  }}
                />
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">
                  Use template variables like {"{{toolParams.paramName}}"} to reference tool parameters
                </p>
                {bodyFormat === "xml" && (
                  <p className="text-xs text-muted-foreground">
                    For XML requests, ensure your API expects Content-Type: application/xml
                  </p>
                )}
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};
