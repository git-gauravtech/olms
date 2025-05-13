// src/components/lab/lab-availability-grid.tsx
"use client";

import *_React from "react"; // Renamed to avoid conflict
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MOCK_LABS, MOCK_TIME_SLOTS, DAYS_OF_WEEK, MOCK_BOOKINGS } from "@/constants"; // Added MOCK_BOOKINGS
import type { Lab, TimeSlot, Booking } from "@/types";
import { cn } from "@/lib/utils";
// import { Badge } from "@/components/ui/badge"; // Not used currently
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle, XCircle, Clock, Info } from "lucide-react";
import { format, addDays, startOfWeek, parseISO } from "date-fns";

interface SlotStatus {
  status: 'available' | 'booked' | 'pending' | 'past';
  booking?: Booking;
}

export function LabAvailabilityGrid() {
  const [selectedLab, setSelectedLab] = _React.useState<Lab | null>(MOCK_LABS[0]);
  const [weekStartDate, setWeekStartDate] = _React.useState(startOfWeek(new Date(), { weekStartsOn: 1 /* Monday */ }));
  const [feedback, setFeedback] = _React.useState<{type: 'success' | 'error' | 'info', message: string} | null>(null);

  const getSlotStatus = (dayIndex: number, timeSlot: TimeSlot): SlotStatus => {
    const currentDate = addDays(weekStartDate, dayIndex);
    const formattedDate = format(currentDate, "yyyy-MM-dd");
    
    const [hours, minutes] = timeSlot.startTime.split(':').map(Number);
    const slotDateTime = new Date(currentDate);
    slotDateTime.setHours(hours, minutes, 0, 0);

    if (slotDateTime < new Date() && format(slotDateTime, 'yyyy-MM-dd') < format(new Date(), 'yyyy-MM-dd')) {
      return { status: 'past' };
    }
    
    // Find booking for the selected lab, specific date, and time slot
    const booking = MOCK_BOOKINGS.find(
      (b) =>
        b.labId === selectedLab?.id &&
        b.date === formattedDate &&
        b.timeSlotId === timeSlot.id &&
        b.status !== 'cancelled' // Don't consider cancelled bookings as occupying slot
    );

    if (booking) {
      return { status: booking.status as 'booked' | 'pending', booking };
    }
    return { status: 'available' };
  };

  const handleSlotClick = (day: string, dayIndex: number, timeSlot: TimeSlot, statusInfo: SlotStatus) => {
    const slotDate = addDays(weekStartDate, dayIndex);
    const slotDesc = `${timeSlot.displayTime} on ${format(slotDate, "EEE, MMM d")} for ${selectedLab?.name}`;

    if (statusInfo.status === 'available') {
      setFeedback({type: 'success', message: `Slot ${slotDesc} is available. Proceed to booking.`});
      // Potentially navigate to booking form with prefilled data or open a booking dialog
    } else if (statusInfo.status === 'booked') {
      setFeedback({type: 'error', message: `Slot ${slotDesc} is already booked.`});
    } else if (statusInfo.status === 'pending') {
      setFeedback({type: 'info', message: `Slot ${slotDesc} has a pending booking request.`});
    } else if (statusInfo.status === 'past') {
       setFeedback({type: 'info', message: `Slot ${slotDesc} is in the past and cannot be booked.`});
    }
  };

  const handlePreviousWeek = () => {
    setWeekStartDate(addDays(weekStartDate, -7));
    setFeedback(null);
  };

  const handleNextWeek = () => {
    setWeekStartDate(addDays(weekStartDate, 7));
    setFeedback(null);
  };
  
  const handleTodayWeek = () => {
    setWeekStartDate(startOfWeek(new Date(), { weekStartsOn: 1 }));
    setFeedback(null);
  }

  return (
    <Card className="w-full shadow-xl">
      <CardHeader>
        <CardTitle className="text-2xl">Lab Availability</CardTitle>
        <CardDescription>Select a lab to view its weekly schedule. Click on a slot for details or to book.</CardDescription>
        <div className="pt-4 space-y-4">
          <Select
            value={selectedLab?.id}
            onValueChange={(labId) => {
              setSelectedLab(MOCK_LABS.find(lab => lab.id === labId) || null);
              setFeedback(null);
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
        {feedback && (
           <Alert variant={feedback.type === 'error' ? 'destructive' : 'default'} className={`mb-4 ${
            feedback.type === 'success' ? 'border-green-500/50 bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300 dark:border-green-500/70' : 
            feedback.type === 'error' ? '' : // destructive handles its own
            'border-blue-500/50 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-500/70' 
           }`}>
            {feedback.type === 'success' && <CheckCircle className="h-4 w-4" />}
            {feedback.type === 'error' && <XCircle className="h-4 w-4" />}
            {feedback.type === 'info' && <Info className="h-4 w-4" />}
            <AlertTitle className="font-semibold">
              {feedback.type === 'success' ? 'Available' : feedback.type === 'error' ? 'Unavailable' : 'Notice'}
            </AlertTitle>
            <AlertDescription>{feedback.message}</AlertDescription>
          </Alert>
        )}
        {selectedLab ? (
          <div className="overflow-x-auto">
            <div className="grid gap-px border border-border bg-border rounded-lg" style={{ gridTemplateColumns: `auto repeat(${DAYS_OF_WEEK.length}, minmax(100px, 1fr))`}}>
              {/* Header Row: Time Slots */}
              <div className="p-2.5 font-semibold bg-card text-card-foreground rounded-tl-lg sticky left-0 z-20">Time</div>
              {DAYS_OF_WEEK.map((day, dayIndex) => (
                <div key={day} className="p-2.5 font-semibold text-center bg-card text-card-foreground">
                  {day}<br/>
                  <span className="text-xs font-normal text-muted-foreground">{format(addDays(weekStartDate, dayIndex), "MMM d")}</span>
                </div>
              ))}

              {/* Data Rows: Time Slots vs Days */}
              {MOCK_TIME_SLOTS.map((timeSlot) => (
                <_React.Fragment key={timeSlot.id}>
                  <div className="p-2.5 font-medium bg-card text-card-foreground sticky left-0 z-10 flex items-center justify-center text-xs sm:text-sm">
                    {timeSlot.displayTime.replace(' - ', '\n-\n')}
                  </div>
                  {DAYS_OF_WEEK.map((day, dayIndex) => {
                    const slotData = getSlotStatus(dayIndex, timeSlot);
                    return (
                      <Button
                        key={`${day}-${timeSlot.id}`}
                        variant="outline"
                        className={cn(
                          "h-full min-h-[70px] w-full rounded-none p-1.5 text-xs flex flex-col justify-center items-center whitespace-normal border-0 border-l border-t border-border focus:z-10",
                          slotData.status === "available" && "bg-green-500/10 hover:bg-green-500/20 text-green-700 dark:bg-green-500/20 dark:hover:bg-green-500/30 dark:text-green-300",
                          slotData.status === "booked" && "bg-red-500/10 hover:bg-red-500/20 text-red-700 cursor-not-allowed dark:bg-red-500/20 dark:hover:bg-red-500/30 dark:text-red-300",
                          slotData.status === "pending" && "bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-700 dark:bg-yellow-500/20 dark:hover:bg-yellow-500/30 dark:text-yellow-400",
                          slotData.status === "past" && "bg-muted/30 text-muted-foreground cursor-not-allowed opacity-60"
                        )}
                        onClick={() => handleSlotClick(day, dayIndex, timeSlot, slotData)}
                        disabled={slotData.status === 'booked' || slotData.status === 'past'}
                      >
                        <span className="font-semibold text-[10px] sm:text-xs">
                          {slotData.status === 'available' && 'Available'}
                          {slotData.status === 'booked' && 'Booked'}
                          {slotData.status === 'pending' && 'Pending'}
                          {slotData.status === 'past' && 'Past'}
                        </span>
                        {slotData.booking && <span className="text-[10px] mt-1 line-clamp-2">{slotData.booking.purpose}</span>}
                      </Button>
                    );
                  })}
                </_React.Fragment>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-muted-foreground text-center py-4">Please select a lab to see its availability.</p>
        )}
      </CardContent>
    </Card>
  );
}
