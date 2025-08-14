import { OpenAPIV3 } from "openapi-types";
import { getToolName, TOOL_NAME_MAX_LENGTH } from "./tools.js";

const minimalResponses = {} as OpenAPIV3.ResponsesObject;

describe("getToolName", () => {
  it("returns snake_case operationId if present", () => {
    const op: OpenAPIV3.OperationObject = { operationId: "getUserById", responses: minimalResponses };
    expect(getToolName(op, "get", "/users/{id}")).toBe("get_user_by_id");
  });

  it("returns snake_case summary if no operationId", () => {
    const op: OpenAPIV3.OperationObject = { summary: "Get User By Id", responses: minimalResponses };
    expect(getToolName(op, "get", "/users/{id}")).toBe("get_user_by_id");
  });

  it("returns snake_case method_path if no operationId or summary", () => {
    const op: OpenAPIV3.OperationObject = { responses: minimalResponses };
    expect(getToolName(op, "post", "/foo/bar")).toBe("post_foo_bar");
  });

  it("truncates to TOOL_NAME_MAX_LENGTH for method_path fallback", () => {
    const op: OpenAPIV3.OperationObject = { responses: minimalResponses };
    const longMethod = "post";
    const longPath = "/" + "a".repeat(100);
    expect(getToolName(op, longMethod, longPath).length).toBeLessThanOrEqual(TOOL_NAME_MAX_LENGTH);
  });
});
