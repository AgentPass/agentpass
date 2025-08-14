import * as CollapsiblePrimitive from "@radix-ui/react-collapsible";
import { ChevronDown } from "lucide-react";
import * as React from "react";

import { cn } from "@/utils/cn";

export interface CollapsibleCardProps {
  title: string;
  icon: React.ReactNode;
  variant: "info" | "success" | "error" | "warning";
  defaultExpanded?: boolean;
  autoCollapse?: boolean;
  autoCollapseDelay?: number;
  children: React.ReactNode;
  summary?: string;
  className?: string;
}

const CollapsibleCard: React.FC<CollapsibleCardProps> = ({
  title,
  icon,
  variant,
  defaultExpanded = false,
  autoCollapse = false,
  autoCollapseDelay = 3000,
  children,
  summary,
  className,
}) => {
  const [isExpanded, setIsExpanded] = React.useState(defaultExpanded);

  React.useEffect(() => {
    if (autoCollapse && variant === "success" && isExpanded) {
      const timer = setTimeout(() => setIsExpanded(false), autoCollapseDelay);
      return () => clearTimeout(timer);
    }
  }, [autoCollapse, variant, autoCollapseDelay, isExpanded]);

  const variantStyles = {
    info: "bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800",
    success: "bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800",
    error: "bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800",
    warning: "bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800",
  };

  const textColors = {
    info: "text-blue-900 dark:text-blue-100",
    success: "text-green-900 dark:text-green-100",
    error: "text-red-900 dark:text-red-100",
    warning: "text-amber-900 dark:text-amber-100",
  };

  const summaryColors = {
    info: "text-blue-600 dark:text-blue-300",
    success: "text-green-600 dark:text-green-300",
    error: "text-red-600 dark:text-red-300",
    warning: "text-amber-600 dark:text-amber-300",
  };

  return (
    <CollapsiblePrimitive.Root
      open={isExpanded}
      onOpenChange={setIsExpanded}
      className={cn("border rounded-lg my-3", variantStyles[variant], className)}
    >
      <CollapsiblePrimitive.Trigger
        className="w-full p-4 sm:px-4 px-3 flex items-center gap-3 hover:bg-black/5 dark:hover:bg-white/5 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-blue-400 rounded-lg min-h-[44px] touch-manipulation"
        aria-label={`${isExpanded ? "Collapse" : "Expand"} ${title}`}
      >
        <div className="flex-shrink-0">{icon}</div>
        <div className="flex-1 text-left min-w-0">
          <div className={cn("font-medium", textColors[variant])}>{title}</div>
          {!isExpanded && summary && (
            <div className={cn("text-sm mt-1 line-clamp-2", summaryColors[variant])}>{summary}</div>
          )}
        </div>
        <ChevronDown
          className={cn(
            "h-4 w-4 transition-transform duration-200 flex-shrink-0",
            isExpanded ? "rotate-180" : "",
            summaryColors[variant],
          )}
          aria-hidden="true"
        />
      </CollapsiblePrimitive.Trigger>

      <CollapsiblePrimitive.Content className="overflow-hidden data-[state=open]:animate-collapsible-down data-[state=closed]:animate-collapsible-up">
        <div className="px-4 sm:px-4 px-3 pb-4">{children}</div>
      </CollapsiblePrimitive.Content>
    </CollapsiblePrimitive.Root>
  );
};

CollapsibleCard.displayName = "CollapsibleCard";

export { CollapsibleCard };
