import AddToolEdge from "./AddToolEdge";
import CustomDeletableEdge from "./CustomDeletableEdge";
import ServerToToolEdge from "./ServerToToolEdge";
import ToolToApiEdge from "./ToolToApiEdge";

export const edgeTypes = {
  deletable: CustomDeletableEdge,
  addTool: AddToolEdge,
  toolToApi: ToolToApiEdge,
  serverToTool: ServerToToolEdge,
};

export { AddToolEdge, CustomDeletableEdge, ServerToToolEdge, ToolToApiEdge };
