import { toast } from "@/hooks/use-toast.ts";
import { log } from "@/utils/log";

export function useClipboard() {
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Success",
        description: "Copied to clipboard",
        variant: "success",
        duration: 3000,
      });
      return true;
    } catch (error) {
      log.error("Failed to copy text:", error);
      return false;
    }
  };

  return { copyToClipboard };
}
