import { cn } from "@/utils/cn";

type StatusVariant = "success" | "warning" | "error" | "default";

interface StatusBadgeProps {
  status: string;
  variant?: StatusVariant;
  className?: string;
}

export function StatusBadge({ status, variant = "default", className }: StatusBadgeProps) {
  const variantClasses = {
    success:
      "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-500 border-green-200 dark:border-green-800",
    warning:
      "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-500 border-yellow-200 dark:border-yellow-800",
    error: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-500 border-red-200 dark:border-red-800",
    default: "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-400 border-gray-200 dark:border-gray-700",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border",
        variantClasses[variant],
        className,
      )}
    >
      <span className="relative flex h-2 w-2 mr-1.5">
        <span
          className={cn(
            "animate-ping absolute inline-flex h-full w-full rounded-full opacity-75",
            variant === "success"
              ? "bg-green-400"
              : variant === "warning"
                ? "bg-yellow-400"
                : variant === "error"
                  ? "bg-red-400"
                  : "bg-gray-400",
          )}
        ></span>
        <span
          className={cn(
            "relative inline-flex rounded-full h-2 w-2",
            variant === "success"
              ? "bg-green-500"
              : variant === "warning"
                ? "bg-yellow-500"
                : variant === "error"
                  ? "bg-red-500"
                  : "bg-gray-500",
          )}
        ></span>
      </span>
      {status}
    </span>
  );
}
