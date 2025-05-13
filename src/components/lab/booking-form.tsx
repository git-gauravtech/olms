// src/components/lab/booking-form.tsx
"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
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
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { CalendarIcon, Loader2, Package, FlaskConical } from "lucide-react";
import { MOCK_LABS, MOCK_TIME_SLOTS, MOCK_EQUIPMENT, MOCK_BOOKINGS } from "@/constants";
import type { Lab, TimeSlot, Equipment, Booking, UserRole } from "@/types";
import { USER_ROLES } from "@/types";
import { AvailabilitySuggestionsDialog } from "./availability-suggestions-dialog";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";

const bookingFormSchema = z.object({
  labId: z.string({ required_error: "Please select a lab." }),
  date: z.date({ required_error: "Please select a date." }),
  timeSlotId: z.string({ required_error: "Please select a time slot." }),
  purpose: z.string().min(10, { message: "Purpose must be at least 10 characters." }).max(200, { message: "Purpose must not exceed 200 characters." }),
  equipmentIds: z.array(z.string()).optional(), // Array of equipment IDs
});

type BookingFormValues = z.infer<typeof bookingFormSchema>;

// Simulate a function to check slot availability (remains simplified)
const checkSlotAvailability = async (labId: string, date: Date, timeSlotId: string): Promise<boolean> => {
  const formattedDate = format(date, "yyyy-MM-dd");
  const existingBooking = MOCK_BOOKINGS.find(
    b => b.labId === labId && b.date === formattedDate && b.timeSlotId === timeSlotId && (b.status === 'booked' || b.status === 'pending')
  );
  return !existingBooking;
};


export function BookingForm() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [showSuggestionsDialog, setShowSuggestionsDialog] = React.useState(false);
  const [suggestionParams, setSuggestionParams] = React.useState<{ labName: string; preferredSlot: string }>({ labName: "", preferredSlot: "" });
  const [availableEquipment, setAvailableEquipment] = React.useState<Equipment[]>(MOCK_EQUIPMENT.filter(eq => eq.status === 'available'));
  const [currentUserRole, setCurrentUserRole] = React.useState<UserRole | null>(null);
  
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const role = localStorage.getItem('userRole') as UserRole | null;
      setCurrentUserRole(role);
    }
  }, []);

  const form = useForm<BookingFormValues>({
    resolver: zodResolver(bookingFormSchema),
    defaultValues: {
      purpose: "",
      equipmentIds: [],
    },
  });

  const selectedLabId = form.watch("labId");

  React.useEffect(() => {
    if (selectedLabId) {
      // Filter equipment based on selected lab or show general pool equipment
      const labSpecificEquipment = MOCK_EQUIPMENT.filter(eq => eq.labId === selectedLabId && eq.status === 'available');
      const generalPoolEquipment = MOCK_EQUIPMENT.filter(eq => !eq.labId && eq.status === 'available');
      setAvailableEquipment([...labSpecificEquipment, ...generalPoolEquipment]);
    } else {
      setAvailableEquipment(MOCK_EQUIPMENT.filter(eq => eq.status === 'available'));
    }
    form.setValue("equipmentIds", []); // Reset selected equipment when lab changes
  }, [selectedLabId, form]);

  async function onSubmit(data: BookingFormValues) {
    setIsSubmitting(true);
    
    const isAvailable = await checkSlotAvailability(data.labId, data.date, data.timeSlotId);

    if (isAvailable) {
      // Simulate successful booking
      const newBooking: Booking = {
        id: `b_${Date.now()}`,
        labId: data.labId,
        date: format(data.date, "yyyy-MM-dd"),
        timeSlotId: data.timeSlotId,
        userId: "currentUser", // Placeholder, replace with actual user ID from auth context
        purpose: data.purpose,
        equipmentIds: data.equipmentIds || [],
        status: currentUserRole === USER_ROLES.FACULTY ? 'booked' : 'pending', // Faculty bookings are auto-approved, others pending
        requestedByRole: currentUserRole || USER_ROLES.STUDENT, // Default to student if role not found
      };
      
      MOCK_BOOKINGS.push(newBooking); 

      setTimeout(() => {
        toast({
          title: `Booking ${newBooking.status === 'booked' ? 'Confirmed' : 'Requested'}!`,
          description: `Lab slot for ${MOCK_LABS.find(l => l.id === data.labId)?.name} on ${format(data.date, "PPP")} at ${MOCK_TIME_SLOTS.find(ts => ts.id === data.timeSlotId)?.displayTime} is ${newBooking.status === 'booked' ? 'confirmed' : 'requested'}.`,
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
    toast({
      title: "Slot Selected from Suggestions",
      description: `You selected: ${slot}. Please re-fill and submit the form with new details.`,
    });
    // Ideally, parse 'slot' and pre-fill the form. For now, manual re-fill.
  };

  return (
    <>
      <Card className="w-full max-w-2xl mx-auto shadow-xl my-8">
        <CardHeader>
          <div className="flex items-center space-x-3">
            <FlaskConical className="h-8 w-8 text-primary" />
             <CardTitle className="text-2xl">Book a Lab Slot</CardTitle>
          </div>
          <CardDescription>Fill in the details below to schedule your lab session in the Optimized Lab Management System.</CardDescription>
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
                            {lab.name} (Room: {lab.roomNumber}, Capacity: {lab.capacity})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

            <div className="grid md:grid-cols-2 gap-6">
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
                          disabled={(date) => date < new Date(new Date().setHours(0,0,0,0))}
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
            </div>

              <FormField
                control={form.control}
                name="purpose"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Purpose of Booking</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="e.g., Conducting experiments, Group project, Software development..."
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
              
              <FormField
                control={form.control}
                name="equipmentIds"
                render={() => (
                  <FormItem>
                    <div className="mb-2">
                      <FormLabel className="text-base flex items-center">
                        <Package className="mr-2 h-5 w-5 text-primary" />
                        Required Equipment (Optional)
                      </FormLabel>
                      <FormDescription>
                        Select any specific equipment you need for this session. Availability depends on the selected lab and general pool.
                      </FormDescription>
                    </div>
                    {availableEquipment.length > 0 ? (
                      <div className="space-y-2 max-h-40 overflow-y-auto rounded-md border p-3">
                      {availableEquipment.map((item) => (
                        <FormField
                          key={item.id}
                          control={form.control}
                          name="equipmentIds"
                          render={({ field }) => {
                            return (
                              <FormItem
                                key={item.id}
                                className="flex flex-row items-start space-x-3 space-y-0"
                              >
                                <FormControl>
                                  <Checkbox
                                    checked={field.value?.includes(item.id)}
                                    onCheckedChange={(checked) => {
                                      const currentValues = field.value || [];
                                      return checked
                                        ? field.onChange([...currentValues, item.id])
                                        : field.onChange(
                                            currentValues.filter(
                                              (value) => value !== item.id
                                            )
                                          );
                                    }}
                                  />
                                </FormControl>
                                <FormLabel className="font-normal">
                                  {item.name} ({item.type})
                                </FormLabel>
                              </FormItem>
                            );
                          }}
                        />
                      ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No specific equipment available for selection or based on the chosen lab.</p>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={isSubmitting} className="w-full">
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Submit Booking Request
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
