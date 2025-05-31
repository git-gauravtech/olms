
// --- API Configuration ---
// Base URL for all backend API calls.
const API_BASE_URL_CONST = '/api'; 

// --- User Roles ---
// Defines the set of user roles available in the system.
// Used for role-based access control and UI customization.
const USER_ROLES_OBJ = {
  ADMIN: 'Admin',
  FACULTY: 'Faculty',
  STUDENT: 'Student',
  ASSISTANT: 'Assistant',
};
// Array of all role values, useful for validation or iteration.
const ROLES_ARRAY_CONST = Object.values(USER_ROLES_OBJ);
// Explicitly named array of role values, can be redundant with ROLES_ARRAY_CONST but used in some places.
const USER_ROLE_VALUES_CONST = Object.values(USER_ROLES_OBJ);

// --- Navigation Links ---
// Defines dashboard navigation links specific to each user role.
// Each link has a destination URL (href), display label, and an optional Lucide icon name.
const NAV_LINKS_OBJ = {
  [USER_ROLES_OBJ.ADMIN]: [
    { href: 'admin.html', label: 'Admin Dashboard', icon: 'layout-dashboard' },
    { href: 'admin_academic_structure.html', label: 'Academic Structure', icon: 'book-open' },
    { href: 'admin_manage_labs.html', label: 'Manage Labs', icon: 'settings-2' },
    { href: 'admin_manage_equipment.html', label: 'Manage Equipment', icon: 'wrench' },
    { href: 'admin_faculty_requests.html', label: 'Faculty Requests', icon: 'user-check' },
    { href: 'admin_manage_users.html', label: 'User Management', icon: 'users' },
    { href: 'labs.html', label: 'Lab Availability', icon: 'flask-conical' },
    { href: 'admin_run_algorithms.html', label: 'Run Optimization Algorithms', icon: 'cpu' },
  ],
  [USER_ROLES_OBJ.FACULTY]: [
    { href: 'faculty.html', label: 'Faculty Dashboard', icon: 'layout-dashboard' },
    { href: 'labs.html', label: 'Lab Availability', icon: 'flask-conical' },
    { href: 'book_slot.html', label: 'Book a Slot', icon: 'calendar-plus' },
    { href: 'faculty_my_bookings.html', label: 'My Bookings', icon: 'calendar-check' },
  ],
  [USER_ROLES_OBJ.STUDENT]: [
    { href: 'student.html', label: 'Student Dashboard', icon: 'layout-dashboard' },
    { href: 'student_my_bookings.html', label: 'View Section Schedule', icon: 'calendar-check' },
    // Lab Availability direct link removed for students, they access schedule via the above page.
  ],
  [USER_ROLES_OBJ.ASSISTANT]: [
    { href: 'assistant.html', label: 'Assistant Dashboard', icon: 'layout-dashboard' },
    { href: 'labs.html', label: 'Lab Availability', icon: 'flask-conical' },
    { href: 'assistant_update_seat_status.html', label: 'Update Seat Status', icon: 'edit-3' },
  ],
};

// Defines common navigation links, currently empty but can be used for shared links like a profile page.
const COMMON_NAV_LINKS_CONST = [];

// --- Time Slots ---
// Defines the standard time slots available for booking throughout the day.
// Used by the frontend for display in forms and grids.
// 'id' should be unique and descriptive.
// 'startTime' and 'endTime' are for display logic or simple frontend calculations.
// 'displayTime' is the user-friendly representation.
const MOCK_TIME_SLOTS_CONST = [
  { id: 'ts_0800_0950', startTime: '08:00', endTime: '09:50', displayTime: '08:00 AM - 09:50 AM' },
  { id: 'ts_1010_1205', startTime: '10:10', endTime: '12:05', displayTime: '10:10 AM - 12:05 PM' },
  { id: 'ts_1205_1350', startTime: '12:05', endTime: '13:50', displayTime: '12:05 PM - 01:50 PM' },
  { id: 'ts_1410_1605', startTime: '14:10', endTime: '16:05', displayTime: '02:10 PM - 04:05 PM' },
  { id: 'ts_1605_1750', startTime: '16:05', endTime: '17:50', displayTime: '04:05 PM - 05:50 PM' },
];

// --- Date Formatting Utilities ---
/**
 * Formats a dateInput into 'YYYY-MM-DD' string (UTC).
 * Handles Date objects, date strings, or numbers (timestamps).
 * Warns if input is invalid.
 * @param {Date|string|number} dateInput - The date to format.
 * @returns {string} Formatted date string or 'N/A'/'Invalid Date'.
 */
function formatDate(dateInput) {
    if (!dateInput && dateInput !== 0) {
        // console.warn('[constants.js formatDate] Received null or undefined dateInput. Input was:', dateInput);
        return 'N/A';
    }
    let d;

    if (dateInput instanceof Date) {
        if (isNaN(dateInput.getTime())) {
            // console.warn('[constants.js formatDate] Invalid Date object passed. Input was:', dateInput);
            return 'Invalid Date Object';
        }
        d = dateInput;
    } else if (typeof dateInput === 'string' || typeof dateInput === 'number') {
        let dateString = String(dateInput);
        // Check if it's already YYYY-MM-DD and has no time component. If so, interpret as UTC.
        const hasTimeComponent = /T| \d{2}:/.test(dateString);

        if (/^\d{4}-\d{2}-\d{2}/.test(dateString) && !hasTimeComponent) {
             // It's a date-only string like "2024-03-15". Create UTC date to avoid timezone shifts.
             const [year, month, day] = dateString.substring(0,10).split('-').map(Number);
             d = new Date(Date.UTC(year, month - 1, day));
        } else {
             // It's a datetime string or timestamp, parse as is.
             d = new Date(dateString); 
             if (isNaN(d.getTime())) {
                // Attempt to re-parse if initial parsing failed, common with YYYY-MM-DD HH:MM:SS
                let modifiedDateString = dateString.substring(0,10).replace(/-/g, '/') + dateString.substring(10);
                d = new Date(modifiedDateString + (hasTimeComponent || modifiedDateString.includes('Z') ? '' : 'T00:00:00Z')); // Append Z for UTC if not present
                if (isNaN(d.getTime())) {
                    // console.warn('[constants.js formatDate] Could not parse date string/number. Input was:', dateInput, 'Attempted parsing:', modifiedDateString);
                    return 'Invalid Date String/Number';
                }
            }
        }
    } else {
        // console.warn('[constants.js formatDate] Invalid dateInput type. Input was:', dateInput, 'Type:', typeof dateInput);
        return 'Invalid Date Type';
    }

    const year = d.getUTCFullYear();
    const month = String(d.getUTCMonth() + 1).padStart(2, '0');
    const day = String(d.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * Formats a dateInput for user display (e.g., 'Sep 10, 2024').
 * Handles Date objects or date strings.
 * Attempts to interpret date-only strings as UTC to prevent timezone-related day shifts.
 * Warns if input is invalid.
 * @param {Date|string} dateInput - The date to format for display.
 * @returns {string} Formatted date string or 'Invalid Date'.
 */
function formatDateForDisplay(dateInput) {
    if (!dateInput && dateInput !== 0) {
        // It's okay for this to be empty if input is null/undefined, rather than 'N/A'.
        // Let the caller decide how to handle an empty string.
        // console.warn('[constants.js formatDateForDisplay] Received null or undefined dateInput. Input was:', dateInput);
        return '';
    }
    
    let dateToFormat;
    if (dateInput instanceof Date) {
        if (isNaN(dateInput.getTime())) {
            // console.warn('[constants.js formatDateForDisplay] Invalid Date object. Input:', dateInput);
            return 'Invalid Date';
        }
        dateToFormat = dateInput;
    } else {
        // Attempt to parse the string.
        // If it's just YYYY-MM-DD, treat it as UTC to avoid timezone issues for display.
        let dateStringToParse = String(dateInput);
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateStringToParse)) { // Check if it's only YYYY-MM-DD
            const [year, month, day] = dateStringToParse.split('-').map(Number);
            dateToFormat = new Date(Date.UTC(year, month - 1, day));
        } else {
            // If it includes time or 'Z', parse normally.
            // Replace '-' with '/' in date part for broader compatibility if not ISO8601 with 'T'.
            if (dateStringToParse.includes('T')) {
                 dateToFormat = new Date(dateStringToParse);
            } else {
                 // For 'YYYY-MM-DD HH:MM:SS' or similar, replace date hyphens.
                 dateToFormat = new Date(dateStringToParse.replace(/-/g, '/'));
            }
        }
        if (isNaN(dateToFormat.getTime())) {
            // console.warn('[constants.js formatDateForDisplay] Invalid date string resulted in Invalid Date. Original input:', dateInput, 'Parsed as:', dateStringToParse);
            return 'Invalid Date';
        }
    }
    
    // Display in a user-friendly format.
    // If the original input was a date-only string and we created a UTC date, specify UTC timezone for toLocaleDateString
    // to prevent it from shifting to the local timezone for display.
    return dateToFormat.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric',
        // Check if the dateToFormat object was created as UTC at midnight (common for date-only strings)
        timeZone: dateToFormat.toISOString().endsWith('00:00:00.000Z') && /^\d{4}-\d{2}-\d{2}$/.test(String(dateInput)) ? 'UTC' : undefined 
    });
};

// --- Weekdays ---
// Standard array of weekday names, used for display in calendars/grids.
const DAYS_OF_WEEK_CONST = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// --- Academic Departments ---
// Standard list of academic departments for user profiles, courses, etc.
const DEPARTMENTS_CONST = [
  'CSE (Computer Science & Engineering)', 'IT (Information Technology)', 'ECE (Electronics & Communication Engineering)',
  'MECH (Mechanical Engineering)', 'CIVIL (Civil Engineering)', 'EEE (Electrical & Electronics Engineering)',
  'BIO (Biological Sciences & Bioengineering)', 'CHEM (Chemistry)', 'PHYS (Physics)', 'MATH (Mathematics & Statistics)',
  'Other',
];

// --- Equipment & Booking Statuses ---
// Defines possible statuses for equipment items.
const EQUIPMENT_STATUSES_CONST = ['available', 'in-use', 'maintenance', 'broken'];
// Defines possible statuses for booking requests.
const BOOKING_STATUSES_ARRAY_CONST = ['pending', 'booked', 'rejected', 'cancelled', 'pending-admin-approval', 'approved-by-admin', 'rejected-by-admin'];

// --- Global Exposure ---
// Expose constants and utility functions to the window object for global access in other scripts.
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
} else {
    // This case should ideally not happen in a browser environment.
    console.error('[constants.js] CRITICAL: window object not found. Constants cannot be set globally.');
}
    