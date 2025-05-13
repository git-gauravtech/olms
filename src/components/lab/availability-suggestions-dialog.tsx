import React from "react";
import { suggestAlternativeSlots, SuggestAlternativeSlotsInput, SuggestAlternativeSlotsOutput } from "@/ai/flows/availability-suggestions";
import { Loader2 } from "lucide-react"; // Assuming lucide-react is kept

// Basic styling for the dialog - move to CSS for a real app
const dialogOverlayStyle: React.CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0,0,0,0.5)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 100,
};

const dialogContentStyle: React.CSSProperties = {
  backgroundColor: 'white',
  padding: '20px',
  borderRadius: '8px',
  minWidth: '300px',
  maxWidth: '425px', // sm:max-w-[425px]
  boxShadow: '0 0 10px rgba(0,0,0,0.25)',
};

const dialogHeaderStyle: React.CSSProperties = { marginBottom: '1rem' };
const dialogTitleStyle: React.CSSProperties = { fontSize: '1.25rem', fontWeight: 'bold' };
const dialogDescStyle: React.CSSProperties = { fontSize: '0.875rem', color: '#555', marginBottom: '1rem' };
const dialogFooterStyle: React.CSSProperties = { marginTop: '1.5rem', textAlign: 'right' as 'right' };
const buttonStyle: React.CSSProperties = { padding: '0.5rem 1rem', borderRadius: '4px', border: '1px solid #ccc', cursor: 'pointer', marginLeft: '0.5rem' };
const suggestionItemStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem', border: '1px solid #eee', borderRadius: '4px', marginBottom: '0.5rem' };


interface AvailabilitySuggestionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  labName: string;
  preferredSlot: string;
  onSlotSelect: (slot: string) => void;
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

  React.useEffect(() => {
    if (open) {
      fetchSuggestions();
    } else {
      setSuggestions(null);
      setIsLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const fetchSuggestions = async () => {
    setIsLoading(true);
    setSuggestions(null);
    try {
      const mockBookingPatterns = `${labName} is popular. Consider off-peak hours.`;
      const input: SuggestAlternativeSlotsInput = { labName, preferredSlot, bookingPatterns: mockBookingPatterns };
      const result = await suggestAlternativeSlots(input);
      setSuggestions(result);
    } catch (error) {
      console.error("Error fetching suggestions:", error);
      window.alert("Could not fetch alternative slot suggestions.");
      onOpenChange(false);
    } finally {
      setIsLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div style={dialogOverlayStyle} onClick={() => onOpenChange(false)}>
      <div style={dialogContentStyle} onClick={(e) => e.stopPropagation()}>
        <div style={dialogHeaderStyle}>
          <h3 style={dialogTitleStyle}>Alternative Slot Suggestions</h3>
          <p style={dialogDescStyle}>
            The slot <strong style={{fontWeight: 'bold'}}>{preferredSlot}</strong> for <strong style={{fontWeight: 'bold'}}>{labName}</strong> is unavailable. Here are some AI-powered suggestions:
          </p>
        </div>
        <div style={{padding: '1rem 0'}}>
          {isLoading && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
              <Loader2 style={{ height: '1.5rem', width: '1.5rem' }} className="animate-spin" />
              <p>Finding alternative slots...</p>
            </div>
          )}
          {!isLoading && suggestions && (
            <div>
              <h4 style={{fontWeight: '500', marginBottom: '0.5rem'}}>Suggested Slots:</h4>
              {suggestions.suggestedSlots.length > 0 ? (
                <ul style={{listStyle: 'none', padding: 0}}>
                  {suggestions.suggestedSlots.map((slot, index) => (
                    <li key={index} style={suggestionItemStyle}>
                      <span>{slot}</span>
                      <button style={{...buttonStyle, backgroundColor: 'transparent', borderColor: '#007BFF', color: '#007BFF'}} onClick={() => {
                        onSlotSelect(slot);
                        onOpenChange(false);
                      }}>
                        Select
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p style={{color: '#6c757d'}}>No alternative slots found.</p>
              )}
              <p style={{fontSize: '0.875rem', color: '#6c757d', paddingTop: '0.5rem'}}>
                <strong>Reasoning:</strong> {suggestions.reasoning}
              </p>
            </div>
          )}
           {!isLoading && !suggestions && !open && ( // Added !open to ensure it doesn't flash
            <p style={{textAlign: 'center', color: '#6c757d'}}>Could not load suggestions.</p>
          )}
        </div>
        <div style={dialogFooterStyle}>
          <button style={{...buttonStyle, backgroundColor: 'transparent'}} onClick={() => onOpenChange(false)}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
