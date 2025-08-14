import { ParsedQs } from "qs";

export const queryToBoolean = (query: string | ParsedQs | (string | ParsedQs)[] | undefined): boolean | undefined => {
  if (query === undefined) {
    return undefined;
  }
  if (typeof query === "boolean") {
    return query;
  }
  if (typeof query === "string") {
    return query.toLowerCase() === "true";
  }
  return undefined;
};
