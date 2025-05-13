"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MOCK_LABS, MOCK_TIME_SLOTS, DAYS_OF_WEEK } from "@/constants";
import type { Lab, TimeSlot, Booking } from "@/types";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle, XCircle, Clock } from "lucide-react";

// Mock bookings data
const MOCK_BOOKINGS: Booking[] = [
  { id: 'b1', labId: 'physics_lab', date: '2024-07-29', timeSlotId: 'ts_0900_1000', userId: 'student1', purpose: 'Experiment A', status: 'booked' },
  { id: 'b2', labId: 'physics_lab', date: '2024-07-29', timeSlotId: 'ts_1000_1100', userId: 'student2', purpose: 'Experiment B', status: 'pending' },
  { id: 'b3', labId: 'chemistry_lab', date: '2024-07-30', timeSlotId: 'ts_1400_1500', userId: 'faculty1', purpose: 'Class Practical', status: 'booked' },
];

interface SlotStatus {
  status: 'available' | 'booked' | 'pending' | 'past';
  booking?: Booking;
}

export function LabAvailabilityGrid() {
  const [selectedLab, setSelectedLab] = React.useState<Lab | null>(MOCK_LABS[0]);
  // For simplicity, using current date. In a real app, this would be selectable.
  const [currentDate, setCurrentDate] = React.useState(new Date()); 
  const [feedback, setFeedback] = React.useState<{type: 'success' | 'error' | 'info', message: string} | null>(null);


  const getSlotStatus = (dayIndex: number, timeSlot: TimeSlot): SlotStatus => {
    // In a real app, date would be based on selected week/day + dayIndex
    // For this mock, let's assume all slots are for a specific date relative to today
    const slotDateTime = new Date(currentDate);
    // This is a simplification; dayIndex isn't directly used for date calculation here
    // A real implementation would require a more robust date management for the week view
    
    const [hours, minutes] = timeSlot.startTime.split(':').map(Number);
    slotDateTime.setHours(hours, minutes, 0, 0);

    if (slotDateTime < new Date()) {
      return { status: 'past' };
    }

    const booking = MOCK_BOOKINGS.find(
      (b) =>
        b.labId === selectedLab?.id &&
        // b.date === 'YYYY-MM-DD' (match with actual date of the slot)
        b.timeSlotId === timeSlot.id
    );

    if (booking) {
      return { status: booking.status as 'booked' | 'pending', booking };
    }
    return { status: 'available' };
  };

  const handleSlotClick = (day: string, timeSlot: TimeSlot, status: SlotStatus) => {
    if (status.status === 'available') {
      setFeedback({type: 'success', message: `Slot ${timeSlot.displayTime} on ${day} for ${selectedLab?.name} is available. Proceed to booking.`});
      // Potentially navigate to booking form with prefilled data
    } else if (status.status === 'booked') {
      setFeedback({type: 'error', message: `Slot ${timeSlot.displayTime} on ${day} for ${selectedLab?.name} is already booked.`});
    } else if (status.status === 'pending') {
      setFeedback({type: 'info', message: `Slot ${timeSlot.displayTime} on ${day} for ${selectedLab?.name} has a pending booking.`});
    }
  };

  return (
    <Card className="w-full shadow-xl">
      <CardHeader>
        <CardTitle className="text-2xl">Lab Availability</CardTitle>
        <CardDescription>Select a lab to view its weekly schedule. Click on a slot for details.</CardDescription>
        <div className="pt-4">
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
        </div>
      </CardHeader>
      <CardContent>
        {feedback && (
           <Alert variant={feedback.type === 'error' ? 'destructive' : 'default'} className={`mb-4 ${
            feedback.type === 'success' ? 'bg-green-100 border-green-400 text-green-700' : 
            feedback.type === 'error' ? '' : // destructive handles its own
            'bg-blue-100 border-blue-400 text-blue-700' 
           }`}>
            {feedback.type === 'success' && <CheckCircle className="h-4 w-4" />}
            {feedback.type === 'error' && <XCircle className="h-4 w-4" />}
            {feedback.type === 'info' && <Clock className="h-4 w-4" />}
            <AlertTitle>
              {feedback.type === 'success' ? 'Available' : feedback.type === 'error' ? 'Unavailable' : 'Notice'}
            </AlertTitle>
            <AlertDescription>{feedback.message}</AlertDescription>
          </Alert>
        )}
        {selectedLab ? (
          <div className="overflow-x-auto">
            <div className="grid gap-px border border-border bg-border rounded-lg" style={{ gridTemplateColumns: `auto repeat(${DAYS_OF_WEEK.length}, 1fr)`}}>
              {/* Header Row: Time Slots */}
              <div className="p-3 font-semibold bg-card text-card-foreground rounded-tl-lg">Time / Day</div>
              {DAYS_OF_WEEK.map((day) => (
                <div key={day} className="p-3 font-semibold text-center bg-card text-card-foreground">
                  {day}
                </div>
              ))}

              {/* Data Rows: Time Slots vs Days */}
              {MOCK_TIME_SLOTS.map((timeSlot, tsIndex) => (
                <React.Fragment key={timeSlot.id}>
                  <div className="p-3 font-medium bg-card text-card-foreground sticky left-0 z-10">
                    {timeSlot.displayTime}
                  </div>
                  {DAYS_OF_WEEK.map((day, dayIndex) => {
                    const slotData = getSlotStatus(dayIndex, timeSlot);
                    return (
                      <Button
                        key={`${day}-${timeSlot.id}`}
                        variant="outline"
                        className={cn(
                          "h-full min-h-[60px] w-full rounded-none p-2 text-xs flex flex-col justify-center items-center whitespace-normal border-0 border-l border-t border-border",
                          slotData.status === "available" && "bg-green-500/20 hover:bg-green-500/30 text-green-700",
                          slotData.status === "booked" && "bg-red-500/20 hover:bg-red-500/30 text-red-700 cursor-not-allowed",
                          slotData.status === "pending" && "bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-700",
                          slotData.status === "past" && "bg-muted/50 text-muted-foreground cursor-not-allowed opacity-70"
                        )}
                        onClick={() => handleSlotClick(day, timeSlot, slotData)}
                        disabled={slotData.status === 'booked' || slotData.status === 'past'}
                      >
                        <span className="font-semibold">
                          {slotData.status === 'available' && 'Available'}
                          {slotData.status === 'booked' && 'Booked'}
                          {slotData.status === 'pending' && 'Pending'}
                          {slotData.status === 'past' && 'Past'}
                        </span>
                        {slotData.booking && <span className="text-xs mt-1">{slotData.booking.purpose.substring(0,15)}{slotData.booking.purpose.length > 15 ? "..." : ""}</span>}
                      </Button>
                    );
                  })}
                </React.Fragment>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-muted-foreground">Please select a lab to see its availability.</p>
        )}
      </CardContent>
    </Card>
  );
}
