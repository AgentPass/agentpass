import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { TableCell, TableRow } from "@/components/ui/table";
import { AlertCircle, X } from "lucide-react";
import { useState } from "react";

interface WarningRowProps {
  colSpan: number;
  providerId: string;
}

export function WarningRow({ colSpan, providerId }: WarningRowProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) {
    return null;
  }

  return (
    <TableRow className="bg-yellow-50 dark:bg-yellow-900/20 hover:bg-yellow-100 dark:hover:bg-yellow-900/30">
      <TableCell colSpan={colSpan} className="p-0">
        <Alert className="flex items-center justify-between py-2 px-4 rounded-none border-none bg-transparent">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-yellow-400" />
            <AlertDescription className="text-gray-700 dark:text-gray-200">
              This provider needs to be configured with a valid Client ID, Client Secret and Content-Type.
            </AlertDescription>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-muted-foreground hover:text-foreground"
            onClick={() => setDismissed(true)}
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Dismiss</span>
          </Button>
        </Alert>
      </TableCell>
    </TableRow>
  );
}
