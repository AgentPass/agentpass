import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/utils/cn";
import React from "react";

interface StatsCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    positive?: boolean;
  };
  className?: string;
  variant?: "default" | "success" | "error";
}

export function StatsCard({ title, value, description, icon, trend, className, variant = "default" }: StatsCardProps) {
  return (
    <Card className={cn(className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon && <div className="h-4 w-4 text-muted-foreground">{icon}</div>}
      </CardHeader>
      <CardContent>
        <div
          className={cn("text-2xl font-bold", {
            "text-primary": variant === "default",
            "text-green-500": variant === "success",
            "text-yellow-500": variant === "error",
          })}
        >
          {value}
        </div>
        {(description || trend) && (
          <div className="flex items-center">
            {trend && (
              <span className={cn("text-xs font-medium mr-2", trend.positive ? "text-green-500" : "text-red-500")}>
                {trend.positive ? "↑" : "↓"} {Math.abs(trend.value)}%
              </span>
            )}
            {description && <p className="text-xs text-muted-foreground">{description}</p>}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
