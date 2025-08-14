import { generateHandlebarsTemplate } from "@/api/services/ai.service";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { Loader2, Sparkles } from "lucide-react";
import React, { useState } from "react";
import { useToolEditor } from "./toolEditorContext";

export const ToolFormattingEditor: React.FC = () => {
  const { tool, setTool } = useToolEditor();

  // Local state for formatting fields
  const [editResponseTemplate, setEditResponseTemplate] = useState(tool?.responseFormatting?.template || "");
  const [editIncludeRequestData, setEditIncludeRequestData] = useState(
    tool?.responseFormatting?.includeRequestData || false,
  );
  const [isGeneratingTemplate, setIsGeneratingTemplate] = useState(false);

  // Sync local state with context tool when tool changes
  React.useEffect(() => {
    setEditResponseTemplate(tool?.responseFormatting?.template || "");
    setEditIncludeRequestData(tool?.responseFormatting?.includeRequestData || false);
  }, [tool]);

  // Update context tool when any field changes
  React.useEffect(() => {
    if (!tool) return;
    setTool({
      ...tool,
      responseFormatting: {
        ...tool.responseFormatting,
        template: editResponseTemplate,
        includeRequestData: editIncludeRequestData,
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editResponseTemplate, editIncludeRequestData]);

  // AI template generation function
  const generateAITemplate = async () => {
    if (!tool) return;

    setIsGeneratingTemplate(true);

    try {
      // Call the backend API to generate template
      const result = await generateHandlebarsTemplate({
        name: tool.name,
        description: tool.description,
        method: tool.method,
        url: tool.url,
        parameters: tool.parameters,
        requestParameterOverrides: tool.requestParameterOverrides || undefined,
        responses: tool.responses,
      });

      // Update the response template with AI-generated content
      setEditResponseTemplate(result.template);

      toast({
        title: "AI Template Generated",
        description: "Agent-optimized response template has been generated successfully.",
        variant: "success",
      });
    } catch (error) {
      toast({
        title: "Generation Failed",
        description: error instanceof Error ? error.message : "Failed to generate AI template. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingTemplate(false);
    }
  };

  if (!tool) return null;

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="include-request-data"
            checked={editIncludeRequestData}
            onCheckedChange={(checked) => setEditIncludeRequestData(checked as boolean)}
          />
          <Label htmlFor="include-request-data">Include Request Data in Templates</Label>
        </div>
        <p className="text-sm text-muted-foreground">
          When enabled, request data will be available in templates via the "request" variable.
        </p>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="tool-template">Response</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={generateAITemplate}
            disabled={isGeneratingTemplate}
            className="flex items-center gap-2"
          >
            {isGeneratingTemplate ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Generate Response
              </>
            )}
          </Button>
        </div>
        <div className="flex items-center gap-2 mb-2">
          <p className="text-sm text-muted-foreground">Configure how the tool answers to the LLM.</p>
          <Badge variant="secondary" className="text-xs">
            Agent-Optimized
          </Badge>
        </div>
        <Textarea
          id="tool-template"
          value={editResponseTemplate}
          onChange={(e) => setEditResponseTemplate(e.target.value)}
          rows={8}
          placeholder="=== Response ===\n{{#each response.data.body}}\n- {{@key}}: {{this}}\n{{/each}}"
        />
      </div>

      <div className="border rounded-lg mt-4">
        <div className="p-4 border-b">
          <h3 className="font-medium">Template Variables (Handlebars)</h3>
          <p className="text-sm text-muted-foreground">Available variables for your templates:</p>
        </div>
        <div className="p-4 space-y-2">
          <div className="grid grid-cols-3 gap-2 text-sm">
            <div className="font-mono bg-muted p-1 rounded">{"{{json response}}"}</div>
            <div className="col-span-2">JSON stringify the entire response object</div>

            <div className="font-mono bg-muted p-1 rounded">{"{{request.data.parameters}}"}</div>
            <div className="col-span-2">Request parameters (headers, query, path)</div>

            <div className="font-mono bg-muted p-1 rounded">{"{{request.data.payload}}"}</div>
            <div className="col-span-2">Request payload/body data</div>

            <div className="font-mono bg-muted p-1 rounded">{"{{response.data.headers}}"}</div>
            <div className="col-span-2">Response headers</div>

            <div className="font-mono bg-muted p-1 rounded">{"{{response.data.body}}"}</div>
            <div className="col-span-2">Response body content</div>

            <div className="font-mono bg-muted p-1 rounded">{"{{#each response.data.body}}"}</div>
            <div className="col-span-2">Loop through response body items</div>

            <div className="font-mono bg-muted p-1 rounded">{"{{@key}}"}</div>
            <div className="col-span-2">Current key in each loop</div>

            <div className="font-mono bg-muted p-1 rounded">{"{{this}}"}</div>
            <div className="col-span-2">Current value in each loop</div>

            <div className="font-mono bg-muted p-1 rounded">{"{{#if condition}}"}</div>
            <div className="col-span-2">Conditional rendering</div>

            <div className="font-mono bg-muted p-1 rounded">{"{{message}}"}</div>
            <div className="col-span-2">Error message (in error template)</div>
          </div>
        </div>
      </div>
    </div>
  );
};
