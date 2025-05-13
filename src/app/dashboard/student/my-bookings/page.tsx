
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
import { CalendarClock, FlaskConical, MapPin, ListChecks, User, AlertTriangle, ClockIcon } from "lucide-react";
import type { Booking, Lab, TimeSlot, Equipment } from "@/types";
import { MOCK_BOOKINGS, MOCK_LABS, MOCK_TIME_SLOTS, MOCK_EQUIPMENT } from "@/constants";
import { USER_ROLES } from "@/types"; // Added USER_ROLES
import { format } from "date-fns";
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
                                                 (b.requestedByRole === USER_ROLES.STUDENT || b.requestedByRole === USER_ROLES.CR && !b.batchIdentifier)
                                            )
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()); // Sort by date, newest first
      setMyBookings(filtered);
    }
  }, [isAuthorized]);

  const getLabDetails = (labId: string): Lab | undefined => MOCK_LABS.find(l => l.id === labId);
  const getTimeSlotDetails = (timeSlotId: string): TimeSlot | undefined => MOCK_TIME_SLOTS.find(ts => ts.id === timeSlotId);
  const getEquipmentDetails = (equipmentIds: string[]): Equipment[] => 
    equipmentIds.map(id => MOCK_EQUIPMENT.find(eq => eq.id === id)).filter(Boolean) as Equipment[];

  const handleCancelBooking = (bookingId: string) => {
    // Simulate API call
    const bookingToCancel = MOCK_BOOKINGS.find(b => b.id === bookingId);
    if (bookingToCancel) {
      // Check if booking is in the future
      const bookingDateTime = new Date(`${bookingToCancel.date}T${getTimeSlotDetails(bookingToCancel.timeSlotId)?.startTime || '00:00'}`);
      if (bookingDateTime < new Date()) {
        toast({
          variant: "destructive",
          title: "Cannot Cancel",
          description: "Past bookings cannot be cancelled.",
        });
        return;
      }
      
      bookingToCancel.status = 'cancelled'; // Update status in mock data
      setMyBookings(prev => prev.map(b => b.id === bookingId ? {...b, status: 'cancelled'} : b));
      toast({
        title: "Booking Cancelled",
        description: `Your booking for ${getLabDetails(bookingToCancel.labId)?.name} has been cancelled.`,
      });
    }
  };
  
  const getStatusBadgeVariant = (status: Booking['status']) => {
    switch (status) {
      case 'booked': return 'default';
      case 'pending': return 'secondary';
      case 'cancelled': return 'destructive';
      default: return 'outline';
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
            <CardTitle className="text-2xl font-semibold">My Lab Bookings</CardTitle>
          </div>
          <CardDescription>
            Track your scheduled lab slots and review your booking history.
          </CardDescription>
        </CardHeader>
      </Card>

      {myBookings.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">You have no bookings yet. Visit the "Book a Slot" page to schedule a lab session.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
          {myBookings.map((booking) => {
            const lab = getLabDetails(booking.labId);
            const timeSlot = getTimeSlotDetails(booking.timeSlotId);
            const equipment = getEquipmentDetails(booking.equipmentIds);
            const isPastBooking = new Date(`${booking.date}T${timeSlot?.endTime || '23:59'}`) < new Date() && booking.status !== 'cancelled';

            return (
              <Card key={booking.id} className={`shadow-md hover:shadow-lg transition-shadow ${isPastBooking ? 'opacity-70' : ''}`}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-xl mb-1">{lab?.name || "Unknown Lab"}</CardTitle>
                      <CardDescription className="flex items-center text-sm">
                        <MapPin className="h-4 w-4 mr-1 text-muted-foreground" /> Room: {lab?.roomNumber || "N/A"}
                      </CardDescription>
                    </div>
                    <Badge variant={getStatusBadgeVariant(booking.status)} className="whitespace-nowrap">
                      {isPastBooking && booking.status === 'booked' ? 'Completed' : booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="flex items-center">
                    <ClockIcon className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span>{format(new Date(booking.date), "EEEE, MMM d, yyyy")}</span>
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
                  {booking.status === 'booked' && !isPastBooking && (
                     <Button variant="outline" size="sm" onClick={() => handleCancelBooking(booking.id)}>
                       Cancel Booking
                     </Button>
                  )}
                   {booking.status === 'pending' && !isPastBooking && (
                     <Button variant="outline" size="sm" disabled>
                       Pending Approval
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
