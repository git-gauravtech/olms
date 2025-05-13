// src/components/lab/lab-availability-grid.tsx
"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { MOCK_LABS, MOCK_TIME_SLOTS, DAYS_OF_WEEK, MOCK_BOOKINGS } from "@/constants";
import type { Lab, TimeSlot, Booking } from "@/types";
import { cn } from "@/lib/utils";
import { format, addDays, startOfWeek } from "date-fns";

interface SlotStatus {
  status: 'available' | 'booked' | 'pending' | 'past';
  booking?: Booking;
}

interface SelectedSlotDetails {
  labName: string;
  slotDesc: string;
  statusInfo: SlotStatus;
  date: Date;
  timeSlot: TimeSlot;
  day: string;
}

export function LabAvailabilityGrid() {
  const router = useRouter();
  const [selectedLab, setSelectedLab] = React.useState<Lab | null>(MOCK_LABS[0]);
  const [weekStartDate, setWeekStartDate] = React.useState(startOfWeek(new Date(), { weekStartsOn: 1 /* Monday */ }));
  
  const [isSlotDetailDialogOpen, setIsSlotDetailDialogOpen] = React.useState(false);
  const [selectedSlotDetails, setSelectedSlotDetails] = React.useState<SelectedSlotDetails | null>(null);

  const getSlotStatus = (dayIndex: number, timeSlot: TimeSlot): SlotStatus => {
    const currentDate = addDays(weekStartDate, dayIndex);
    const formattedDate = format(currentDate, "yyyy-MM-dd");
    
    const [hours, minutes] = timeSlot.startTime.split(':').map(Number);
    const slotDateTime = new Date(currentDate);
    slotDateTime.setHours(hours, minutes, 0, 0);

    // Check if the slot is in the past (more precise check considering current time for today)
    const now = new Date();
    if (currentDate < startOfWeek(now, { weekStartsOn: 1 }) && format(currentDate, "yyyy-MM-dd") < format(now, "yyyy-MM-dd")) {
       return { status: 'past' };
    }
    if (format(currentDate, "yyyy-MM-dd") === format(now, "yyyy-MM-dd") && slotDateTime < now) {
         return { status: 'past' };
    }
     if (slotDateTime < now && format(slotDateTime, 'yyyy-MM-dd') < format(new Date(), 'yyyy-MM-dd')) {
      return { status: 'past' };
    }
    
    const booking = MOCK_BOOKINGS.find(
      (b) =>
        b.labId === selectedLab?.id &&
        b.date === formattedDate &&
        b.timeSlotId === timeSlot.id &&
        b.status !== 'cancelled'
    );

    if (booking) {
      return { status: booking.status as 'booked' | 'pending', booking };
    }
    return { status: 'available' };
  };

  const handleSlotClick = (day: string, dayIndex: number, timeSlot: TimeSlot, statusInfo: SlotStatus) => {
    if (!selectedLab) return;
    const slotDate = addDays(weekStartDate, dayIndex);
    
    setSelectedSlotDetails({
      labName: selectedLab.name,
      slotDesc: `${timeSlot.displayTime} on ${format(slotDate, "EEE, MMM d")}`,
      statusInfo,
      date: slotDate,
      timeSlot,
      day,
    });
    setIsSlotDetailDialogOpen(true);
  };

  const handlePreviousWeek = () => {
    setWeekStartDate(addDays(weekStartDate, -7));
  };

  const handleNextWeek = () => {
    setWeekStartDate(addDays(weekStartDate, 7));
  };
  
  const handleTodayWeek = () => {
    setWeekStartDate(startOfWeek(new Date(), { weekStartsOn: 1 }));
  }

  const getStatusColorClasses = (status: SlotStatus['status']) => {
    switch (status) {
      case 'available': return "text-green-700 dark:text-green-300";
      case 'booked': return "text-red-700 dark:text-red-300";
      case 'pending': return "text-yellow-700 dark:text-yellow-400";
      case 'past': return "text-muted-foreground";
      default: return "text-foreground";
    }
  };

  return (
    <>
      <Card className="w-full shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl">Lab Availability Viewer</CardTitle>
          <CardDescription>
            Select a lab to view its weekly schedule. Click on a slot (seat) for details or to book.
            Labs are rows, time slots are columns.
          </CardDescription>
          <div className="pt-4 space-y-4">
            <Select
              value={selectedLab?.id}
              onValueChange={(labId) => {
                setSelectedLab(MOCK_LABS.find(lab => lab.id === labId) || null);
              }}
            >
              <SelectTrigger className="w-full md:w-[280px]">
                <SelectValue placeholder="Select a lab" />
              </SelectTrigger>
              <SelectContent>
                {MOCK_LABS.map((lab) => (
                  <SelectItem key={lab.id} value={lab.id}>
                    {lab.name} (Capacity: {lab.capacity})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Button variant="outline" onClick={handlePreviousWeek}>Previous Week</Button>
                <Button variant="outline" onClick={handleTodayWeek}>Today</Button>
                <Button variant="outline" onClick={handleNextWeek}>Next Week</Button>
              </div>
              <p className="text-sm font-medium text-muted-foreground">
                Week of: {format(weekStartDate, "MMM d, yyyy")}
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {selectedLab ? (
            <div className="overflow-x-auto">
              <div className="grid gap-1 border border-border bg-border rounded-lg p-1" style={{ gridTemplateColumns: `minmax(80px, auto) repeat(${DAYS_OF_WEEK.length}, minmax(100px, 1fr))`}}>
                {/* Header Row: Time Slots */}
                <div className="p-2 font-semibold bg-card text-card-foreground rounded-tl-lg sticky left-0 z-20 flex items-center justify-center">Time</div>
                {DAYS_OF_WEEK.map((day, dayIndex) => (
                  <div key={day} className="p-2 font-semibold text-center bg-card text-card-foreground">
                    {day}<br/>
                    <span className="text-xs font-normal text-muted-foreground">{format(addDays(weekStartDate, dayIndex), "d MMM")}</span>
                  </div>
                ))}

                {/* Data Rows: Time Slots vs Days */}
                {MOCK_TIME_SLOTS.map((timeSlot) => (
                  <React.Fragment key={timeSlot.id}>
                    <div className="p-2 font-medium bg-card text-card-foreground sticky left-0 z-10 flex items-center justify-center text-center text-xs sm:text-sm break-words">
                      {timeSlot.displayTime.replace(' - ', '\n-\n')}
                    </div>
                    {DAYS_OF_WEEK.map((day, dayIndex) => {
                      const slotData = getSlotStatus(dayIndex, timeSlot);
                      return (
                        <Button
                          key={`${day}-${timeSlot.id}`}
                          variant="default" // Use default and override with cn
                          className={cn(
                            "h-full min-h-[60px] w-full rounded-md p-1.5 text-xs flex flex-col justify-center items-center whitespace-normal shadow-md transition-all hover:scale-105",
                            slotData.status === "available" && "bg-green-500 hover:bg-green-600 text-white",
                            slotData.status === "booked" && "bg-red-500 hover:bg-red-600 text-white cursor-not-allowed",
                            slotData.status === "pending" && "bg-yellow-400 hover:bg-yellow-500 text-black", // Yellow for pending/reserved
                            slotData.status === "past" && "bg-gray-400 text-gray-800 cursor-not-allowed opacity-75 hover:bg-gray-400"
                          )}
                          onClick={() => handleSlotClick(day, dayIndex, timeSlot, slotData)}
                          disabled={slotData.status === 'booked' || slotData.status === 'past'}
                        >
                          <span className="font-semibold text-[10px] sm:text-xs capitalize">
                            {slotData.status}
                          </span>
                          {slotData.booking && <span className="text-[9px] mt-0.5 line-clamp-2">{slotData.booking.purpose}</span>}
                        </Button>
                      );
                    })}
                  </React.Fragment>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-4">Please select a lab to see its availability.</p>
          )}
        </CardContent>
      </Card>

      {selectedSlotDetails && (
        <Dialog open={isSlotDetailDialogOpen} onOpenChange={setIsSlotDetailDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-xl">{selectedSlotDetails.labName} - Slot Details</DialogTitle>
              <DialogDescription>
                {selectedSlotDetails.day}, {selectedSlotDetails.slotDesc}
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-3">
              <p>
                Status:{" "}
                <span className={cn("font-semibold capitalize", getStatusColorClasses(selectedSlotDetails.statusInfo.status))}>
                  {selectedSlotDetails.statusInfo.status}
                </span>
              </p>
              {selectedSlotDetails.statusInfo.booking && (
                <>
                  <p><span className="font-medium">Purpose:</span> {selectedSlotDetails.statusInfo.booking.purpose}</p>
                  <p><span className="font-medium">User/Batch:</span> {selectedSlotDetails.statusInfo.booking.batchIdentifier || selectedSlotDetails.statusInfo.booking.userId}</p>
                  {selectedSlotDetails.statusInfo.booking.equipmentIds && selectedSlotDetails.statusInfo.booking.equipmentIds.length > 0 && (
                     <p><span className="font-medium">Equipment:</span> {selectedSlotDetails.statusInfo.booking.equipmentIds.join(', ')}</p>
                  )}
                </>
              )}
              {selectedSlotDetails.statusInfo.status === 'past' && (
                <p className="text-sm text-muted-foreground">This time slot is in the past and cannot be booked.</p>
              )}
            </div>
            <DialogFooter className="sm:justify-between">
              <Button variant="outline" onClick={() => setIsSlotDetailDialogOpen(false)}>
                Close
              </Button>
              {selectedSlotDetails.statusInfo.status === 'available' && (
                <Button 
                  className="bg-accent hover:bg-accent/90 text-accent-foreground"
                  onClick={() => {
                    // Navigate to booking form, potentially pre-filling data
                    // Example: router.push(`/dashboard/book-slot?labId=${selectedLab?.id}&date=${format(selectedSlotDetails.date, "yyyy-MM-dd")}&timeSlotId=${selectedSlotDetails.timeSlot.id}`);
                    router.push('/dashboard/book-slot');
                    setIsSlotDetailDialogOpen(false);
                  }}
                >
                  Book This Slot
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
