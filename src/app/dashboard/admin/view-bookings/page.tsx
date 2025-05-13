// src/app/dashboard/admin/view-bookings/page.tsx
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
import { CalendarDays, AlertTriangle } from "lucide-react";
import type { Booking, Lab, TimeSlot, Equipment } from "@/types";
import { MOCK_BOOKINGS, MOCK_LABS, MOCK_TIME_SLOTS, MOCK_EQUIPMENT } from "@/constants";
import { format, parseISO } from "date-fns"; // if dates are stored as ISO strings

export default function ViewBookingsPage() {
  const [bookings, setBookings] = React.useState<Booking[]>(MOCK_BOOKINGS);
  const [labs] = React.useState<Lab[]>(MOCK_LABS);
  const [timeSlots] = React.useState<TimeSlot[]>(MOCK_TIME_SLOTS);
  const [equipment] = React.useState<Equipment[]>(MOCK_EQUIPMENT);

  const getLabName = (labId: string) => labs.find(l => l.id === labId)?.name || "Unknown Lab";
  const getTimeSlotDisplay = (timeSlotId: string) => timeSlots.find(ts => ts.id === timeSlotId)?.displayTime || "Unknown Time";
  const getEquipmentNames = (equipmentIds: string[]) => {
    if (!equipmentIds || equipmentIds.length === 0) return "None";
    return equipmentIds.map(id => equipment.find(eq => eq.id === id)?.name || "Unknown Equipment").join(", ");
  };

  // Placeholder for conflict detection logic
  const findConflicts = (allBookings: Booking[]): string[] => {
    const conflicts: string[] = [];
    const bookingsBySlot: Record<string, Booking[]> = {};

    allBookings.forEach(booking => {
      if (booking.status === 'cancelled') return; // Ignore cancelled bookings for conflict
      const key = `${booking.labId}-${booking.date}-${booking.timeSlotId}`;
      if (!bookingsBySlot[key]) {
        bookingsBySlot[key] = [];
      }
      bookingsBySlot[key].push(booking);
    });

    for (const key in bookingsBySlot) {
      if (bookingsBySlot[key].length > 1) {
        // Basic conflict: multiple bookings for the same lab, date, and time slot
        // More advanced: check against lab capacity if multiple users/batches book the same slot
        bookingsBySlot[key].forEach(b => conflicts.push(b.id));
      }
    }
    return conflicts;
  };

  const [conflictingBookingIds, setConflictingBookingIds] = React.useState<string[]>([]);

  React.useEffect(() => {
    setConflictingBookingIds(findConflicts(bookings));
  }, [bookings]);

  const getStatusBadgeVariant = (status: Booking['status']) => {
    switch (status) {
      case 'booked': return 'default'; // primary
      case 'pending': return 'secondary'; // gray
      case 'cancelled': return 'destructive';
      default: return 'outline';
    }
  };

  return (
    <div className="container mx-auto py-10">
      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex items-center space-x-3">
            <CalendarDays className="h-8 w-8 text-primary" />
            <CardTitle className="text-2xl font-semibold">View All Bookings</CardTitle>
          </div>
          <CardDescription>
            Administrative overview of all lab bookings. Conflicts are highlighted.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {bookings.length === 0 ? (
             <p className="text-center text-muted-foreground py-4">No bookings found in the system.</p>
          ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Lab</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Time Slot</TableHead>
                <TableHead>User/Batch</TableHead>
                <TableHead>Purpose</TableHead>
                <TableHead>Equipment</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-center">Conflict</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bookings.map((booking) => (
                <TableRow key={booking.id} className={conflictingBookingIds.includes(booking.id) && booking.status !== 'cancelled' ? "bg-red-100 dark:bg-red-900/30" : ""}>
                  <TableCell className="font-medium">{getLabName(booking.labId)}</TableCell>
                  <TableCell>{format(new Date(booking.date), "PP")}</TableCell> {/* Ensure date is a Date object or parse it */}
                  <TableCell>{getTimeSlotDisplay(booking.timeSlotId)}</TableCell>
                  <TableCell>{booking.batchIdentifier || booking.userId}</TableCell>
                  <TableCell>{booking.purpose}</TableCell>
                  <TableCell className="max-w-xs truncate">{getEquipmentNames(booking.equipmentIds)}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(booking.status)}>
                      {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    {conflictingBookingIds.includes(booking.id) && booking.status !== 'cancelled' && (
                      <AlertTriangle className="h-5 w-5 text-destructive inline-block" titleAccess="Potential Conflict"/>
                    )}
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
