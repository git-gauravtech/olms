
// src/app/dashboard/cr/class-bookings/page.tsx
"use client";

import * as React from "react"; 
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UsersRound, FlaskConical, MapPin, ListChecks, ClockIcon, AlertTriangle, CalendarClock } from "lucide-react";
import type { Booking, Lab, TimeSlot, Equipment } from "@/types";
import { MOCK_BOOKINGS, MOCK_LABS, MOCK_TIME_SLOTS, MOCK_EQUIPMENT } from "@/constants";
import { USER_ROLES } from "@/types";
import { format, parseISO } from "date-fns";
import { useRoleGuard } from '@/hooks/use-role-guard';
import { Skeleton } from "@/components/ui/skeleton";

// Assume CR user ID to potentially filter or highlight bookings made by this CR
const CURRENT_CR_USER_ID = "cr_user"; // Replace with actual CR user ID

export default function CRClassBookingsPage() {
  const { isAuthorized, isLoading } = useRoleGuard(USER_ROLES.CR);
  const [classBookings, setClassBookings] = React.useState<Booking[]>([]);

  React.useEffect(() => {
    if (isAuthorized) {
    // Filter bookings that are specifically for classes (e.g., have a batchIdentifier or requestedByRole is CR)
    const filtered = MOCK_BOOKINGS.filter(
      b => b.requestedByRole === USER_ROLES.CR && b.batchIdentifier
    ).sort((a, b) => {
        try {
            return new Date(b.date).getTime() - new Date(a.date).getTime();
        } catch (e) {
            return 0; // Or handle error appropriately
        }
    });
    setClassBookings(filtered);
    }
  }, [isAuthorized]);

  const getLabDetails = (labId: string): Lab | undefined => MOCK_LABS.find(l => l.id === labId);
  const getTimeSlotDetails = (timeSlotId: string): TimeSlot | undefined => MOCK_TIME_SLOTS.find(ts => ts.id === timeSlotId);
  const getEquipmentDetails = (equipmentIds: string[]): Equipment[] =>
    equipmentIds.map(id => MOCK_EQUIPMENT.find(eq => eq.id === id)).filter(Boolean) as Equipment[];

  const getStatusBadgeVariant = (status: Booking['status']) => {
    switch (status) {
      case 'booked': return 'default';
      case 'pending': return 'secondary';
      case 'cancelled': return 'destructive';
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
      const bookingDateTime = parseISO(bookingDateTimeString); // Use parseISO for reliability
      return bookingDateTime < new Date();
    } catch (error) {
      console.error("Error parsing booking date/time for past check:", bookingDate, endTime, error);
      return false; // Default to not past if date is invalid
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
            <UsersRound className="h-8 w-8 text-primary" />
            <CardTitle className="text-2xl font-semibold">Class Lab Bookings</CardTitle>
          </div>
          <CardDescription>
            View and manage lab bookings scheduled for classes.
          </CardDescription>
        </CardHeader>
      </Card>

      {classBookings.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">No class bookings found. Use "Request Class Slot" to schedule labs for your class.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
          {classBookings.map((booking) => {
            const lab = getLabDetails(booking.labId);
            const timeSlot = getTimeSlotDetails(booking.timeSlotId);
            const equipment = getEquipmentDetails(booking.equipmentIds);
            const isPastBooking = timeSlot ? isBookingPast(booking.date, timeSlot.endTime) && booking.status !== 'cancelled' : false;


            return (
              <Card key={booking.id} className={`shadow-md hover:shadow-lg transition-shadow ${isPastBooking ? 'opacity-70' : ''}`}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg mb-1">{booking.batchIdentifier || "Class Booking"}</CardTitle>
                      <CardDescription className="text-xs">
                        Lab: {lab?.name || "N/A"} (Room: {lab?.roomNumber || "N/A"})
                      </CardDescription>
                    </div>
                    <Badge variant={getStatusBadgeVariant(booking.status)} className="whitespace-nowrap">
                     {isPastBooking && booking.status === 'booked' ? 'Completed' : booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
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
                   {booking.userId === CURRENT_CR_USER_ID && booking.status === 'pending' && !isPastBooking && (
                     <p className="text-xs text-accent flex items-center"><AlertTriangle className="h-3 w-3 mr-1"/>Your request is pending approval.</p>
                   )}
                </CardContent>
                 {/* CRs usually don't cancel approved class bookings directly from this view; typically admin handles modifications. */}
                {/* Add actions if CRs are allowed to modify/cancel pending requests */}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

