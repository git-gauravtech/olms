
// Global constants for the application
// console.log('[constants.js] Script start.');

// API_BASE_URL_CONST should be absolute for separate frontend/backend servers
// If served from same origin, can be relative like '/api'
const API_BASE_URL_CONST = '/api'; // Backend now serves frontend
// console.log(`[constants.js] API_BASE_URL_CONST set to: ${API_BASE_URL_CONST}`);

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
    { href: 'admin_view_activity_log.html', label: 'System Activity Log', icon: 'history' },
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
  ],
};

const COMMON_NAV_LINKS_CONST = [];


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
        console.warn('[constants.js] formatDate: Received null or undefined dateInput. Input was:', dateInput);
        return 'N/A';
    }
    let d;

    if (dateInput instanceof Date) {
        if (isNaN(dateInput.getTime())) {
            console.warn('[constants.js] formatDate: Invalid Date object passed. Input was:', dateInput);
            return 'Invalid Date Object';
        }
        d = dateInput;
    } else if (typeof dateInput === 'string' || typeof dateInput === 'number') {
        let dateString = String(dateInput);
        // Check if the string already has a time component before appending T00:00:00Z
        const hasTimeComponent = /T| \d{2}:/.test(dateString);

        if (/^\d{4}-\d{2}-\d{2}/.test(dateString) && !hasTimeComponent) { // Matches YYYY-MM-DD only
             // If it's just a date string like "YYYY-MM-DD", parse it as UTC to avoid timezone issues
             const [year, month, day] = dateString.substring(0,10).split('-').map(Number);
             d = new Date(Date.UTC(year, month - 1, day));
        } else { // Handles YYYY-MM-DDTHH:mm:ss, or other string/number inputs
             // For full ISO strings or other formats, attempt direct parsing
             d = new Date(dateString); 
             if (isNaN(d.getTime())) { // If direct parsing fails, try with common ISO fixes
                // Replace hyphens in date part only for broader compatibility if needed.
                let modifiedDateString = dateString.substring(0,10).replace(/-/g, '/') + dateString.substring(10);
                d = new Date(modifiedDateString + (hasTimeComponent || modifiedDateString.includes('Z') ? '' : 'T00:00:00Z'));
                if (isNaN(d.getTime())) {
                    console.warn('[constants.js] formatDate: Could not parse date string/number. Input was:', dateInput, 'Attempted parsing:', modifiedDateString);
                    return 'Invalid Date String/Number';
                }
            }
        }
    } else {
        console.warn('[constants.js] formatDate: Invalid dateInput type. Input was:', dateInput, 'Type:', typeof dateInput);
        return 'Invalid Date Type';
    }

    const year = d.getUTCFullYear();
    const month = String(d.getUTCMonth() + 1).padStart(2, '0');
    const day = String(d.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function formatDateForDisplay(dateInput) {
    if (!dateInput && dateInput !== 0) {
        // console.warn('[constants.js] formatDateForDisplay: Received null or undefined dateInput. Input was:', dateInput);
        return '';
    }
    
    let dateToFormat;
    if (dateInput instanceof Date) {
        if (isNaN(dateInput.getTime())) {
            console.warn('[constants.js] formatDateForDisplay: Invalid Date object. Input:', dateInput);
            return 'Invalid Date';
        }
        dateToFormat = dateInput;
    } else {
        let dateStringToParse = String(dateInput);
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateStringToParse)) { 
            // If it's strictly "YYYY-MM-DD", interpret it as a UTC date to avoid timezone shifts.
            const [year, month, day] = dateStringToParse.split('-').map(Number);
            dateToFormat = new Date(Date.UTC(year, month - 1, day));
        } else {
            // For other strings (e.g., full ISO with 'T' or 'Z'), parse directly.
            // Replace hyphens only in the date part for broader compatibility if it's not a strict ISO format.
            // Check if it looks like ISO with time: YYYY-MM-DDTHH:MM...
            if (dateStringToParse.includes('T')) {
                 dateToFormat = new Date(dateStringToParse);
            } else {
                // Fallback for other potential date-like strings, assuming local time if no timezone specified.
                // This path is less ideal; consistent ISO 8601 or YYYY-MM-DD is preferred from backend.
                 dateToFormat = new Date(dateStringToParse.replace(/-/g, '/'));
            }
        }
        if (isNaN(dateToFormat.getTime())) {
            console.warn('[constants.js] formatDateForDisplay: Invalid date string resulted in Invalid Date. Original input:', dateInput, 'Parsed as:', dateStringToParse);
            return 'Invalid Date';
        }
    }
    
    // For display, it's usually fine to use the browser's local interpretation for toLocaleDateString,
    // but if the input was YYYY-MM-DD (intended as a specific day regardless of timezone),
    // we've already converted it to a UTC Date object representing midnight UTC on that day.
    // So, using UTC methods for toLocaleDateString options is more consistent for such "day" inputs.
    return dateToFormat.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric',
        timeZone: dateToFormat.toISOString().endsWith('00:00:00.000Z') && /^\d{4}-\d{2}-\d{2}$/.test(String(dateInput)) ? 'UTC' : undefined 
        // Use UTC for display only if the original input was a pure date and we made it UTC midnight. Otherwise, use browser local.
    });
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


// console.log('[constants.js] Assigning constants to window object...');
if (typeof window !== 'undefined') {
    window.API_BASE_URL = API_BASE_URL_CONST;
    window.USER_ROLES = USER_ROLES_OBJ;
    window.ROLES_ARRAY = ROLES_ARRAY_CONST;
    window.USER_ROLE_VALUES = USER_ROLE_VALUES_CONST;
    window.NAV_LINKS = NAV_LINKS_OBJ;
    window.COMMON_NAV_LINKS = COMMON_NAV_LINKS_CONST;
    window.MOCK_TIME_SLOTS = MOCK_TIME_SLOTS_CONST;
    window.DAYS_OF_WEEK = DAYS_OF_WEEK_CONST;
    window.DEPARTMENTS = DEPARTMENTS_CONST;
    window.EQUIPMENT_STATUSES = EQUIPMENT_STATUSES_CONST;
    window.BOOKING_STATUSES_ARRAY = BOOKING_STATUSES_ARRAY_CONST;
    window.formatDate = formatDate;
    window.formatDateForDisplay = formatDateForDisplay;
    // console.log('[constants.js] All constants assigned to window.');
} else {
    console.error('[constants.js] CRITICAL: window object not found. This script is intended for browser environment.');
}
// console.log('[constants.js] Script end.');
    