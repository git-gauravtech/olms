// src/app/dashboard/student/my-bookings/page.tsx
"use client";

import * as React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CalendarClock, FlaskConical, MapPin, ListChecks, ClockIcon } from "lucide-react";
import type { Booking, Lab, TimeSlot, Equipment } from "@/types";
import { MOCK_BOOKINGS, MOCK_LABS, MOCK_TIME_SLOTS, MOCK_EQUIPMENT } from "@/constants";
import { USER_ROLES } from "@/types"; 
import { format, parseISO } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useRoleGuard } from '@/hooks/use-role-guard';
import { Skeleton } from "@/components/ui/skeleton";


// Assume current user ID for filtering bookings
const CURRENT_USER_ID = "student1"; // Replace with actual user ID from auth context in a real app

export default function StudentMyBookingsPage() {
  // Students and CRs can view their personal bookings here.
  const { isAuthorized, isLoading } = useRoleGuard([USER_ROLES.STUDENT, USER_ROLES.CR]);
  const [myBookings, setMyBookings] = React.useState<Booking[]>([]);
  const { toast } = useToast();

  React.useEffect(() => {
    if (isAuthorized) {
      // Filter bookings for the current student/CR (personal bookings)
      // For CRs, this page shows their *individual* bookings, not class bookings.
      const filtered = MOCK_BOOKINGS.filter(b => b.userId === CURRENT_USER_ID && 
                                                 (b.requestedByRole === USER_ROLES.STUDENT || (b.requestedByRole === USER_ROLES.CR && !b.batchIdentifier))
                                            )
        .sort((a, b) => {
            try {
                return new Date(b.date).getTime() - new Date(a.date).getTime(); // Sort by date, newest first
            } catch(e) {
                return 0; // Or handle error appropriately
            }
        });
      setMyBookings(filtered);
    }
  }, [isAuthorized]);

  const getLabDetails = (labId: string): Lab | undefined => MOCK_LABS.find(l => l.id === labId);
  const getTimeSlotDetails = (timeSlotId: string): TimeSlot | undefined => MOCK_TIME_SLOTS.find(ts => ts.id === timeSlotId);
  const getEquipmentDetails = (equipmentIds?: string[]): Equipment[] => 
    (equipmentIds || []).map(id => MOCK_EQUIPMENT.find(eq => eq.id === id)).filter(Boolean) as Equipment[];

  const handleCancelBooking = (bookingId: string) => {
    // Simulate API call
    const bookingToCancel = MOCK_BOOKINGS.find(b => b.id === bookingId);
    const timeSlot = bookingToCancel ? getTimeSlotDetails(bookingToCancel.timeSlotId) : null;

    if (bookingToCancel && timeSlot) {
      try {
        // Check if booking is in the future
        const bookingDateTime = parseISO(`${bookingToCancel.date}T${timeSlot.startTime}`);
        if (bookingDateTime < new Date()) {
          toast({
            variant: "destructive",
            title: "Cannot Cancel",
            description: "Past bookings cannot be cancelled.",
          });
          return;
        }
      } catch (error) {
        console.error("Error parsing booking date for cancellation check:", error);
        toast({ variant: "destructive", title: "Error", description: "Could not verify booking time." });
        return;
      }
      
      const bookingIndex = MOCK_BOOKINGS.findIndex(b => b.id === bookingId);
      if (bookingIndex !== -1) {
          MOCK_BOOKINGS[bookingIndex].status = 'cancelled';
      }
      setMyBookings(prev => prev.map(b => b.id === bookingId ? {...b, status: 'cancelled'} : b));
      toast({
        title: "Booking Cancelled",
        description: `Your booking for ${getLabDetails(bookingToCancel.labId)?.name} has been cancelled.`,
      });
    } else {
        toast({ variant: "destructive", title: "Error", description: "Booking or time slot details not found."});
    }
  };
  
  const getStatusBadgeVariant = (status: Booking['status']): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case 'booked': return 'default';
      case 'pending': return 'secondary';
      case 'cancelled': return 'destructive';
      case 'rejected': return 'destructive';
      default: return 'outline';
    }
  };

  const formatDateSafe = (dateString: string, dateFormat: string = "EEEE, MMM d, yyyy") => {
    try {
      return format(new Date(`${dateString}T00:00:00`), dateFormat);
    } catch (error) {
      console.error("Invalid date format for booking:", dateString, error);
      return "Invalid Date";
    }
  };

  const isBookingPast = (bookingDate: string, endTime?: string) => {
    if (!endTime) return false;
    try {
      const bookingDateTimeString = `${bookingDate}T${endTime}`;
      const bookingDateTime = parseISO(bookingDateTimeString);
      return bookingDateTime < new Date();
    } catch (error) {
      console.error("Error parsing booking date/time for past check:", bookingDate, endTime, error);
      return false; 
    }
  };


  if (isLoading) {
    return (
      <div className="container mx-auto py-10 space-y-8">
        <Skeleton className="h-24 w-full mb-6" />
        <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return null;
  }

  return (
    <div className="container mx-auto py-10 space-y-8">
      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex items-center space-x-3">
            <CalendarClock className="h-8 w-8 text-primary" />
            <CardTitle className="text-2xl font-semibold">My Lab Schedule</CardTitle>
          </div>
          <CardDescription>
            View your upcoming and past lab sessions in the Optimized Lab Management System.
          </CardDescription>
        </CardHeader>
      </Card>

      {myBookings.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">You have no scheduled lab sessions. Visit "Book a Slot" if applicable, or check with your CR/Faculty for class schedules.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
          {myBookings.map((booking) => {
            const lab = getLabDetails(booking.labId);
            const timeSlot = getTimeSlotDetails(booking.timeSlotId);
            const equipment = getEquipmentDetails(booking.equipmentIds);
            const isPastBooking = timeSlot ? isBookingPast(booking.date, timeSlot.endTime) && booking.status !== 'cancelled' : false;

            return (
              <Card key={booking.id} className={`shadow-md hover:shadow-lg transition-shadow duration-300 ${isPastBooking ? 'opacity-70' : ''}`}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-xl mb-1">{lab?.name || "Unknown Lab"}</CardTitle>
                      <CardDescription className="flex items-center text-sm">
                        <MapPin className="h-4 w-4 mr-1 text-muted-foreground" /> Room: {lab?.roomNumber || "N/A"}
                      </CardDescription>
                    </div>
                    <Badge variant={getStatusBadgeVariant(booking.status)} className="whitespace-nowrap capitalize">
                      {isPastBooking && booking.status === 'booked' ? 'Completed' : booking.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="flex items-center">
                    <ClockIcon className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span>{formatDateSafe(booking.date)}</span>
                  </div>
                  <div className="flex items-center">
                    <CalendarClock className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span>{timeSlot?.displayTime || "Unknown Time"}</span>
                  </div>
                  <div className="flex items-start">
                    <FlaskConical className="h-4 w-4 mr-2 mt-0.5 text-muted-foreground" />
                    <p><span className="font-medium">Purpose:</span> {booking.purpose}</p>
                  </div>
                  {equipment.length > 0 && (
                    <div className="flex items-start">
                      <ListChecks className="h-4 w-4 mr-2 mt-0.5 text-muted-foreground" />
                      <div>
                        <span className="font-medium">Equipment:</span>
                        <ul className="list-disc list-inside pl-1">
                          {equipment.map(eq => <li key={eq.id} className="text-xs">{eq.name}</li>)}
                        </ul>
                      </div>
                    </div>
                  )}
                </CardContent>
                <CardFooter className="flex justify-end">
                  {(booking.status === 'booked' || booking.status === 'pending') && !isPastBooking && (
                     <Button variant="outline" size="sm" onClick={() => handleCancelBooking(booking.id)}>
                       Cancel Booking
                     </Button>
                  )}
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
