import { Pagination } from "@agentbridge/api";

export interface PaginatedList<T> {
  data: T[];
  pagination: Pagination;
}
