import { Button } from "@/components/ui/button.tsx";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog.tsx";
import { AuthProviderItem } from "@/components/workflow/DraggableAuthProviderItem";
import { Key, Lock } from "lucide-react";

type Props = {
  providers: AuthProviderItem[];
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  onSelected: (providerId: string) => void;
};

export const AuthProviderSelectDialog = ({ isOpen, setIsOpen, providers, onSelected }: Props) => {
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[550px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Select Authentication Provider</DialogTitle>
          <DialogDescription>Choose an authentication provider for this tool.</DialogDescription>
        </DialogHeader>
        <div className="py-4">
          {providers.length === 0 ? (
            <div className="text-center p-4 text-muted-foreground">No authentication providers available.</div>
          ) : (
            <div className="space-y-4">
              {providers.map((provider) => (
                <div
                  key={provider.id}
                  className="border rounded-md p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                      {provider.type === "oauth" ? (
                        <Lock size={20} color="#6366f1" />
                      ) : (
                        <Key size={20} color="#6366f1" />
                      )}
                    </div>
                    <div>
                      <div className="font-medium">{provider.name}</div>
                      <div className="text-sm text-gray-500 capitalize">
                        {provider.type === "oauth" ? "OAuth 2.0" : "API Key"}
                      </div>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => {
                      onSelected(provider.id);
                      setIsOpen(false);
                    }}
                  >
                    Select
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
