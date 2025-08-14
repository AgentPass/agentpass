import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { log } from "@/utils/log";
import { AlertTriangle } from "lucide-react";
import React from "react";

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    log.error("Uncaught error:", error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <Card className="w-full max-w-md p-6 text-center">
            <div className="flex justify-center mb-4">
              <AlertTriangle className="h-12 w-12 text-destructive" />
            </div>
            <h1 className="text-xl font-semibold mb-2">Something went wrong</h1>
            <p className="text-sm text-muted-foreground mb-6">
              An unexpected error has occurred. Please try reloading the page.
            </p>
            <div className="space-y-2">
              <Button onClick={this.handleReload} className="w-full" title="Reload the page">
                Reload Page
              </Button>
              <Button
                variant="outline"
                onClick={() => (window.location.href = "/")}
                className="w-full"
                title="Return to the dashboard"
              >
                Return to Dashboard
              </Button>
            </div>
            {this.state.error && (
              <pre className="mt-6 p-4 bg-muted rounded-lg text-left text-xs overflow-auto max-h-[200px]">
                {this.state.error.toString()}
              </pre>
            )}
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
