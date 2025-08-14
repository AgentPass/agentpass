import { McpServer, Parameter, ServerAuthType } from "@agentbridge/api";

export interface TemplateSuggestion {
  template: string;
  description: string;
  category: string;
  example?: string;
  condition?: (server?: McpServer) => boolean;
}

export const CONTEXT_TEMPLATE_SUGGESTIONS: TemplateSuggestion[] = [
  {
    template: "{{auth.jwt}}",
    description: "Raw JWT token from request Authorization header",
    category: "Authentication",
    example: "Bearer {{auth.jwt}}",
    condition: (server) => server?.authType === ServerAuthType.JWT,
  },
  {
    template: "{{auth.jwt.<jwtProperty>}}",
    description: "Any JWT claim property (replace <jwtProperty> with actual property name)",
    category: "Authentication",
    example: "{{auth.jwt.sub}} or {{auth.jwt.organizationId}}",
    condition: (server) => server?.authType === ServerAuthType.JWT,
  },
  // Future context variables can be added here
  // {
  //   template: "{{user.id}}",
  //   description: "Current user ID",
  //   category: "User Context",
  //   condition: (server) => server?.authType === ServerAuthType.BASE
  // }
];

export function generateTemplateSuggestions(toolParameters: Record<string, Parameter>, server?: McpServer): string[] {
  const toolParamSuggestions = Object.keys(toolParameters).map((param) => `{{toolParams.${param}}}`);

  const contextSuggestions = CONTEXT_TEMPLATE_SUGGESTIONS.filter(
    (suggestion) => !suggestion.condition || suggestion.condition(server),
  ).map((suggestion) => suggestion.template);

  return [...toolParamSuggestions, ...contextSuggestions];
}
