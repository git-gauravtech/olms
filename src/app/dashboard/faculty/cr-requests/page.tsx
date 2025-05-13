// src/app/dashboard/faculty/cr-requests/page.tsx
"use client";

import * as React from "react";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileCheck, CheckCircle, XCircle, Loader2 } from "lucide-react";
import type { Booking, Lab, TimeSlot, Equipment } from "@/types";
import { MOCK_BOOKINGS, MOCK_LABS, MOCK_TIME_SLOTS, MOCK_EQUIPMENT } from "@/constants";
import { format, parseISO } from "date-fns";
import { useRoleGuard } from '@/hooks/use-role-guard';
import { USER_ROLES } from '@/types';
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

export default function CrRequestsPage() {
  const { isAuthorized, isLoading: isRoleLoading } = useRoleGuard(USER_ROLES.FACULTY);
  const { toast } = useToast();

  const [crBookings, setCrBookings] = React.useState<Booking[]>([]);
  const [isProcessing, setIsProcessing] = React.useState<Record<string, boolean>>({}); // To track loading state for each button

  React.useEffect(() => {
    if (isAuthorized) {
      const pendingCrRequests = MOCK_BOOKINGS.filter(
        b => b.requestedByRole === USER_ROLES.CR && b.status === 'pending'
      ).sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      setCrBookings(pendingCrRequests);
    }
  }, [isAuthorized]);

  const getLabName = (labId: string) => MOCK_LABS.find(l => l.id === labId)?.name || "Unknown Lab";
  const getTimeSlotDisplay = (timeSlotId: string) => MOCK_TIME_SLOTS.find(ts => ts.id === timeSlotId)?.displayTime || "Unknown Time";
  const getEquipmentNames = (equipmentIds: string[]) => {
    if (!equipmentIds || equipmentIds.length === 0) return "None";
    return equipmentIds.map(id => MOCK_EQUIPMENT.find(eq => eq.id === id)?.name || "Unknown Eq.").join(", ");
  };
  
  const formatDateSafe = (dateString: string | Date, dateFormat: string = "PP") => {
    try {
      const date = typeof dateString === 'string' ? parseISO(dateString) : dateString;
      return format(date, dateFormat);
    } catch (error) {
      console.error("Invalid date format:", dateString, error);
      return "Invalid Date";
    }
  };

  const handleRequestAction = (bookingId: string, action: 'booked' | 'rejected') => {
    setIsProcessing(prev => ({...prev, [bookingId]: true}));
    
    // Simulate API call
    setTimeout(() => {
      // Update in-memory MOCK_BOOKINGS for demo persistence
      const bookingIndex = MOCK_BOOKINGS.findIndex(b => b.id === bookingId);
      if (bookingIndex !== -1) {
        MOCK_BOOKINGS[bookingIndex].status = action;
      }

      // Update local state to re-render
      setCrBookings(prevBookings => prevBookings.filter(b => b.id !== bookingId));
      
      toast({
        title: `Request ${action === 'booked' ? 'Approved' : 'Rejected'}`,
        description: `CR Booking ID ${bookingId} has been ${action === 'booked' ? 'approved and booked' : 'rejected'}.`,
      });
      setIsProcessing(prev => ({...prev, [bookingId]: false}));
    }, 1000);
  };


  if (isRoleLoading) {
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
    <div className="container mx-auto py-10">
      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex items-center space-x-3">
            <FileCheck className="h-8 w-8 text-primary" />
            <CardTitle className="text-2xl font-semibold">CR Booking Requests</CardTitle>
          </div>
          <CardDescription>
            Review and approve or reject lab booking requests submitted by Class Representatives.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {crBookings.length === 0 ? (
             <p className="text-center text-muted-foreground py-4">No pending CR booking requests.</p>
          ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Batch/Class</TableHead>
                <TableHead>Lab</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Time Slot</TableHead>
                <TableHead>Purpose</TableHead>
                <TableHead>Equipment</TableHead>
                <TableHead className="text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {crBookings.map((booking) => (
                <TableRow key={booking.id}>
                  <TableCell className="font-medium">{booking.batchIdentifier || 'N/A'}</TableCell>
                  <TableCell>{getLabName(booking.labId)}</TableCell>
                  <TableCell>{formatDateSafe(booking.date)}</TableCell>
                  <TableCell>{getTimeSlotDisplay(booking.timeSlotId)}</TableCell>
                  <TableCell className="max-w-xs truncate hover:whitespace-normal hover:overflow-visible" title={booking.purpose}>
                    {booking.purpose}
                  </TableCell>
                  <TableCell className="max-w-xs truncate hover:whitespace-normal hover:overflow-visible" title={getEquipmentNames(booking.equipmentIds)}>
                    {getEquipmentNames(booking.equipmentIds)}
                  </TableCell>
                  <TableCell className="text-center space-x-2">
                    <Button 
                      variant="default" 
                      size="sm" 
                      onClick={() => handleRequestAction(booking.id, 'booked')}
                      disabled={isProcessing[booking.id]}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {isProcessing[booking.id] ? <Loader2 className="mr-1 h-4 w-4 animate-spin"/> : <CheckCircle className="mr-1 h-4 w-4" />}
                       Approve
                    </Button>
                    <Button 
                      variant="destructive" 
                      size="sm" 
                      onClick={() => handleRequestAction(booking.id, 'rejected')}
                      disabled={isProcessing[booking.id]}
                    >
                      {isProcessing[booking.id] ? <Loader2 className="mr-1 h-4 w-4 animate-spin"/> : <XCircle className="mr-1 h-4 w-4" />}
                       Reject
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
