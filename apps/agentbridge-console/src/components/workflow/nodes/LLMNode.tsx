import ClaudeIcon from "@/assets/claude-icon.svg";
import CursorIcon from "@/assets/cursor-icon.svg";
import VSCodeIcon from "@/assets/vscode-icon.svg";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Handle, Position } from "@xyflow/react";
import { useState } from "react";
import { LLMInstallModal } from "../modals/LLMInstallModal";

export type LLMPlatform = "Claude" | "Cursor" | "VSCode" | "Claude Web";

interface LLMOption {
  id: LLMPlatform;
  name: string;
  icon: string | React.ComponentType;
  color: string;
}

const LLM_OPTIONS: LLMOption[] = [
  {
    id: "Claude",
    name: "Claude Desktop",
    icon: ClaudeIcon,
    color: "#6B5B95",
  },
  {
    id: "Claude Web",
    name: "Claude Web",
    icon: ClaudeIcon,
    color: "#6B5B95",
  },
  {
    id: "Cursor",
    name: "Cursor",
    icon: CursorIcon,
    color: "#10B981",
  },
  {
    id: "VSCode",
    name: "VS Code",
    icon: VSCodeIcon,
    color: "#007ACC",
  },
];

export interface LLMNodeData {
  label: string;
  serverId: string;
  serverName: string;
  status?: "active" | "inactive";
}

interface LLMNodeProps {
  data: LLMNodeData;
  selected?: boolean;
}

export function LLMNode({ data, selected }: LLMNodeProps) {
  const [selectedPlatform, setSelectedPlatform] = useState<LLMPlatform | null>(null);
  const [showModal, setShowModal] = useState(false);

  const handlePlatformClick = (platform: LLMPlatform) => {
    setSelectedPlatform(platform);
    setShowModal(true);
  };

  return (
    <>
      <div
        className={`
          bg-white rounded-lg shadow-sm border transition-all
          ${selected ? "border-blue-500 shadow-lg" : "border-gray-200"}
          min-w-[200px]
        `}
      >
        <Handle
          type="source"
          position={Position.Right}
          id="source"
          className="w-3 h-3 bg-gray-400 border-2 border-white"
        />

        <div className="p-6">
          <div className="text-sm font-semibold text-gray-700 mb-4 text-center">Connect Agent</div>
          <TooltipProvider>
            <div className="grid grid-cols-2 gap-3 place-items-center">
              {LLM_OPTIONS.map((option) => (
                <Tooltip key={option.id}>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-12 h-12 p-0 hover:scale-105 transition-all hover:bg-gray-50 hover:border-gray-300 bg-white"
                      onClick={() => handlePlatformClick(option.id)}
                    >
                      {typeof option.icon === "string" ? (
                        <img src={option.icon} alt={option.name} className="w-6 h-6" />
                      ) : (
                        <option.icon />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="text-xs">{option.name}</div>
                  </TooltipContent>
                </Tooltip>
              ))}
            </div>
          </TooltipProvider>

          <div className="mt-4 text-xs text-center text-gray-500">Click to install</div>
        </div>
      </div>

      {selectedPlatform && (
        <LLMInstallModal
          isOpen={showModal}
          onClose={() => {
            setShowModal(false);
            setSelectedPlatform(null);
          }}
          platform={selectedPlatform}
          serverId={data.serverId}
          serverName={data.serverName}
        />
      )}
    </>
  );
}
