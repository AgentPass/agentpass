import { ScopesList } from "@/components/auth-providers/scopes-list.tsx";
import { Button } from "@/components/ui/button.tsx";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog.tsx";
import { OAuthProvider } from "@agentbridge/api";

type Props = {
  providers: OAuthProvider[];
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  onSelected: (providerId: string) => void;
};

export const ToolAuthSelectDialog = ({ isOpen, setIsOpen, providers, onSelected }: Props) => {
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" onClick={() => setIsOpen(true)}>
          Add Authentication
        </Button>
      </DialogTrigger>
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
                <div key={provider.id} className="border rounded-md p-4 flex flex-col">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-medium">{provider.name}</div>
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
                  <ScopesList scopes={provider.scopes} />
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
