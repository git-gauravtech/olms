// src/app/dashboard/cr/request-class-booking/page.tsx
"use client";

import *_React from "react"; // Renamed to avoid conflict with React namespace for useState etc.
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
import { CalendarIcon, Loader2, Users, Package, BookCopy } from "lucide-react";
import { MOCK_LABS, MOCK_TIME_SLOTS, MOCK_EQUIPMENT, MOCK_BOOKINGS, DEPARTMENTS } from "@/constants";
import type { Lab, TimeSlot, Equipment, Booking, UserRole } from "@/types";
import { USER_ROLES } from "@/types";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { AvailabilitySuggestionsDialog } from "@/components/lab/availability-suggestions-dialog";


const crBookingFormSchema = z.object({
  batchIdentifier: z.string().min(3, { message: "Batch/Class name must be at least 3 characters." }),
  numberOfStudents: z.number().min(1, {message: "Number of students must be at least 1."}).optional(),
  department: z.string().optional(),
  labId: z.string({ required_error: "Please select a lab." }),
  date: z.date({ required_error: "Please select a date." }),
  timeSlotId: z.string({ required_error: "Please select a time slot." }),
  purpose: z.string().min(10, { message: "Purpose must be at least 10 characters." }).max(200, { message: "Purpose must not exceed 200 characters." }),
  equipmentIds: z.array(z.string()).optional(),
});

type CrBookingFormValues = z.infer<typeof crBookingFormSchema>;

// Simulate a function to check slot availability (remains simplified)
const checkSlotAvailability = async (labId: string, date: Date, timeSlotId: string): Promise<boolean> => {
  const formattedDate = format(date, "yyyy-MM-dd");
  const existingBooking = MOCK_BOOKINGS.find(
    b => b.labId === labId && b.date === formattedDate && b.timeSlotId === timeSlotId && b.status === 'booked'
  );
  return !existingBooking;
};

export default function RequestClassBookingPage() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = _React.useState(false);
  const [showSuggestionsDialog, setShowSuggestionsDialog] = _React.useState(false);
  const [suggestionParams, setSuggestionParams] = _React.useState<{ labName: string; preferredSlot: string }>({ labName: "", preferredSlot: "" });
  const [availableEquipment, setAvailableEquipment] = _React.useState<Equipment[]>(MOCK_EQUIPMENT.filter(eq => eq.status === 'available'));
  
  const form = useForm<CrBookingFormValues>({
    resolver: zodResolver(crBookingFormSchema),
    defaultValues: {
      batchIdentifier: "",
      purpose: "",
      equipmentIds: [],
    },
  });

  const selectedLabId = form.watch("labId");

  _React.useEffect(() => {
    if (selectedLabId) {
      const labSpecificEquipment = MOCK_EQUIPMENT.filter(eq => eq.labId === selectedLabId && eq.status === 'available');
      const generalPoolEquipment = MOCK_EQUIPMENT.filter(eq => !eq.labId && eq.status === 'available');
      setAvailableEquipment([...labSpecificEquipment, ...generalPoolEquipment]);
    } else {
      setAvailableEquipment(MOCK_EQUIPMENT.filter(eq => eq.status === 'available'));
    }
    form.setValue("equipmentIds", []);
  }, [selectedLabId, form]);

  async function onSubmit(data: CrBookingFormValues) {
    setIsSubmitting(true);
    
    const isAvailable = await checkSlotAvailability(data.labId, data.date, data.timeSlotId);

    if (isAvailable) {
      const newBooking: Booking = {
        id: `b_cr_${Date.now()}`,
        labId: data.labId,
        date: format(data.date, "yyyy-MM-dd"),
        timeSlotId: data.timeSlotId,
        userId: "cr_user", // Placeholder for CR user ID
        purpose: data.purpose,
        equipmentIds: data.equipmentIds || [],
        status: 'pending', // Class bookings might need approval
        batchIdentifier: data.batchIdentifier,
        requestedByRole: USER_ROLES.CR,
      };
      
      MOCK_BOOKINGS.push(newBooking); // For demo
      console.log("New Class Booking Request:", newBooking);

      setTimeout(() => {
        toast({
          title: "Class Booking Requested!",
          description: `Request for ${data.batchIdentifier} in ${MOCK_LABS.find(l => l.id === data.labId)?.name} submitted.`,
        });
        form.reset();
        setIsSubmitting(false);
      }, 1000);
    } else {
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
      description: `You selected: ${slot}. Please re-fill and submit the form.`,
    });
  };

  return (
    <>
      <Card className="w-full max-w-3xl mx-auto shadow-xl my-8">
        <CardHeader>
          <div className="flex items-center space-x-3">
            <Users className="h-8 w-8 text-primary" />
            <CardTitle className="text-2xl">Request Lab Slot for Class</CardTitle>
          </div>
          <CardDescription>Fill in the details to request a lab session for your class/batch.</CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="batchIdentifier"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Batch/Class Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., CSE Year 2 - Section A" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="numberOfStudents"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Number of Students (Optional)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="e.g., 25" {...field} onChange={e => field.onChange(parseInt(e.target.value))} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="department"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Department (Optional)</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select department" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {DEPARTMENTS.map(dept => (
                          <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="labId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preferred Lab</FormLabel>
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

              <div className="grid md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Preferred Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn("w-full pl-3 text-left font-normal",!field.value && "text-muted-foreground")}
                            >
                              {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar mode="single" selected={field.value} onSelect={field.onChange} disabled={(date) => date < new Date(new Date().setHours(0,0,0,0))} initialFocus />
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
                      <FormLabel>Preferred Time Slot</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a time slot" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {MOCK_TIME_SLOTS.map((slot: TimeSlot) => (
                            <SelectItem key={slot.id} value={slot.id}>{slot.displayTime}</SelectItem>
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
                    <FormLabel>Purpose of Booking / Subject</FormLabel>
                    <FormControl>
                      <Textarea placeholder="e.g., Data Structures Lab Session, Microprocessor Practical" className="resize-none" {...field} />
                    </FormControl>
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
                    </div>
                    {availableEquipment.length > 0 ? (
                      <div className="space-y-2 max-h-40 overflow-y-auto rounded-md border p-3">
                      {availableEquipment.map((item) => (
                        <FormField
                          key={item.id}
                          control={form.control}
                          name="equipmentIds"
                          render={({ field }) => (
                            <FormItem key={item.id} className="flex flex-row items-start space-x-3 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(item.id)}
                                  onCheckedChange={(checked) => checked
                                    ? field.onChange([...(field.value || []), item.id])
                                    : field.onChange((field.value || []).filter(value => value !== item.id))
                                  }
                                />
                              </FormControl>
                              <FormLabel className="font-normal">{item.name} ({item.type})</FormLabel>
                            </FormItem>
                          )}
                        />
                      ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No specific equipment available.</p>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={isSubmitting} className="w-full">
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Submit Class Booking Request
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
