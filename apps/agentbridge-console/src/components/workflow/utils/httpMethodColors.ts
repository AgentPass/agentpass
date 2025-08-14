export const getHttpMethodColor = (method: string): string => {
  const methodColors: Record<string, string> = {
    GET: "#10b981", // green
    POST: "#3b82f6", // blue
    PUT: "#f59e0b", // yellow
    PATCH: "#f97316", // orange
    DELETE: "#ef4444", // red
  };

  return methodColors[method.toUpperCase()] || "#6b7280"; // default gray
};

export const getHttpMethodColorWithOpacity = (method: string, opacity = 1): string => {
  const baseColor = getHttpMethodColor(method);

  // Convert hex to RGB and add opacity
  const r = parseInt(baseColor.slice(1, 3), 16);
  const g = parseInt(baseColor.slice(3, 5), 16);
  const b = parseInt(baseColor.slice(5, 7), 16);

  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};
