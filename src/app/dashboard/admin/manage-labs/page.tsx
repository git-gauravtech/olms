// src/app/dashboard/admin/manage-labs/page.tsx
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
import { useToast } from "@/hooks/use-toast";
import { Settings, PlusCircle, Edit, Trash2, Loader2 } from "lucide-react";
import type { Lab } from "@/types";
import { MOCK_LABS } from "@/constants"; // Using mock labs for now
import { useRoleGuard } from '@/hooks/use-role-guard';
import { USER_ROLES } from '@/types';
import { Skeleton } from "@/components/ui/skeleton";


const LabFormSchema = {
  name: (value: string) => value.trim().length > 0 ? null : "Name is required.",
  capacity: (value: string) => /^\d+$/.test(value) && parseInt(value) > 0 ? null : "Capacity must be a positive number.",
  roomNumber: (value: string) => value.trim().length > 0 ? null : "Room number is required.",
};

type LabFormErrors = Record<keyof typeof LabFormSchema, string | null>;

export default function ManageLabsPage() {
  const { isAuthorized, isLoading } = useRoleGuard(USER_ROLES.ADMIN);

  const [labs, setLabs] = React.useState<Lab[]>(MOCK_LABS);
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [currentLab, setCurrentLab] = React.useState<Partial<Lab> | null>(null);
  const [formValues, setFormValues] = React.useState<Partial<Lab>>({});
  const [formErrors, setFormErrors] = React.useState<LabFormErrors>({ name: null, capacity: null, roomNumber: null });
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const { toast } = useToast();

  const validateForm = () => {
    const errors: LabFormErrors = { name: null, capacity: null, roomNumber: null };
    let isValid = true;
    
    const nameError = LabFormSchema.name(formValues.name || "");
    if (nameError) {
      errors.name = nameError;
      isValid = false;
    }
    const capacityError = LabFormSchema.capacity(String(formValues.capacity || ""));
     if (capacityError) {
      errors.capacity = capacityError;
      isValid = false;
    }
    const roomNumberError = LabFormSchema.roomNumber(formValues.roomNumber || "");
    if (roomNumberError) {
      errors.roomNumber = roomNumberError;
      isValid = false;
    }
    
    setFormErrors(errors);
    return isValid;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormValues(prev => ({ ...prev, [name]: name === 'capacity' ? parseInt(value) || '' : value }));
  };

  const handleAddLab = () => {
    setCurrentLab(null);
    setFormValues({ name: "", capacity: 0, roomNumber: "" });
    setFormErrors({ name: null, capacity: null, roomNumber: null });
    setIsDialogOpen(true);
  };

  const handleEditLab = (lab: Lab) => {
    setCurrentLab(lab);
    setFormValues({ ...lab });
    setFormErrors({ name: null, capacity: null, roomNumber: null });
    setIsDialogOpen(true);
  };

  const handleDeleteLab = (labId: string) => {
    // Simulate API call
    setIsSubmitting(true);
    setTimeout(() => {
      setLabs(labs.filter((lab) => lab.id !== labId));
      toast({ title: "Lab Deleted", description: "The lab has been successfully deleted." });
      setIsSubmitting(false);
    }, 500);
  };

  const handleSubmitForm = () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    // Simulate API call
    setTimeout(() => {
      if (currentLab?.id) { // Editing existing lab
        setLabs(labs.map(lab => lab.id === currentLab.id ? { ...lab, ...formValues } as Lab : lab));
        toast({ title: "Lab Updated", description: "The lab details have been successfully updated." });
      } else { // Adding new lab
        const newLab: Lab = {
          id: `lab_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`, // More unique ID
          name: formValues.name!,
          capacity: Number(formValues.capacity!),
          roomNumber: formValues.roomNumber!,
        };
        setLabs([...labs, newLab]);
        toast({ title: "Lab Added", description: "The new lab has been successfully added." });
      }
      setIsSubmitting(false);
      setIsDialogOpen(false);
    }, 1000);
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
              <Settings className="h-8 w-8 text-primary" />
              <CardTitle className="text-2xl font-semibold">Manage Labs</CardTitle>
            </div>
            <Button onClick={handleAddLab} className="whitespace-nowrap">
              <PlusCircle className="mr-2 h-5 w-5" /> Add New Lab
            </Button>
          </div>
          <CardDescription>
            Oversee and manage all laboratory resources for the Optimized Lab Management System.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {labs.length === 0 ? (
             <p className="text-center text-muted-foreground py-4">No labs found. Click "Add New Lab" to get started.</p>
          ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Room Number</TableHead>
                <TableHead className="text-right">Capacity</TableHead>
                <TableHead className="text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {labs.map((lab) => (
                <TableRow key={lab.id}>
                  <TableCell className="font-medium">{lab.name}</TableCell>
                  <TableCell>{lab.roomNumber}</TableCell>
                  <TableCell className="text-right">{lab.capacity}</TableCell>
                  <TableCell className="text-center space-x-2">
                    <Button variant="outline" size="sm" onClick={() => handleEditLab(lab)} className="hover:border-accent hover:text-accent">
                      <Edit className="mr-1 h-4 w-4" /> Edit
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => handleDeleteLab(lab.id)} disabled={isSubmitting}>
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
            <DialogTitle>{currentLab?.id ? "Edit Lab" : "Add New Lab"}</DialogTitle>
            <DialogDescription>
              {currentLab?.id ? "Update the details of the lab." : "Enter the details for the new lab."}
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
              <Label htmlFor="roomNumber" className="text-right">Room No.</Label>
              <div className="col-span-3">
                <Input id="roomNumber" name="roomNumber" value={formValues.roomNumber || ""} onChange={handleInputChange} className={formErrors.roomNumber ? "border-destructive" : ""} />
                {formErrors.roomNumber && <p className="text-xs text-destructive mt-1">{formErrors.roomNumber}</p>}
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="capacity" className="text-right">Capacity</Label>
              <div className="col-span-3">
                <Input id="capacity" name="capacity" type="number" value={formValues.capacity || ""} onChange={handleInputChange} className={formErrors.capacity ? "border-destructive" : ""} />
                {formErrors.capacity && <p className="text-xs text-destructive mt-1">{formErrors.capacity}</p>}
              </div>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button onClick={handleSubmitForm} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {currentLab?.id ? "Save Changes" : "Add Lab"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
