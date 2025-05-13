// src/app/dashboard/admin/manage-equipment/page.tsx
"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Wrench, PlusCircle, Edit, Trash2, Loader2 } from "lucide-react";
import type { Equipment, Lab } from "@/types";
import { MOCK_EQUIPMENT, MOCK_LABS } from "@/constants"; // Using mock data
import { useRoleGuard } from '@/hooks/use-role-guard';
import { USER_ROLES } from '@/types';
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge"; // Imported Badge

const EquipmentFormSchema = {
  name: (value: string) => value.trim().length > 0 ? null : "Name is required.",
  type: (value: string) => value.trim().length > 0 ? null : "Type is required.",
  status: (value: string) => ['available', 'in-use', 'maintenance'].includes(value) ? null : "Invalid status.",
};
type EquipmentFormErrors = Record<keyof typeof EquipmentFormSchema, string | null> & { labId?: string | null };


export default function ManageEquipmentPage() {
  const { isAuthorized, isLoading } = useRoleGuard(USER_ROLES.ADMIN);

  const [equipmentList, setEquipmentList] = React.useState<Equipment[]>(MOCK_EQUIPMENT);
  const [labs] = React.useState<Lab[]>(MOCK_LABS); // For lab selection dropdown
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [currentEquipment, setCurrentEquipment] = React.useState<Partial<Equipment> | null>(null);
  const [formValues, setFormValues] = React.useState<Partial<Equipment>>({});
  const [formErrors, setFormErrors] = React.useState<EquipmentFormErrors>({ name: null, type: null, status: null, labId: null });
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const { toast } = useToast();

  const validateForm = () => {
    const errors: EquipmentFormErrors = { name: null, type: null, status: null, labId: null };
    let isValid = true;
    
    const nameError = EquipmentFormSchema.name(formValues.name || "");
    if (nameError) { errors.name = nameError; isValid = false; }

    const typeError = EquipmentFormSchema.type(formValues.type || "");
    if (typeError) { errors.type = typeError; isValid = false; }

    const statusError = EquipmentFormSchema.status(formValues.status || "");
    if (statusError) { errors.status = statusError; isValid = false; }
    
    setFormErrors(errors);
    return isValid;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormValues(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: keyof Equipment, value: string) => {
    setFormValues(prev => ({ ...prev, [name]: value }));
  };

  const handleAddEquipment = () => {
    setCurrentEquipment(null);
    setFormValues({ name: "", type: "", status: "available", labId: "" });
    setFormErrors({ name: null, type: null, status: null, labId: null });
    setIsDialogOpen(true);
  };

  const handleEditEquipment = (equipment: Equipment) => {
    setCurrentEquipment(equipment);
    setFormValues({ ...equipment });
    setFormErrors({ name: null, type: null, status: null, labId: null });
    setIsDialogOpen(true);
  };

  const handleDeleteEquipment = (equipmentId: string) => {
    setIsSubmitting(true);
    setTimeout(() => {
      setEquipmentList(equipmentList.filter((eq) => eq.id !== equipmentId));
      toast({ title: "Equipment Deleted", description: "The equipment has been successfully deleted." });
      setIsSubmitting(false);
    }, 500);
  };

  const handleSubmitForm = () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    setTimeout(() => {
      if (currentEquipment?.id) { // Editing
        setEquipmentList(equipmentList.map(eq => eq.id === currentEquipment.id ? { ...eq, ...formValues } as Equipment : eq));
        toast({ title: "Equipment Updated", description: "The equipment details have been updated." });
      } else { // Adding
        const newEquipmentItem: Equipment = {
          id: `eq_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          name: formValues.name!,
          type: formValues.type!,
          status: formValues.status as Equipment['status'],
          labId: formValues.labId || undefined,
        };
        setEquipmentList([...equipmentList, newEquipmentItem]);
        toast({ title: "Equipment Added", description: "The new equipment has been added." });
      }
      setIsSubmitting(false);
      setIsDialogOpen(false);
    }, 1000);
  };

  const getLabName = (labId?: string) => {
    if (!labId) return "General Pool";
    return labs.find(lab => lab.id === labId)?.name || "Unknown Lab";
  };

  const getStatusBadgeVariant = (status: Equipment['status']): "accent" | "secondary" | "destructive" => {
    switch (status) {
      case 'available': return 'accent'; // Teal for available
      case 'in-use': return 'secondary'; // Gray for in-use
      case 'maintenance': return 'destructive'; // Red for maintenance
      default: return 'secondary'; // Default fallback
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-10 space-y-6">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!isAuthorized) {
    return null;
  }

  return (
    <div className="container mx-auto py-10 space-y-6">
      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Wrench className="h-8 w-8 text-primary" />
              <CardTitle className="text-2xl font-semibold">Manage Equipment</CardTitle>
            </div>
            <Button onClick={handleAddEquipment} className="whitespace-nowrap">
              <PlusCircle className="mr-2 h-5 w-5" /> Add New Equipment
            </Button>
          </div>
          <CardDescription>
            Oversee laboratory equipment, including inventory, status, and lab assignments for the Optimized Lab Management System.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {equipmentList.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">No equipment found. Click "Add New Equipment" to get started.</p>
          ): (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Assigned Lab</TableHead>
                <TableHead className="text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {equipmentList.map((eq) => (
                <TableRow key={eq.id}>
                  <TableCell className="font-medium">{eq.name}</TableCell>
                  <TableCell>{eq.type}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(eq.status)} className="capitalize">
                      {eq.status.charAt(0).toUpperCase() + eq.status.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell>{getLabName(eq.labId)}</TableCell>
                  <TableCell className="text-center space-x-2">
                    <Button variant="outline" size="sm" onClick={() => handleEditEquipment(eq)} className="hover:border-accent hover:text-accent">
                      <Edit className="mr-1 h-4 w-4" /> Edit
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => handleDeleteEquipment(eq.id)} disabled={isSubmitting}>
                      {isSubmitting ? <Loader2 className="mr-1 h-4 w-4 animate-spin"/> : <Trash2 className="mr-1 h-4 w-4" />}
                       Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{currentEquipment?.id ? "Edit Equipment" : "Add New Equipment"}</DialogTitle>
            <DialogDescription>
              {currentEquipment?.id ? "Update equipment details." : "Enter details for new equipment."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">Name</Label>
              <div className="col-span-3">
                <Input id="name" name="name" value={formValues.name || ""} onChange={handleInputChange} className={formErrors.name ? "border-destructive" : ""} />
                {formErrors.name && <p className="text-xs text-destructive mt-1">{formErrors.name}</p>}
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="type" className="text-right">Type</Label>
              <div className="col-span-3">
                <Input id="type" name="type" value={formValues.type || ""} onChange={handleInputChange} className={formErrors.type ? "border-destructive" : ""} />
                {formErrors.type && <p className="text-xs text-destructive mt-1">{formErrors.type}</p>}
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="status" className="text-right">Status</Label>
              <div className="col-span-3">
                <Select name="status" value={formValues.status || "available"} onValueChange={(value) => handleSelectChange('status', value)}>
                  <SelectTrigger className={formErrors.status ? "border-destructive" : ""}>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="available">Available</SelectItem>
                    <SelectItem value="in-use">In Use</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                  </SelectContent>
                </Select>
                {formErrors.status && <p className="text-xs text-destructive mt-1">{formErrors.status}</p>}
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="labId" className="text-right">Assigned Lab</Label>
              <div className="col-span-3">
                <Select name="labId" value={formValues.labId || ""} onValueChange={(value) => handleSelectChange('labId', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select lab (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">General Pool (No specific lab)</SelectItem>
                    {labs.map(lab => (
                      <SelectItem key={lab.id} value={lab.id}>{lab.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button onClick={handleSubmitForm} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {currentEquipment?.id ? "Save Changes" : "Add Equipment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
