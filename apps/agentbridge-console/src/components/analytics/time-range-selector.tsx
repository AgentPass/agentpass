import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, RefreshCw } from "lucide-react";

interface DaysRangeSelectorProps {
  daysRange: number;
  setDaysRange: (value: number) => void;
  refreshing: boolean;
  handleRefresh: () => Promise<void>;
  disabled?: boolean;
}

const ranges = [7, 14, 30, 90];

export function DaysRangeSelector({
  daysRange,
  setDaysRange,
  refreshing,
  handleRefresh,
  disabled = false,
}: DaysRangeSelectorProps) {
  const handleValueChange = (value: string): void => {
    setDaysRange(parseInt(value, 10));
  };

  return (
    <div className="flex items-center space-x-2">
      <Select value={daysRange.toString()} onValueChange={handleValueChange}>
        <SelectTrigger className="w-[180px]">
          <Calendar className="mr-2 h-4 w-4" />
          <SelectValue placeholder="Select range" />
        </SelectTrigger>
        <SelectContent>
          {ranges.map((range) => (
            <SelectItem key={range} value={range.toString()}>
              Last {range} days
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button variant="outline" size="icon" onClick={handleRefresh} disabled={refreshing || disabled}>
        <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
      </Button>
    </div>
  );
}
