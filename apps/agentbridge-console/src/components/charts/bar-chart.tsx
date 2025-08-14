import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Bar,
  CartesianGrid,
  Legend,
  BarChart as RechartsBarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface BarChartProps {
  title: string;
  description?: string;
  data: unknown[];
  xAxisKey: string;
  series: {
    name: string;
    key: string;
    color: string;
  }[];
  height?: number;
  stacked?: boolean;
}

export function BarChart({ title, description, data, xAxisKey, series, height = 350, stacked = false }: BarChartProps) {
  const hasData = data && data.length > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        {!hasData ? (
          <div className="flex items-center justify-center h-[350px] text-muted-foreground">No data available</div>
        ) : (
          <ResponsiveContainer width="100%" height={height}>
            <RechartsBarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis
                dataKey={xAxisKey}
                stroke="var(--muted-foreground)"
                tick={{ fill: "hsl(var(--foreground))", fontSize: 12 }}
                tickLine={{ stroke: "var(--border)" }}
              />
              <YAxis
                stroke="var(--muted-foreground)"
                tick={{ fill: "hsl(var(--foreground))", fontSize: 12 }}
                tickLine={{ stroke: "var(--border)" }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--accent))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "var(--radius)",
                  boxShadow: "var(--shadow)",
                  color: "hsl(var(--accent-foreground))",
                }}
                itemStyle={{ color: "hsl(var(--accent-foreground))" }}
                labelStyle={{ color: "hsl(var(--accent-foreground))", fontWeight: "500", marginBottom: "8px" }}
                cursor={{ fill: "hsl(var(--muted))", opacity: 0.2 }}
              />
              <Legend wrapperStyle={{ color: "hsl(var(--foreground))" }} />
              {series.map((s, index) => (
                <Bar key={index} dataKey={s.key} name={s.name} fill={s.color} stackId={stacked ? "stack" : undefined} />
              ))}
            </RechartsBarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
