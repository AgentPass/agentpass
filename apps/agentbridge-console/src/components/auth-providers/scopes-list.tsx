import { Button } from "@/components/ui/button.tsx";
import { ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";

function ScopePill({ scope }: { scope: string }) {
  return (
    <div
      className="inline-flex items-center rounded-full px-2 py-0.5 text-xs bg-muted text-muted-foreground truncate max-w-[180px]"
      title={scope}
    >
      {scope}
    </div>
  );
}

export function ScopesList({ scopes }: { scopes: string[] | undefined }) {
  const scopesList = scopes || [];
  const [isOpen, setIsOpen] = useState(false);

  if (scopesList.length === 0) {
    return <span className="text-sm text-muted-foreground">None</span>;
  }

  if (scopesList.length === 1) {
    return <ScopePill scope={scopesList[0]} />;
  }

  const displayedScopes = isOpen ? scopesList : [scopesList[0]];
  const remainingCount = scopesList.length - 1;

  return (
    <div className="flex flex-wrap gap-1 items-center">
      {displayedScopes.map((scope, index) => (
        <ScopePill key={index} scope={scope} />
      ))}
      {!isOpen && remainingCount > 0 && (
        <Button
          variant="ghost"
          size="sm"
          className="h-5 px-2 text-xs hover:bg-muted/50"
          onClick={() => setIsOpen(true)}
          title={`Show ${remainingCount} more scopes`}
        >
          +{remainingCount} more
          <ChevronRight className="ml-1 h-3 w-3" />
        </Button>
      )}
      {isOpen && (
        <Button
          variant="ghost"
          size="sm"
          className="h-5 px-2 text-xs hover:bg-muted/50"
          onClick={() => setIsOpen(false)}
          title="Show fewer scopes"
        >
          Show less
          <ChevronDown className="ml-1 h-3 w-3" />
        </Button>
      )}
    </div>
  );
}
