
// --- API Configuration ---
const API_BASE_URL_CONST = '/api'; // Adjust if your backend runs on a different port/host during development

// --- User Roles ---
const USER_ROLES_OBJ = {
  ADMIN: 'Admin',
  FACULTY: 'Faculty',
  STUDENT: 'Student',
  ASSISTANT: 'Assistant',
};
const ROLES_ARRAY_CONST = Object.values(USER_ROLES_OBJ);

// --- Navigation Links ---
// Will be populated by dashboard.js based on role
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
    { href: 'student_my_bookings.html', label: 'View Section Schedule', icon: 'calendar-days' },
  ],
  [USER_ROLES_OBJ.ASSISTANT]: [
    { href: 'assistant.html', label: 'Assistant Dashboard', icon: 'layout-dashboard' },
    { href: 'labs.html', label: 'Lab Availability', icon: 'flask-conical' },
    { href: 'assistant_update_seat_status.html', label: 'Update Seat Status', icon: 'edit-3' },
  ],
};
const COMMON_NAV_LINKS_CONST = [
    // Example: { href: 'profile.html', label: 'My Profile', icon: 'user-circle' }
];


// --- Time Slots ---
// Used by frontend for display in forms and grids. Ensure these IDs match backend expectations.
const MOCK_TIME_SLOTS_CONST = [
  { id: 'ts_0800_0950', startTime: '08:00', endTime: '09:50', displayTime: '08:00 AM - 09:50 AM' },
  { id: 'ts_1010_1205', startTime: '10:10', endTime: '12:05', displayTime: '10:10 AM - 12:05 PM' },
  { id: 'ts_1205_1350', startTime: '12:05', endTime: '13:50', displayTime: '12:05 PM - 01:50 PM' },
  { id: 'ts_1410_1605', startTime: '14:10', endTime: '16:05', displayTime: '02:10 PM - 04:05 PM' },
  { id: 'ts_1605_1750', startTime: '16:05', endTime: '17:50', displayTime: '04:05 PM - 05:50 PM' },
];

// --- Weekdays ---
const DAYS_OF_WEEK_CONST = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']; // Or ['Sun', 'Mon', ..., 'Sat'] depending on preference

// --- Academic Departments ---
const DEPARTMENTS_CONST = [
  'CSE (Computer Science & Engineering)', 'IT (Information Technology)', 'ECE (Electronics & Communication Engineering)',
  'MECH (Mechanical Engineering)', 'CIVIL (Civil Engineering)', 'EEE (Electrical & Electronics Engineering)',
  'BIO (Biological Sciences & Bioengineering)', 'CHEM (Chemistry)', 'PHYS (Physics)', 'MATH (Mathematics & Statistics)',
  'Other',
];

// --- Equipment & Booking Statuses ---
const EQUIPMENT_STATUSES_CONST = ['available', 'in-use', 'maintenance', 'broken'];
const BOOKING_STATUSES_ARRAY_CONST = ['pending', 'booked', 'rejected', 'cancelled', 'pending-admin-approval', 'approved-by-admin', 'rejected-by-admin'];


// --- Global Exposure ---
if (typeof window !== 'undefined') {
    window.API_BASE_URL = API_BASE_URL_CONST;
    window.USER_ROLES = USER_ROLES_OBJ;
    window.USER_ROLE_VALUES = Object.values(USER_ROLES_OBJ); // For signup dropdown if needed
    window.NAV_LINKS = NAV_LINKS_OBJ;
    window.COMMON_NAV_LINKS = COMMON_NAV_LINKS_CONST;
    window.MOCK_TIME_SLOTS = MOCK_TIME_SLOTS_CONST;
    window.DAYS_OF_WEEK = DAYS_OF_WEEK_CONST;
    window.DEPARTMENTS = DEPARTMENTS_CONST;
    window.EQUIPMENT_STATUSES = EQUIPMENT_STATUSES_CONST;
    window.BOOKING_STATUSES_ARRAY = BOOKING_STATUSES_ARRAY_CONST;

    // Date Formatting Utilities (as provided before)
    window.formatDate = function(dateInput) {
        if (!dateInput && dateInput !== 0) return 'N/A';
        let d;
        if (dateInput instanceof Date) {
            if (isNaN(dateInput.getTime())) return 'Invalid Date Object';
            d = dateInput;
        } else if (typeof dateInput === 'string' || typeof dateInput === 'number') {
            let dateString = String(dateInput);
            const hasTimeComponent = /T| \d{2}:/.test(dateString);
            if (/^\d{4}-\d{2}-\d{2}/.test(dateString) && !hasTimeComponent) {
                 const [year, month, day] = dateString.substring(0,10).split('-').map(Number);
                 d = new Date(Date.UTC(year, month - 1, day));
            } else {
                 d = new Date(dateString); 
                 if (isNaN(d.getTime())) {
                    let modifiedDateString = dateString.substring(0,10).replace(/-/g, '/') + dateString.substring(10);
                    d = new Date(modifiedDateString + (hasTimeComponent || modifiedDateString.includes('Z') ? '' : 'T00:00:00Z'));
                    if (isNaN(d.getTime())) return 'Invalid Date String/Number';
                }
            }
        } else {
            return 'Invalid Date Type';
        }
        const year = d.getUTCFullYear();
        const month = String(d.getUTCMonth() + 1).padStart(2, '0');
        const day = String(d.getUTCDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    window.formatDateForDisplay = function(dateInput) {
        if (!dateInput && dateInput !== 0) return '';
        let dateToFormat;
        if (dateInput instanceof Date) {
            if (isNaN(dateInput.getTime())) return 'Invalid Date';
            dateToFormat = dateInput;
        } else {
            let dateStringToParse = String(dateInput);
            if (/^\d{4}-\d{2}-\d{2}$/.test(dateStringToParse)) {
                const [year, month, day] = dateStringToParse.split('-').map(Number);
                dateToFormat = new Date(Date.UTC(year, month - 1, day));
            } else {
                if (dateStringToParse.includes('T')) {
                     dateToFormat = new Date(dateStringToParse);
                } else {
                     dateToFormat = new Date(dateStringToParse.replace(/-/g, '/'));
                }
            }
            if (isNaN(dateToFormat.getTime())) return 'Invalid Date';
        }
        return dateToFormat.toLocaleDateString('en-US', { 
            month: 'short', day: 'numeric', year: 'numeric',
            timeZone: dateToFormat.toISOString().endsWith('00:00:00.000Z') && /^\d{4}-\d{2}-\d{2}$/.test(String(dateInput)) ? 'UTC' : undefined 
        });
    };
}
