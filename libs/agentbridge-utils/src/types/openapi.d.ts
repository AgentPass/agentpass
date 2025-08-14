import { OpenAPIV2 as _OpenAPIV2, OpenAPIV3 as _OpenAPIV3, OpenAPIV3_1 as _OpenAPIV3_1 } from "openapi-types";

// reexport so we will have control over it
export { OpenAPIV2, OpenAPIV3, OpenAPIV3_1 } from "openapi-types";
export namespace OpenAPI {
  export type OpenAPIV2 = _OpenAPIV2;
  export type OpenAPIV3 = _OpenAPIV3;
  export type OpenAPIV3_1 = _OpenAPIV3_1;

  export type V3Document = OpenAPIV3.Document | OpenAPIV3_1.Document;
  export type V2Document = OpenAPIV2.Document;
  export type Document = V2Document | V3Document;
  export type RequestBodyObject = OpenAPIV3.RequestBodyObject | OpenAPIV3_1.RequestBodyObject;
  export type SecuritySchemeV3 = OpenAPIV3.OAuth2SecurityScheme;
  export type SecuritySchemeV2 = OpenAPIV2.SecuritySchemeOauth2;
  export type SecuritySchemeOAuth2 = SecuritySchemeV2 | SecuritySchemeV3;

  export type SecuritySchemeObject =
    | OpenAPIV2.SecuritySchemeObject
    | OpenAPIV3.SecuritySchemeObject
    | OpenAPIV3_1.SecuritySchemeObject;
  export type OperationObject = OpenAPIV2.OperationObject | OpenAPIV3.OperationObject;
  export type PathItem = OpenAPIV2.PathItemObject | OpenAPIV3.PathItemObject | OpenAPIV3_1.PathItemObject;

  export type PathsObject = OpenAPIV2.PathsObject | OpenAPIV3.PathsObject | OpenAPIV3_1.PathsObject;

  export type Operation = OpenAPIV2.OperationObject | OpenAPIV3.OperationObject | OpenAPIV3_1.OperationObject;

  export type ParameterObject =
    | OpenAPIV2.Parameters
    | (OpenAPIV3.ReferenceObject | OpenAPIV3.ParameterObject)[]
    | (OpenAPIV3.ParameterObject | OpenAPIV3_1.ReferenceObject)[];

  export type ReferenceObject = OpenAPIV3.ReferenceObject | OpenAPIV2.ReferenceObject | OpenAPIV3_1.ReferenceObject;

  export type HttpMethods = OpenAPIV2.HttpMethods | OpenAPIV3.HttpMethods;
}
