import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart as RechartsLineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface LineChartProps {
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
}

export function LineChart({ title, description, data, xAxisKey, series, height = 350 }: LineChartProps) {
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
            <RechartsLineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
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
                cursor={{ stroke: "hsl(var(--muted))" }}
              />
              <Legend wrapperStyle={{ color: "hsl(var(--foreground))" }} />
              {series.map((s, index) => (
                <Line
                  key={index}
                  type="monotone"
                  dataKey={s.key}
                  name={s.name}
                  stroke={s.color}
                  strokeWidth={2}
                  dot={{ r: 3, fill: s.color }}
                  activeDot={{ r: 5, fill: s.color }}
                />
              ))}
            </RechartsLineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
