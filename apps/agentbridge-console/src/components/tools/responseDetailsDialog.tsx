import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Response } from "@agentbridge/api";
import React from "react";
import { ResponseDetailsViewer } from "./responseDetailsViewer";

interface ResponseDetailsDialogProps {
  open: boolean;
  onClose: () => void;
  details: Response;
}

export const ResponseDetailsDialog: React.FC<ResponseDetailsDialogProps> = ({ open, onClose, details }) => (
  <Dialog open={open} onOpenChange={onClose}>
    <DialogContent className="max-w-2xl w-full">
      <DialogHeader>
        <DialogTitle>Response JSON Preview</DialogTitle>
      </DialogHeader>
      <ResponseDetailsViewer details={details} />
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>
          Close
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
);
