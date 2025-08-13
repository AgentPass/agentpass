import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/utils/cn";
import { OAuthProvider } from "@agentbridge/api";
import { GripVertical, Key, Lock } from "lucide-react";
import { useCallback, useState } from "react";

export type AuthProviderItem = {
  id: string;
  name: string;
  type: "oauth" | "apikey";
  provider?: OAuthProvider;
};

interface DraggableAuthProviderItemProps {
  provider: AuthProviderItem;
  onDragStart?: (provider: AuthProviderItem) => void;
  onDragEnd?: () => void;
  onDrop: (provider: AuthProviderItem, position: { x: number; y: number }) => void;
  selected?: boolean;
  onClick?: () => void;
  compact?: boolean;
}

export const DraggableAuthProviderItem: React.FC<DraggableAuthProviderItemProps> = ({
  provider,
  onDragStart,
  onDragEnd,
  onDrop,
  selected = false,
  onClick,
  compact = false,
}) => {
  const [isDragging, setIsDragging] = useState(false);

  // Handle drag start
  const handleDragStart = useCallback(
    (e: React.DragEvent) => {
      setIsDragging(true);

      // Call the parent's onDragStart to set the dragged type
      onDragStart?.(provider);

      // Set basic drag data for browser compatibility
      e.dataTransfer.effectAllowed = "move";
    },
    [provider, onDragStart],
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
      onDrop(provider, { x: 600, y: 300 });
    },
    [provider, onDrop],
  );

  const isOAuth = provider.type === "oauth";
  const Icon = isOAuth ? Lock : Key;
  const iconColor = isOAuth ? "text-purple-600" : "text-green-600";
  const bgColor = isOAuth ? "bg-purple-50" : "bg-green-50";
  const borderColor = isOAuth ? "border-purple-200" : "border-green-200";

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
                selected && bgColor + " " + borderColor,
                isDragging && "opacity-50",
                "group",
              )}
            >
              <GripVertical className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              <Icon className={cn("h-4 w-4 flex-shrink-0", iconColor)} />
              <span className="text-sm font-medium truncate flex-1">{provider.name}</span>
              <Badge
                variant="outline"
                className={cn("text-xs px-1 py-0", isOAuth ? "text-purple-700" : "text-green-700")}
              >
                {isOAuth ? "OAuth" : "API Key"}
              </Badge>
            </div>
          </TooltipTrigger>
          <TooltipContent side="right" className="max-w-xs">
            <div className="space-y-1">
              <p className="font-medium">{provider.name}</p>
              <p className="text-xs text-muted-foreground">
                {isOAuth ? "OAuth 2.0 authentication provider" : "API Key authentication provider"}
              </p>
              <p className="text-xs text-muted-foreground">Double-click or drag to add to workflow</p>
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
        selected && bgColor + " " + borderColor + " ring-1",
        isDragging && "opacity-50 scale-95",
        "group",
      )}
    >
      {/* Drag Handle */}
      <div className="flex-shrink-0 pt-1">
        <GripVertical className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>

      {/* Provider Icon */}
      <div className="flex-shrink-0 pt-1">
        <Icon className={cn("h-5 w-5", iconColor)} />
      </div>

      {/* Provider Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-medium text-foreground truncate">{provider.name}</h4>
            <p className="text-xs text-muted-foreground mt-1">
              {isOAuth ? "OAuth 2.0 authentication" : "API Key authentication"}
            </p>
          </div>

          <Badge
            variant="outline"
            className={cn(
              "text-xs ml-2",
              isOAuth ? "text-purple-700 border-purple-200" : "text-green-700 border-green-200",
            )}
          >
            {isOAuth ? "OAuth" : "API Key"}
          </Badge>
        </div>

        <p className="text-xs text-muted-foreground mt-2">Drag to workflow to create an authentication node</p>
      </div>
    </div>
  );
};

export default DraggableAuthProviderItem;
