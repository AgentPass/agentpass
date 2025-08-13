/* eslint-disable no-console */

import { toast } from "@/hooks/use-toast";
import { isDevelopment } from "@/utils/env";

class Logger {
  private prefix = "[AgentBridge]";

  private formatMessage(message: string): string {
    return `${this.prefix} ${message}`;
  }

  private formatArgs(args: unknown[]): string {
    if (args.length === 0) return "";

    return args
      .map((arg) => {
        if (arg instanceof Error) {
          return arg.message;
        }
        if (typeof arg === "object") {
          try {
            return JSON.stringify(arg);
          } catch {
            return String(arg);
          }
        }
        return String(arg);
      })
      .join(" ");
  }

  info(message: string, ...args: unknown[]): void {
    if (isDevelopment) {
      console.info(this.formatMessage(message), ...args);
    }
  }

  success(message: string, ...args: unknown[]): void {
    if (isDevelopment) {
      console.info(this.formatMessage(message), ...args);
    }

    const formattedArgs = this.formatArgs(args);
    toast({
      title: "Success",
      description: formattedArgs ? `${message}\n${formattedArgs}` : message,
      variant: "success",
      duration: 3000,
    });
  }

  warn(message: string, ...args: unknown[]): void {
    if (isDevelopment) {
      console.warn(this.formatMessage(message), ...args);
    }

    const formattedArgs = this.formatArgs(args);
    toast({
      title: "Warning",
      description: formattedArgs ? `${message}\n${formattedArgs}` : message,
      variant: "warning",
      duration: 5000,
    });
  }

  error(message: string, ...args: unknown[]): void {
    console.error(this.formatMessage(message), ...args);

    const formattedArgs = this.formatArgs(args);
    toast({
      title: "Error",
      description: formattedArgs ? `${message}\n${formattedArgs}` : message,
      variant: "destructive",
      duration: 7000,
    });
  }

  debug(message: string, ...args: unknown[]): void {
    if (isDevelopment) {
      console.debug(this.formatMessage(message), ...args);
    }
  }
}

export const log = new Logger();
