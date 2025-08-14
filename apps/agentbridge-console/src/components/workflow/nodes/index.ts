import ApiEndpointNode from "./ApiEndpointNode";
import ApiGatewayNode from "./ApiGatewayNode";
import AuthNode from "./AuthNode";
import AuthProviderNode from "./AuthProviderNode";
import EndNode from "./EndNode";
import { LLMNode } from "./LLMNode";
import RequestNode from "./RequestNode";
import ResponseNode from "./ResponseNode";
import ServerNode from "./ServerNode";
import ToolNode from "./ToolNode";

export const nodeTypes = {
  llm: LLMNode,
  server: ServerNode,
  tool: ToolNode,
  auth: AuthNode,
  "auth-provider": AuthProviderNode,
  "api-endpoint": ApiEndpointNode,
  "api-gateway": ApiGatewayNode,
  request: RequestNode,
  response: ResponseNode,
  end: EndNode,
};

export {
  ApiEndpointNode,
  ApiGatewayNode,
  AuthNode,
  AuthProviderNode,
  EndNode,
  LLMNode,
  RequestNode,
  ResponseNode,
  ServerNode,
  ToolNode,
};

export * from "./ApiEndpointNode";
export * from "./ApiGatewayNode";
export * from "./AuthNode";
export * from "./AuthProviderNode";
export * from "./EndNode";
export * from "./LLMNode";
export * from "./RequestNode";
export * from "./ResponseNode";
export * from "./ServerNode";
export * from "./ToolNode";
