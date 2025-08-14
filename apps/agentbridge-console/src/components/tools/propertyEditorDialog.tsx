import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Parameter } from "@agentbridge/api";
import React, { ChangeEvent } from "react";

interface PropertyEditorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editPropertyName: string;
  setEditPropertyName: (v: string) => void;
  editPropertyType: Parameter.type;
  setEditPropertyType: (v: Parameter.type) => void;
  editPropertyDescription: string;
  setEditPropertyDescription: (v: string) => void;
  editParameterType: Parameter.type;
  editParameterArrayType: Parameter.type;
  editPropertyRequired: boolean;
  setEditPropertyRequired: (v: boolean) => void;
  handleSaveProperty: () => void;
  setEditingProperty: React.Dispatch<
    React.SetStateAction<{
      name: string;
      type: Parameter.type;
      description: string;
      required?: boolean;
    } | null>
  >;
}

export const PropertyEditorDialog: React.FC<PropertyEditorDialogProps> = ({
  open,
  onOpenChange,
  editPropertyName,
  setEditPropertyName,
  editPropertyType,
  setEditPropertyType,
  editPropertyDescription,
  setEditPropertyDescription,
  editParameterType,
  editParameterArrayType,
  editPropertyRequired,
  setEditPropertyRequired,
  handleSaveProperty,
  setEditingProperty,
}) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="sm:max-w-[500px]">
      <DialogHeader>
        <DialogTitle>Edit Property</DialogTitle>
        <DialogDescription>Edit the property details.</DialogDescription>
      </DialogHeader>
      <div className="grid gap-4 py-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Property Name</Label>
            <Input
              value={editPropertyName}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setEditPropertyName(e.target.value)}
              placeholder="Enter property name"
            />
          </div>
          <div className="space-y-2">
            <Label>Property Type</Label>
            <Select value={editPropertyType} onValueChange={(value) => setEditPropertyType(value as Parameter.type)}>
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={Parameter.type.STRING}>String</SelectItem>
                <SelectItem value={Parameter.type.NUMBER}>Number</SelectItem>
                <SelectItem value={Parameter.type.BOOLEAN}>Boolean</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="space-y-2">
          <Label>Property Description</Label>
          <Input
            value={editPropertyDescription}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setEditPropertyDescription(e.target.value)}
            placeholder="Enter property description"
          />
        </div>
        {editParameterType === Parameter.type.ARRAY && editParameterArrayType === Parameter.type.OBJECT && (
          <div className="flex items-center space-x-2">
            <Checkbox
              id="property-required"
              checked={editPropertyRequired}
              onCheckedChange={(checked: boolean | string | undefined) => setEditPropertyRequired(checked === true)}
            />
            <Label htmlFor="property-required" className="text-sm font-normal">
              Property is required
            </Label>
          </div>
        )}
      </div>
      <DialogFooter>
        <Button
          variant="outline"
          onClick={() => {
            onOpenChange(false);
            setEditingProperty(null);
          }}
        >
          Cancel
        </Button>
        <Button onClick={handleSaveProperty}>Save Changes</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
);
