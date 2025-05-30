
// Global constants for the application
console.log('[constants.js] Script start.');

// API_BASE_URL_CONST should be absolute for separate frontend/backend servers
// If served from same origin, can be relative like '/api'
const API_BASE_URL_CONST = '/api'; // Backend now serves frontend
console.log(`[constants.js] API_BASE_URL_CONST set to: ${API_BASE_URL_CONST}`);

const USER_ROLES_OBJ = {
  ADMIN: 'Admin',
  FACULTY: 'Faculty',
  STUDENT: 'Student',
  ASSISTANT: 'Assistant',
};
const ROLES_ARRAY_CONST = Object.values(USER_ROLES_OBJ);
const USER_ROLE_VALUES_CONST = Object.values(USER_ROLES_OBJ); // For role dropdowns

const NAV_LINKS_OBJ = {
  [USER_ROLES_OBJ.ADMIN]: [
    { href: 'admin.html', label: 'Admin Dashboard', icon: 'layout-dashboard' },
    { href: 'admin_manage_labs.html', label: 'Manage Labs', icon: 'settings-2' },
    { href: 'admin_manage_equipment.html', label: 'Manage Equipment', icon: 'wrench' },
    { href: 'admin_faculty_requests.html', label: 'Faculty Requests', icon: 'user-check' },
    { href: 'admin_manage_users.html', label: 'User Management', icon: 'users' },
    { href: 'labs.html', label: 'Lab Availability', icon: 'flask-conical' },
    { href: 'admin_run_algorithms.html', label: 'Run Optimization Algorithms', icon: 'cpu' },
    // Removed "System Overview & Reports"
    // Removed "View All Bookings" as standalone - Admins use labs.html
    // Removed "Assistant Requests" as this feature was removed
  ],
  [USER_ROLES_OBJ.FACULTY]: [
    { href: 'faculty.html', label: 'Faculty Dashboard', icon: 'layout-dashboard' },
    { href: 'labs.html', label: 'Lab Availability', icon: 'flask-conical' },
    { href: 'book_slot.html', label: 'Book a Slot', icon: 'calendar-plus' },
    { href: 'faculty_my_bookings.html', label: 'My Bookings', icon: 'calendar-check' },
  ],
  [USER_ROLES_OBJ.STUDENT]: [
    { href: 'student.html', label: 'Student Dashboard', icon: 'layout-dashboard' },
    { href: 'student_my_bookings.html', label: 'My Schedule', icon: 'calendar-check' },
    { href: 'labs.html', label: 'View Lab Availability', icon: 'flask-conical' },
  ],
  [USER_ROLES_OBJ.ASSISTANT]: [
    { href: 'assistant.html', label: 'Assistant Dashboard', icon: 'layout-dashboard' },
    { href: 'labs.html', label: 'Lab Availability', icon: 'flask-conical' },
    { href: 'assistant_update_seat_status.html', label: 'Update Seat Status', icon: 'edit-3' },
    // "Request Lab Slot" was removed
    // "View My Schedule" is covered by student_my_bookings.html
  ],
};

const COMMON_NAV_LINKS_CONST = [
  // Profile is accessed via user dropdown in header, not a direct sidebar link.
];

const MOCK_TIME_SLOTS_CONST = [
  { id: 'ts_0800_0900', startTime: '08:00', endTime: '09:00', displayTime: '08:00 AM - 09:00 AM' },
  { id: 'ts_0900_1000', startTime: '09:00', endTime: '10:00', displayTime: '09:00 AM - 10:00 AM' },
  { id: 'ts_1000_1100', startTime: '10:00', endTime: '11:00', displayTime: '10:00 AM - 11:00 AM' },
  { id: 'ts_1100_1200', startTime: '11:00', endTime: '12:00', displayTime: '11:00 AM - 12:00 PM' },
  { id: 'ts_1200_1300', startTime: '12:00', endTime: '13:00', displayTime: '12:00 PM - 01:00 PM' },
  { id: 'ts_1300_1400', startTime: '13:00', endTime: '14:00', displayTime: '01:00 PM - 02:00 PM' },
  { id: 'ts_1400_1500', startTime: '14:00', endTime: '15:00', displayTime: '02:00 PM - 03:00 PM' },
  { id: 'ts_1500_1600', startTime: '15:00', endTime: '16:00', displayTime: '03:00 PM - 04:00 PM' },
  { id: 'ts_1600_1700', startTime: '16:00', endTime: '17:00', displayTime: '04:00 PM - 05:00 PM' },
  { id: 'ts_1700_1800', startTime: '17:00', endTime: '18:00', displayTime: '05:00 PM - 06:00 PM' },
];

function formatDate(dateInput) {
    if (!dateInput && dateInput !== 0) {
        // console.warn('[constants.js] formatDate: Received null or undefined dateInput.');
        return 'N/A';
    }
    let d;

    if (dateInput instanceof Date) {
        if (isNaN(dateInput.getTime())) {
            // console.warn('[constants.js] formatDate: Invalid Date object passed', dateInput);
            return 'Invalid Date Object';
        }
        d = dateInput;
    } else if (typeof dateInput === 'string' || typeof dateInput === 'number') {
        // For YYYY-MM-DD strings, creating new Date(dateString) can lead to timezone issues.
        // Safter to parse manually or use UTC. For YYYY-MM-DD, we can split.
        let dateString = String(dateInput);
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) { // Matches YYYY-MM-DD
             const [year, month, day] = dateString.split('-').map(Number);
             d = new Date(Date.UTC(year, month - 1, day)); // Use UTC to avoid timezone shifts
        } else { // Attempt to parse other string formats, or if it includes time
             d = new Date(dateString);
             if (isNaN(d.getTime())) {
                d = new Date(dateString.replace(/-/g, '/') + 'T00:00:00Z'); // Fallback for broader compatibility
                if (isNaN(d.getTime())) {
                    // console.warn('[constants.js] formatDate: Invalid Date String/Number after attempts', dateInput);
                    return 'Invalid Date String/Number';
                }
            }
        }
    } else {
        // console.warn('[constants.js] formatDate: Invalid Date Type', typeof dateInput, dateInput);
        return 'Invalid Date Type';
    }

    const year = d.getUTCFullYear();
    const month = String(d.getUTCMonth() + 1).padStart(2, '0'); // Months are 0-indexed
    const day = String(d.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function formatDateForDisplay(dateInput) {
    if (!dateInput) return '';
    const d = dateInput instanceof Date ? dateInput : new Date(String(dateInput).replace(/-/g, '/')); // Replace for wider compatibility
    if (isNaN(d.getTime())) return 'Invalid Date';
    
    // Use UTC methods to avoid timezone shifts during formatting for display
    const year = d.getUTCFullYear();
    const monthIndex = d.getUTCMonth();
    const day = d.getUTCDate();

    const tempDate = new Date(Date.UTC(year, monthIndex, day)); 
    return tempDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
};


const DAYS_OF_WEEK_CONST = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const DEPARTMENTS_CONST = [
  'CSE (Computer Science & Engineering)',
  'IT (Information Technology)',
  'ECE (Electronics & Communication Engineering)',
  'MECH (Mechanical Engineering)',
  'CIVIL (Civil Engineering)',
  'EEE (Electrical & Electronics Engineering)',
  'BIO (Biological Sciences & Bioengineering)',
  'CHEM (Chemistry)',
  'PHYS (Physics)',
  'MATH (Mathematics & Statistics)',
  'Other',
];

const EQUIPMENT_STATUSES_CONST = ['available', 'in-use', 'maintenance', 'broken'];
const BOOKING_STATUSES_ARRAY_CONST = ['pending', 'booked', 'rejected', 'cancelled', 'pending-admin-approval', 'approved-by-admin', 'rejected-by-admin'];


console.log('[constants.js] Assigning constants to window object...');
if (typeof window !== 'undefined') {
    window.API_BASE_URL = API_BASE_URL_CONST;
    // console.log('[constants.js] window.API_BASE_URL set to:', window.API_BASE_URL);

    window.USER_ROLES = USER_ROLES_OBJ;
    // console.log('[constants.js] window.USER_ROLES set to:', window.USER_ROLES);

    window.ROLES_ARRAY = ROLES_ARRAY_CONST;
    window.USER_ROLE_VALUES = USER_ROLE_VALUES_CONST; // For role dropdowns

    window.NAV_LINKS = NAV_LINKS_OBJ;
    // console.log('[constants.js] window.NAV_LINKS set.');

    window.COMMON_NAV_LINKS = COMMON_NAV_LINKS_CONST;
    window.MOCK_TIME_SLOTS = MOCK_TIME_SLOTS_CONST;
    window.DAYS_OF_WEEK = DAYS_OF_WEEK_CONST;
    window.DEPARTMENTS = DEPARTMENTS_CONST;
    window.EQUIPMENT_STATUSES = EQUIPMENT_STATUSES_CONST;
    window.BOOKING_STATUSES_ARRAY = BOOKING_STATUSES_ARRAY_CONST;
    window.formatDate = formatDate;
    window.formatDateForDisplay = formatDateForDisplay;
    console.log('[constants.js] All constants assigned to window.');
} else {
    console.error('[constants.js] CRITICAL: window object not found. This script is intended for browser environment.');
}
console.log('[constants.js] Script end.');
