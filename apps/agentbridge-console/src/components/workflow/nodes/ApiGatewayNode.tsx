import { Handle, NodeProps, Position } from "@xyflow/react";
import { Globe } from "lucide-react";
import { memo } from "react";

const ApiGatewayNode = memo(({ selected }: NodeProps) => {
  return (
    <div className="min-w-[180px] max-w-[200px]">
      {/* Single connection handle on the left side */}
      <Handle
        type="target"
        position={Position.Left}
        id="main"
        className="w-4 h-4 bg-purple-500 border-2 border-purple-200 shadow-sm"
      />

      <div
        className={`
          bg-gradient-to-br from-purple-50 to-indigo-50 border-2 border-purple-200 rounded-xl p-4 shadow-lg
          transition-all duration-200 hover:shadow-xl hover:scale-105
          ${selected ? "ring-4 ring-purple-300" : ""}
          text-center relative overflow-hidden
        `}
      >
        {/* Main Icon */}
        <div className="relative z-10">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg">
            <Globe className="w-6 h-6 text-white" />
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-bold text-gray-800">API Gateway</h3>
            <div className="text-xs text-purple-600 font-medium bg-purple-100 px-2 py-1 rounded-full">
              Central API Hub
            </div>
          </div>
        </div>
      </div>

      {/* Output handle to external APIs */}
      <Handle
        type="source"
        position={Position.Right}
        id="output"
        className="w-4 h-4 bg-purple-500 border-2 border-purple-200 shadow-sm"
      />

      {/* Bottom handle for direct connections */}
      <Handle
        type="target"
        position={Position.Bottom}
        id="direct"
        className="w-4 h-4 bg-blue-500 border-2 border-blue-200 shadow-sm"
      />
    </div>
  );
});

ApiGatewayNode.displayName = "ApiGatewayNode";

export default ApiGatewayNode;
