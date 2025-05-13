import React from "react";
import { useNavigate } from "react-router-dom";
import { MOCK_LABS, MOCK_TIME_SLOTS, DAYS_OF_WEEK, MOCK_BOOKINGS, MOCK_EQUIPMENT } from "@/constants";
import type { Lab, TimeSlot, Booking, UserRole } from "@/types";
import { USER_ROLES } from "@/types";
import { format, addDays, startOfWeek } from "date-fns";
import { Edit } from "lucide-react"; // Keep lucide icon

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
  currentUserRole: UserRole | null;
}

// Basic styles - move to a CSS file for a real app
const gridContainerStyle: React.CSSProperties = { overflowX: 'auto', border: '1px solid #ccc', borderRadius: '8px', backgroundColor: 'white', padding: '0.5rem' };
const gridStyle: React.CSSProperties = { display: 'grid', gap: '1px', backgroundColor: '#ccc' }; // Use background for grid lines
const cellStyle: React.CSSProperties = { 
    padding: '0.5rem', 
    textAlign: 'center', 
    minHeight: '60px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    fontSize: '0.75rem',
    cursor: 'pointer',
    backgroundColor: 'white', // Default cell background
    transition: 'filter 0.2s',
};
const headerCellStyle: React.CSSProperties = { ...cellStyle, fontWeight: 'bold', backgroundColor: '#f8f9fa', cursor: 'default' };
const timeCellStyle: React.CSSProperties = { ...headerCellStyle, writingMode: 'vertical-rl', textOrientation: 'mixed', whiteSpace: 'nowrap', justifyContent: 'center', minWidth: '50px', padding: '0.25rem'};

const getStatusBgColor = (status: SlotStatus['status']) => {
  switch (status) {
    case 'available': return '#d4edda'; // Light green (accent)
    case 'booked': return '#f8d7da'; // Light red (destructive)
    case 'pending': return '#fff3cd'; // Light yellow (secondary)
    case 'past': return '#e9ecef'; // Light gray (muted)
    default: return 'white';
  }
};

// Dialog styles
const dialogOverlayStyle: React.CSSProperties = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 };
const dialogContentStyle: React.CSSProperties = { backgroundColor: 'white', padding: '20px', borderRadius: '8px', minWidth: '300px', maxWidth: '500px', boxShadow: '0 0 10px rgba(0,0,0,0.25)' };
const dialogHeaderStyle: React.CSSProperties = { marginBottom: '1rem' };
const dialogTitleStyle: React.CSSProperties = { fontSize: '1.25rem', fontWeight: 'bold' };
const dialogDescStyle: React.CSSProperties = { fontSize: '0.875rem', color: '#555', marginBottom: '1rem' };
const dialogFooterStyle: React.CSSProperties = { marginTop: '1.5rem', display: 'flex', justifyContent: 'space-between', gap: '0.5rem', flexWrap: 'wrap' };
const dialogButtonStyle: React.CSSProperties = { padding: '0.5rem 1rem', borderRadius: '4px', border: '1px solid #ccc', cursor: 'pointer' };


export function LabAvailabilityGrid() {
  const navigate = useNavigate();
  const [selectedLab, setSelectedLab] = React.useState<Lab | null>(MOCK_LABS[0]);
  const [weekStartDate, setWeekStartDate] = React.useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [isSlotDetailDialogOpen, setIsSlotDetailDialogOpen] = React.useState(false);
  const [selectedSlotDetails, setSelectedSlotDetails] = React.useState<SelectedSlotDetails | null>(null);
  const [currentUserRole, setCurrentUserRole] = React.useState<UserRole | null>(null);

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const role = localStorage.getItem('userRole') as UserRole | null;
      setCurrentUserRole(role);
    }
  }, []);

  const getSlotStatus = (dayIndex: number, timeSlot: TimeSlot): SlotStatus => {
    const currentDate = addDays(weekStartDate, dayIndex);
    const formattedDate = format(currentDate, "yyyy-MM-dd");
    const [hours, minutes] = timeSlot.startTime.split(':').map(Number);
    const slotDateTime = new Date(currentDate);
    slotDateTime.setHours(hours, minutes, 0, 0);
    const now = new Date();

    if (slotDateTime < now && format(slotDateTime, 'yyyy-MM-dd') <= format(new Date(), 'yyyy-MM-dd')) {
      if (format(currentDate,"yyyy-MM-dd") < format(now, "yyyy-MM-dd") || (format(currentDate,"yyyy-MM-dd") === format(now, "yyyy-MM-dd") && slotDateTime < now)) {
        return { status: 'past' };
      }
    }
    
    const booking = MOCK_BOOKINGS.find(
      (b) => b.labId === selectedLab?.id && b.date === formattedDate && b.timeSlotId === timeSlot.id && b.status !== 'cancelled'
    );
    if (booking) return { status: booking.status as 'booked' | 'pending', booking };
    return { status: 'available' };
  };

  const handleSlotClick = (day: string, dayIndex: number, timeSlot: TimeSlot, statusInfo: SlotStatus) => {
    if (!selectedLab || statusInfo.status === 'past') return;
    const slotDate = addDays(weekStartDate, dayIndex);
    setSelectedSlotDetails({
      labName: selectedLab.name,
      slotDesc: `${timeSlot.displayTime} on ${format(slotDate, "EEE, MMM d")}`,
      statusInfo, date: slotDate, timeSlot, day, currentUserRole,
    });
    setIsSlotDetailDialogOpen(true);
  };
  
  const handleRequestReschedule = () => {
    if (!selectedSlotDetails) return;
    window.alert(`Reschedule requested for ${selectedSlotDetails.labName} on ${format(selectedSlotDetails.date, "PPP")} at ${selectedSlotDetails.timeSlot.displayTime}. Admin will review.`);
    setIsSlotDetailDialogOpen(false);
  };

  const gridTemplateColumns = `minmax(80px, auto) repeat(${DAYS_OF_WEEK.length}, minmax(100px, 1fr))`;

  return (
    <div className="custom-card">
      <div className="custom-card-header">
        <h2 className="custom-card-title" style={{fontSize: '1.5rem'}}>Lab Availability Viewer</h2>
        <p className="custom-card-description">Select a lab to view its weekly schedule.</p>
        <div style={{paddingTop: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem'}}>
          <select
            value={selectedLab?.id || ""}
            onChange={(e) => setSelectedLab(MOCK_LABS.find(lab => lab.id === e.target.value) || null)}
            className="custom-select" style={{maxWidth: '300px'}}
          >
            <option value="">Select a lab</option>
            {MOCK_LABS.map((lab) => (
              <option key={lab.id} value={lab.id}>
                {lab.name} (Capacity: {lab.capacity})
              </option>
            ))}
          </select>
          <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem'}}>
            <div style={{display: 'flex', gap: '0.5rem'}}>
              <button onClick={() => setWeekStartDate(addDays(weekStartDate, -7))} className="custom-button custom-button-outline">Previous Week</button>
              <button onClick={() => setWeekStartDate(startOfWeek(new Date(), { weekStartsOn: 1 }))} className="custom-button custom-button-outline">Today</button>
              <button onClick={() => setWeekStartDate(addDays(weekStartDate, 7))} className="custom-button custom-button-outline">Next Week</button>
            </div>
            <p style={{fontSize: '0.875rem', fontWeight: 500}}>Week of: {format(weekStartDate, "MMM d, yyyy")}</p>
          </div>
        </div>
      </div>
      <div className="custom-card-content">
        {selectedLab ? (
          <div style={gridContainerStyle}>
            <div style={{ ...gridStyle, gridTemplateColumns }}>
              <div style={headerCellStyle}>Time</div>
              {DAYS_OF_WEEK.map((day, dayIndex) => (
                <div key={day} style={headerCellStyle}>
                  {day}<br/>
                  <span style={{fontSize: '0.75rem', fontWeight: 'normal'}}>{format(addDays(weekStartDate, dayIndex), "d MMM")}</span>
                </div>
              ))}
              {MOCK_TIME_SLOTS.map((timeSlot) => (
                <React.Fragment key={timeSlot.id}>
                  <div style={timeCellStyle}>{timeSlot.displayTime.replace(' - ', '\n-\n')}</div>
                  {DAYS_OF_WEEK.map((day, dayIndex) => {
                    const slotData = getSlotStatus(dayIndex, timeSlot);
                    return (
                      <div
                        key={`${day}-${timeSlot.id}`}
                        style={{
                          ...cellStyle,
                          backgroundColor: getStatusBgColor(slotData.status),
                          cursor: slotData.status === 'past' ? 'not-allowed' : 'pointer',
                          opacity: slotData.status === 'past' ? 0.7 : 1,
                        }}
                        onClick={() => handleSlotClick(day, dayIndex, timeSlot, slotData)}
                        onMouseEnter={(e) => { if(slotData.status !== 'past') e.currentTarget.style.filter = 'brightness(0.9)';}}
                        onMouseLeave={(e) => e.currentTarget.style.filter = 'brightness(1)'}
                      >
                        <span style={{fontWeight: '500', textTransform: 'capitalize'}}>{slotData.status}</span>
                        {slotData.booking && <span style={{fontSize: '0.7em', marginTop: '0.25rem',  overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical'}}>{slotData.booking.purpose}</span>}
                      </div>
                    );
                  })}
                </React.Fragment>
              ))}
            </div>
          </div>
        ) : <p>Please select a lab.</p>}
      </div>

      {isSlotDetailDialogOpen && selectedSlotDetails && (
        <div style={dialogOverlayStyle} onClick={() => setIsSlotDetailDialogOpen(false)}>
          <div style={dialogContentStyle} onClick={(e) => e.stopPropagation()}>
            <div style={dialogHeaderStyle}>
              <h3 style={dialogTitleStyle}>{selectedSlotDetails.labName} - Slot Details</h3>
              <p style={dialogDescStyle}>{selectedSlotDetails.day}, {selectedSlotDetails.slotDesc}</p>
            </div>
            <div style={{marginBottom: '1rem'}}>
              <p>Status: <span style={{fontWeight: 'bold', textTransform: 'capitalize', color: getStatusBgColor(selectedSlotDetails.statusInfo.status) === '#d4edda' ? 'green' : getStatusBgColor(selectedSlotDetails.statusInfo.status) === '#f8d7da' ? 'red' : getStatusBgColor(selectedSlotDetails.statusInfo.status) === '#fff3cd' ? 'orange' : 'gray' }}>{selectedSlotDetails.statusInfo.status}</span></p>
              {selectedSlotDetails.statusInfo.booking && (
                <>
                  <p><strong>Purpose:</strong> {selectedSlotDetails.statusInfo.booking.purpose}</p>
                  <p><strong>User/Batch:</strong> {selectedSlotDetails.statusInfo.booking.batchIdentifier || selectedSlotDetails.statusInfo.booking.userId}</p>
                  {selectedSlotDetails.statusInfo.booking.equipmentIds && selectedSlotDetails.statusInfo.booking.equipmentIds.length > 0 && (
                     <p><strong>Equipment:</strong> {MOCK_EQUIPMENT.filter(e => selectedSlotDetails.statusInfo.booking?.equipmentIds.includes(e.id)).map(e => e.name).join(', ') || 'None'}</p>
                  )}
                </>
              )}
              {selectedSlotDetails.statusInfo.status === 'past' && <p>This slot is in the past.</p>}
            </div>
            <div style={dialogFooterStyle}>
              <button style={{...dialogButtonStyle, backgroundColor: '#6c757d', color: 'white'}} onClick={() => setIsSlotDetailDialogOpen(false)}>Close</button>
              {selectedSlotDetails.statusInfo.status === 'available' && (
                <button style={{...dialogButtonStyle, backgroundColor: '#007BFF', color: 'white'}} onClick={() => {
                  navigate(`/dashboard/book-slot?labId=${selectedLab?.id}&date=${format(selectedSlotDetails.date, "yyyy-MM-dd")}&timeSlotId=${selectedSlotDetails.timeSlot.id}`);
                  setIsSlotDetailDialogOpen(false);
                }}>Book This Slot</button>
              )}
              {selectedSlotDetails.currentUserRole === USER_ROLES.FACULTY && selectedSlotDetails.statusInfo.status === 'booked' && (
                <button style={{...dialogButtonStyle, backgroundColor: '#ffc107', color: 'black'}} onClick={handleRequestReschedule}>
                  <Edit size={16} style={{marginRight: '0.5rem'}}/> Request Reschedule
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
