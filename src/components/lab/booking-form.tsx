"use client";

import * as React from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { CalendarIcon, Loader2 } from "lucide-react";
import { MOCK_LABS, MOCK_TIME_SLOTS } from "@/constants";
import type { Lab, TimeSlot } from "@/types";
import { AvailabilitySuggestionsDialog } from "./availability-suggestions-dialog";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";

const bookingFormSchema = z.object({
  labId: z.string({ required_error: "Please select a lab." }),
  date: z.date({ required_error: "Please select a date." }),
  timeSlotId: z.string({ required_error: "Please select a time slot." }),
  purpose: z.string().min(10, { message: "Purpose must be at least 10 characters." }).max(200, { message: "Purpose must not exceed 200 characters." }),
});

type BookingFormValues = z.infer<typeof bookingFormSchema>;

// Simulate a function to check slot availability
const checkSlotAvailability = async (labId: string, date: Date, timeSlotId: string): Promise<boolean> => {
  // Mock logic: For demonstration, assume "Physics Lab Alpha" on "09:00 AM - 10:00 AM" is always booked
  const selectedLab = MOCK_LABS.find(lab => lab.id === labId);
  const selectedTimeSlot = MOCK_TIME_SLOTS.find(slot => slot.id === timeSlotId);

  if (selectedLab?.name === "Physics Lab Alpha" && selectedTimeSlot?.displayTime === "09:00 AM - 10:00 AM") {
    // Simulate checking for a specific date if needed, for now, just this combo is unavailable
    // This is a very basic mock. A real app would query a database.
    return false; 
  }
  return true; // Slot is available
};


export function BookingForm() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [showSuggestionsDialog, setShowSuggestionsDialog] = React.useState(false);
  const [suggestionParams, setSuggestionParams] = React.useState<{ labName: string; preferredSlot: string }>({ labName: "", preferredSlot: "" });
  
  const form = useForm<BookingFormValues>({
    resolver: zodResolver(bookingFormSchema),
    defaultValues: {
      purpose: "",
    },
  });

  async function onSubmit(data: BookingFormValues) {
    setIsSubmitting(true);
    
    const isAvailable = await checkSlotAvailability(data.labId, data.date, data.timeSlotId);

    if (isAvailable) {
      // Simulate successful booking
      setTimeout(() => {
        toast({
          title: "Booking Submitted!",
          description: `Lab slot booked for ${MOCK_LABS.find(l => l.id === data.labId)?.name} on ${format(data.date, "PPP")} at ${MOCK_TIME_SLOTS.find(ts => ts.id === data.timeSlotId)?.displayTime}.`,
        });
        form.reset();
        setIsSubmitting(false);
      }, 1000);
    } else {
      // Slot is unavailable, show AI suggestions dialog
      const selectedLab = MOCK_LABS.find(l => l.id === data.labId);
      const selectedTimeSlot = MOCK_TIME_SLOTS.find(ts => ts.id === data.timeSlotId);
      setSuggestionParams({
        labName: selectedLab?.name || "Selected Lab",
        preferredSlot: `${format(data.date, "EEE, MMM d")} ${selectedTimeSlot?.displayTime || "Selected Time"}`,
      });
      setShowSuggestionsDialog(true);
      setIsSubmitting(false);
    }
  }

  const handleSuggestedSlotSelect = (slot: string) => {
    // Here, you would parse the 'slot' string and update the form or handle new booking.
    // For this example, we'll just toast the selection.
    toast({
      title: "Slot Selected from Suggestions",
      description: `You selected: ${slot}. Please re-submit the form with new details if applicable.`,
    });
    // Potentially, auto-fill parts of the form based on 'slot' and re-validate.
    // This example assumes 'slot' is a descriptive string like "Tuesday 02:00 PM - 03:00 PM"
  };

  return (
    <>
      <Card className="w-full max-w-2xl mx-auto shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl">Book a Lab Slot</CardTitle>
          <CardDescription>Fill in the details below to schedule your lab session.</CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="labId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lab</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a lab" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {MOCK_LABS.map((lab: Lab) => (
                          <SelectItem key={lab.id} value={lab.id}>
                            {lab.name} (Capacity: {lab.capacity})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) => date < new Date(new Date().setHours(0,0,0,0))} // Disable past dates
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="timeSlotId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Time Slot</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a time slot" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {MOCK_TIME_SLOTS.map((slot: TimeSlot) => (
                          <SelectItem key={slot.id} value={slot.id}>
                            {slot.displayTime}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="purpose"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Purpose of Booking</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="e.g., Conducting experiments for CHM101, Group project meeting, Software development..."
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Briefly describe the reason for your booking.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={isSubmitting} className="w-full">
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Submit Booking
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>

      <AvailabilitySuggestionsDialog
        open={showSuggestionsDialog}
        onOpenChange={setShowSuggestionsDialog}
        labName={suggestionParams.labName}
        preferredSlot={suggestionParams.preferredSlot}
        onSlotSelect={handleSuggestedSlotSelect}
      />
    </>
  );
}
