import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X } from "lucide-react";
import { KeyboardEvent, useState } from "react";

interface ScopeChipsInputProps {
  scopes: string[];
  onChange: (scopes: string[]) => void;
  placeholder?: string;
}

export function ScopeChipsInput({ scopes, onChange, placeholder = "Add scope..." }: ScopeChipsInputProps) {
  const [inputValue, setInputValue] = useState("");

  const handleInputChange = (value: string) => {
    setInputValue(value);
  };

  const addScope = (scope: string) => {
    const trimmedScope = scope.trim();
    if (trimmedScope && !scopes.includes(trimmedScope)) {
      onChange([...scopes, trimmedScope]);
    }
    setInputValue("");
  };

  const removeScope = (scopeToRemove: string) => {
    onChange(scopes.filter((scope) => scope !== scopeToRemove));
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addScope(inputValue);
    }
  };

  const handleBlur = () => {
    if (inputValue.trim()) {
      addScope(inputValue);
    }
  };

  return (
    <div className="flex flex-col space-y-2">
      <div className="border rounded-md overflow-y-auto bg-background p-2 max-h-16 min-h-10">
        <div className="flex flex-wrap gap-2">
          {scopes.map((scope, index) => (
            <div key={index} className="flex items-center gap-1 px-2 py-1 text-xs rounded-md bg-muted" title={scope}>
              <span className="truncate max-w-[150px]">{scope}</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 hover:bg-transparent"
                onClick={() => removeScope(scope)}
                title={`Remove ${scope} scope`}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}
          <Input
            type="text"
            value={inputValue}
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
            className="flex-1 px-2 py-1 text-sm border-0 bg-transparent min-w-[120px] h-7 focus-visible:ring-0 focus-visible:ring-offset-0"
            placeholder={scopes.length === 0 ? placeholder : ""}
          />
        </div>
      </div>
      <div className="text-xs text-muted-foreground">Press Enter or comma to add a scope</div>
    </div>
  );
}
