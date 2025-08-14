import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/utils/cn";
import { Tool } from "@agentbridge/api";
import { GripVertical, Play, Settings, Wrench as ToolIcon } from "lucide-react";
import { useCallback, useState } from "react";

interface DraggableToolItemProps {
  tool: Tool;
  onDragStart?: (tool: Tool) => void;
  onDragEnd?: () => void;
  onDrop: (tool: Tool, position: { x: number; y: number }) => void;
  selected?: boolean;
  onClick?: () => void;
  showStatus?: boolean;
  compact?: boolean;
}

export const DraggableToolItem: React.FC<DraggableToolItemProps> = ({
  tool,
  onDragStart,
  onDragEnd,
  onDrop,
  selected = false,
  onClick,
  showStatus = true,
  compact = false,
}) => {
  const [isDragging, setIsDragging] = useState(false);

  // Handle drag start
  const handleDragStart = useCallback(
    (e: React.DragEvent) => {
      setIsDragging(true);

      // Set drag data
      e.dataTransfer.setData("application/json", JSON.stringify(tool));
      e.dataTransfer.setData("text/plain", tool.name);
      e.dataTransfer.effectAllowed = "copy";

      // Create drag image
      const dragImage = document.createElement("div");
      dragImage.className = "bg-white border-2 border-blue-500 rounded-lg p-3 shadow-lg";
      dragImage.style.position = "absolute";
      dragImage.style.top = "-1000px";
      dragImage.innerHTML = `
      <div class="flex items-center space-x-2">
        <div class="w-4 h-4 bg-blue-500 rounded"></div>
        <span class="text-sm font-medium">${tool.name}</span>
      </div>
    `;
      document.body.appendChild(dragImage);
      e.dataTransfer.setDragImage(dragImage, 50, 25);

      // Clean up drag image after a short delay
      setTimeout(() => {
        document.body.removeChild(dragImage);
      }, 0);

      onDragStart?.(tool);
    },
    [tool, onDragStart],
  );

  // Handle drag end
  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
    onDragEnd?.();
  }, [onDragEnd]);

  // Handle double click to add to center of canvas
  const handleDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      // Add to center of canvas
      onDrop(tool, { x: 400, y: 300 });
    },
    [tool, onDrop],
  );

  // Get method color
  const getMethodColor = (method: string) => {
    switch (method?.toLowerCase()) {
      case "get":
        return "bg-green-100 text-green-800 border-green-200";
      case "post":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "put":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "delete":
        return "bg-red-100 text-red-800 border-red-200";
      case "patch":
        return "bg-purple-100 text-purple-800 border-purple-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const truncateText = (text: string, maxLength = 50) => {
    return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
  };

  if (compact) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              draggable
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              onDoubleClick={handleDoubleClick}
              onClick={onClick}
              className={cn(
                "flex items-center space-x-2 p-2 rounded-md border cursor-grab transition-all duration-200",
                "hover:bg-accent hover:shadow-sm active:cursor-grabbing",
                selected && "bg-blue-50 border-blue-200",
                isDragging && "opacity-50",
                "group",
              )}
            >
              <GripVertical className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              <ToolIcon className="h-4 w-4 text-blue-600 flex-shrink-0" />
              <span className="text-sm font-medium truncate flex-1">{tool.name}</span>
              {showStatus && (
                <div className="flex items-center space-x-1">
                  <Badge variant={tool.enabled ? "default" : "secondary"} className="text-xs px-1 py-0">
                    {tool.enabled ? "ON" : "OFF"}
                  </Badge>
                </div>
              )}
            </div>
          </TooltipTrigger>
          <TooltipContent side="right" className="max-w-xs">
            <div className="space-y-1">
              <p className="font-medium">{tool.name}</p>
              {tool.description && <p className="text-xs text-muted-foreground">{tool.description}</p>}
              <div className="flex items-center space-x-2 text-xs">
                <Badge className={cn("text-xs", getMethodColor(tool.method))}>{tool.method?.toUpperCase()}</Badge>
                {tool.url && <span className="text-muted-foreground font-mono">{truncateText(tool.url, 30)}</span>}
              </div>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDoubleClick={handleDoubleClick}
      onClick={onClick}
      className={cn(
        "flex items-start space-x-3 p-3 rounded-lg border cursor-grab transition-all duration-200",
        "hover:bg-accent hover:shadow-sm active:cursor-grabbing",
        selected && "bg-blue-50 border-blue-200 ring-1 ring-blue-200",
        isDragging && "opacity-50 scale-95",
        "group",
      )}
    >
      {/* Drag Handle */}
      <div className="flex-shrink-0 pt-1">
        <GripVertical className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>

      {/* Tool Icon */}
      <div className="flex-shrink-0 pt-1">
        <ToolIcon className="h-5 w-5 text-blue-600" />
      </div>

      {/* Tool Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-medium text-foreground truncate">{tool.name}</h4>
            {tool.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{tool.description}</p>}
          </div>

          {showStatus && (
            <div className="flex items-center space-x-2 ml-2">
              <Badge variant={tool.enabled ? "default" : "secondary"} className="text-xs">
                {tool.enabled ? "Enabled" : "Disabled"}
              </Badge>
            </div>
          )}
        </div>

        {/* Tool Details */}
        <div className="flex items-center space-x-2 mt-2">
          <Badge className={cn("text-xs", getMethodColor(tool.method))}>{tool.method?.toUpperCase()}</Badge>

          {tool.url && (
            <span className="text-xs text-muted-foreground font-mono truncate max-w-[150px]">
              {truncateText(tool.url, 40)}
            </span>
          )}

          {(tool.oAuthProviderId || tool.apiKeyProviderId) && (
            <Badge variant="outline" className="text-xs">
              Auth
            </Badge>
          )}
        </div>

        {/* Quick Actions */}
        <div className="flex items-center space-x-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={(e) => {
              e.stopPropagation();
            }}
          >
            <Play className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={(e) => {
              e.stopPropagation();
            }}
          >
            <Settings className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DraggableToolItem;
