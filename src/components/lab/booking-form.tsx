import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { CalendarIcon, Package, FlaskConical, Loader2 } from "lucide-react";
import { MOCK_LABS, MOCK_TIME_SLOTS, MOCK_EQUIPMENT, MOCK_BOOKINGS } from "@/constants";
import type { Lab, TimeSlot, Equipment, Booking, UserRole } from "@/types";
import { USER_ROLES } from "@/types";
// import { AvailabilitySuggestionsDialog } from "./availability-suggestions-dialog"; // This would also need rewrite

const bookingFormSchema = z.object({
  labId: z.string({ required_error: "Please select a lab." }),
  date: z.date({ required_error: "Please select a date." }), // react-hook-form might need specific handling for date inputs without UI lib
  timeSlotId: z.string({ required_error: "Please select a time slot." }),
  purpose: z.string().min(10, { message: "Purpose must be at least 10 characters." }).max(200, { message: "Purpose must not exceed 200 characters." }),
  equipmentIds: z.array(z.string()).optional(),
});

type BookingFormValues = z.infer<typeof bookingFormSchema>;

const checkSlotAvailability = async (labId: string, date: Date, timeSlotId: string): Promise<boolean> => {
  const formattedDate = format(date, "yyyy-MM-dd");
  const existingBooking = MOCK_BOOKINGS.find(
    b => b.labId === labId && b.date === formattedDate && b.timeSlotId === timeSlotId && (b.status === 'booked' || b.status === 'pending')
  );
  return !existingBooking;
};

export function BookingForm() {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  // const [showSuggestionsDialog, setShowSuggestionsDialog] = React.useState(false);
  // const [suggestionParams, setSuggestionParams] = React.useState<{ labName: string; preferredSlot: string }>({ labName: "", preferredSlot: "" });
  const [availableEquipment, setAvailableEquipment] = React.useState<Equipment[]>(MOCK_EQUIPMENT.filter(eq => eq.status === 'available'));
  const [currentUserRole, setCurrentUserRole] = React.useState<UserRole | null>(null);
  
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const role = localStorage.getItem('userRole') as UserRole | null;
      setCurrentUserRole(role);
    }
  }, []);

  const { register, handleSubmit, formState: { errors }, watch, setValue, reset } = useForm<BookingFormValues>({
    resolver: zodResolver(bookingFormSchema),
    defaultValues: {
      purpose: "",
      equipmentIds: [],
    },
  });

  const selectedLabId = watch("labId");

  React.useEffect(() => {
    if (selectedLabId) {
      const labSpecificEquipment = MOCK_EQUIPMENT.filter(eq => eq.labId === selectedLabId && eq.status === 'available');
      const generalPoolEquipment = MOCK_EQUIPMENT.filter(eq => !eq.labId && eq.status === 'available');
      setAvailableEquipment([...labSpecificEquipment, ...generalPoolEquipment]);
    } else {
      setAvailableEquipment(MOCK_EQUIPMENT.filter(eq => eq.status === 'available'));
    }
    setValue("equipmentIds", []);
  }, [selectedLabId, setValue]);

  async function onSubmit(data: BookingFormValues) {
    setIsSubmitting(true);
    const isAvailable = await checkSlotAvailability(data.labId, data.date, data.timeSlotId);

    if (isAvailable) {
      const newBooking: Booking = {
        id: `b_${Date.now()}`,
        labId: data.labId,
        date: format(data.date, "yyyy-MM-dd"),
        timeSlotId: data.timeSlotId,
        userId: "currentUser", 
        purpose: data.purpose,
        equipmentIds: data.equipmentIds || [],
        status: currentUserRole === USER_ROLES.FACULTY ? 'booked' : 'pending',
        requestedByRole: currentUserRole || USER_ROLES.STUDENT,
      };
      MOCK_BOOKINGS.push(newBooking);
      setTimeout(() => {
        window.alert(`Booking ${newBooking.status === 'booked' ? 'Confirmed' : 'Requested'}! Lab: ${MOCK_LABS.find(l=>l.id === data.labId)?.name}, Date: ${format(data.date, "PPP")}, Time: ${MOCK_TIME_SLOTS.find(ts=>ts.id === data.timeSlotId)?.displayTime}`);
        reset();
        setIsSubmitting(false);
      }, 1000);
    } else {
      window.alert("Slot is unavailable. AI suggestions would appear here.");
      // AI Suggestion dialog logic would go here
      setIsSubmitting(false);
    }
  }
  
  // Simplified date input. For better UX, use a date picker library.
  const handleDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const dateValue = event.target.value; // YYYY-MM-DD string
    if (dateValue) {
      setValue("date", new Date(dateValue + "T00:00:00")); // Ensure parsing as local date
    } else {
      setValue("date", undefined as any); // Or handle empty state
    }
  };


  return (
    <div className="custom-card">
      <div className="custom-card-header" style={{display: 'flex', alignItems: 'center', gap: '0.75rem'}}>
        <FlaskConical style={{height: '2rem', width: '2rem', color: '#007BFF'}} />
        <h2 className="custom-card-title" style={{fontSize: '1.5rem'}}>Book a Lab Slot</h2>
      </div>
      <form onSubmit={handleSubmit(onSubmit)} className="custom-card-content" style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
        <div>
          <label htmlFor="labId" className="custom-label">Lab</label>
          <select id="labId" {...register("labId")} className="custom-select">
            <option value="">Select a lab</option>
            {MOCK_LABS.map((lab: Lab) => (
              <option key={lab.id} value={lab.id}>
                {lab.name} (Room: {lab.roomNumber}, Capacity: {lab.capacity})
              </option>
            ))}
          </select>
          {errors.labId && <p className="error-message">{errors.labId.message}</p>}
        </div>

        <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem'}}>
          <div>
            <label htmlFor="date" className="custom-label">Date</label>
            {/* Basic date input, consider a library for better UX */}
            <input type="date" id="date" {...register("date", {setValueAs: (value: string) => new Date(value + "T00:00:00")})} className="custom-input" min={format(new Date(), "yyyy-MM-dd")} />
            {errors.date && <p className="error-message">{errors.date.message}</p>}
          </div>
          <div>
            <label htmlFor="timeSlotId" className="custom-label">Time Slot</label>
            <select id="timeSlotId" {...register("timeSlotId")} className="custom-select">
              <option value="">Select a time slot</option>
              {MOCK_TIME_SLOTS.map((slot: TimeSlot) => (
                <option key={slot.id} value={slot.id}>{slot.displayTime}</option>
              ))}
            </select>
            {errors.timeSlotId && <p className="error-message">{errors.timeSlotId.message}</p>}
          </div>
        </div>

        <div>
          <label htmlFor="purpose" className="custom-label">Purpose of Booking</label>
          <textarea
            id="purpose"
            placeholder="e.g., Conducting experiments..."
            {...register("purpose")}
            className="custom-input" // Assuming custom-input styles min-height
            style={{minHeight: '80px', resize: 'vertical'}}
          />
          {errors.purpose && <p className="error-message">{errors.purpose.message}</p>}
        </div>
        
        <div>
          <label className="custom-label" style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
            <Package style={{height: '1.25rem', width: '1.25rem', color: '#007BFF'}} />
            Required Equipment (Optional)
          </label>
          {availableEquipment.length > 0 ? (
            <div style={{maxHeight: '150px', overflowY: 'auto', border: '1px solid #ccc', padding: '0.5rem', borderRadius: '4px'}}>
              {availableEquipment.map((item) => (
                <div key={item.id} style={{display: 'flex', alignItems: 'center', marginBottom: '0.5rem'}}>
                  <input
                    type="checkbox"
                    id={`equip-${item.id}`}
                    value={item.id}
                    {...register("equipmentIds")}
                    style={{marginRight: '0.5rem'}}
                  />
                  <label htmlFor={`equip-${item.id}`} style={{fontWeight: 'normal'}}>
                    {item.name} ({item.type})
                  </label>
                </div>
              ))}
            </div>
          ) : (
            <p style={{fontSize: '0.875rem', color: '#666'}}>No specific equipment available.</p>
          )}
        </div>
        <div className="custom-card-footer" style={{paddingTop: '1rem'}}>
          <button type="submit" disabled={isSubmitting} className="custom-button custom-button-primary" style={{width: '100%'}}>
            {isSubmitting && <Loader2 style={{marginRight: '0.5rem'}} className="animate-spin"/>}
            Submit Booking Request
          </button>
        </div>
      </form>
      {/* AvailabilitySuggestionsDialog would be here, if implemented without ShadCN */}
    </div>
  );
}
