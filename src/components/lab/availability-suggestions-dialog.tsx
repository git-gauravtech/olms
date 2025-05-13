"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { suggestAlternativeSlots, SuggestAlternativeSlotsInput, SuggestAlternativeSlotsOutput } from "@/ai/flows/availability-suggestions";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface AvailabilitySuggestionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  labName: string;
  preferredSlot: string; // e.g., "Monday 09:00-10:00"
  onSlotSelect: (slot: string) => void; // Callback when a suggested slot is selected
}

export function AvailabilitySuggestionsDialog({
  open,
  onOpenChange,
  labName,
  preferredSlot,
  onSlotSelect,
}: AvailabilitySuggestionsDialogProps) {
  const [isLoading, setIsLoading] = React.useState(false);
  const [suggestions, setSuggestions] = React.useState<SuggestAlternativeSlotsOutput | null>(null);
  const { toast } = useToast();

  React.useEffect(() => {
    if (open) {
      fetchSuggestions();
    } else {
      // Reset state when dialog is closed
      setSuggestions(null);
      setIsLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]); // Only re-run when `open` changes

  const fetchSuggestions = async () => {
    setIsLoading(true);
    setSuggestions(null); // Clear previous suggestions
    try {
      // Mock booking patterns; in a real app, this would come from a database
      const mockBookingPatterns = `
        - ${labName} is heavily booked on Mondays and Wednesdays.
        - Tuesdays and Thursdays have more availability in the afternoons.
        - Fridays are generally light.
        - Peak hours are 10:00 AM - 02:00 PM.
      `;
      
      const input: SuggestAlternativeSlotsInput = {
        labName,
        preferredSlot,
        bookingPatterns: mockBookingPatterns,
      };
      const result = await suggestAlternativeSlots(input);
      setSuggestions(result);
    } catch (error) {
      console.error("Error fetching availability suggestions:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not fetch alternative slot suggestions. Please try again later.",
      });
      onOpenChange(false); // Close dialog on error
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Alternative Slot Suggestions</DialogTitle>
          <DialogDescription>
            The slot <span className="font-semibold">{preferredSlot}</span> for <span className="font-semibold">{labName}</span> is unavailable. Here are some AI-powered suggestions:
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          {isLoading && (
            <div className="flex items-center justify-center space-x-2">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <p>Finding alternative slots...</p>
            </div>
          )}
          {!isLoading && suggestions && (
            <div className="space-y-3">
              <h4 className="font-medium">Suggested Slots:</h4>
              {suggestions.suggestedSlots.length > 0 ? (
                <ul className="space-y-2">
                  {suggestions.suggestedSlots.map((slot, index) => (
                    <li key={index} className="flex justify-between items-center p-2 border rounded-md">
                      <span>{slot}</span>
                      <Button variant="outline" size="sm" onClick={() => {
                        onSlotSelect(slot);
                        onOpenChange(false);
                      }}>
                        Select
                      </Button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted-foreground">No alternative slots could be found based on current patterns.</p>
              )}
              <p className="text-sm text-muted-foreground pt-2">
                <strong>Reasoning:</strong> {suggestions.reasoning}
              </p>
            </div>
          )}
           {!isLoading && !suggestions && (
            <p className="text-center text-muted-foreground">Could not load suggestions.</p>
          )}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
