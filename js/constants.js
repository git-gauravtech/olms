
// Global constants for the application
console.log('[constants.js] Script start.');

// API_BASE_URL_CONST is now relative, as frontend and backend are served from the same origin
const API_BASE_URL_CONST = '/api';
const USER_ROLES_OBJ = {
  ADMIN: 'Admin',
  FACULTY: 'Faculty',
  STUDENT: 'Student',
  ASSISTANT: 'Assistant',
};
const ROLES_ARRAY_CONST = Object.values(USER_ROLES_OBJ);
const USER_ROLE_VALUES_CONST = Object.values(USER_ROLES_OBJ); // For dropdowns

const NAV_LINKS_OBJ = {
  [USER_ROLES_OBJ.ADMIN]: [
    { href: 'admin.html', label: 'Admin Dashboard', icon: 'layout-dashboard' },
    { href: 'admin_manage_labs.html', label: 'Manage Labs', icon: 'settings-2' },
    { href: 'admin_manage_equipment.html', label: 'Manage Equipment', icon: 'wrench' },
    { href: 'admin_faculty_requests.html', label: 'Faculty Requests', icon: 'user-check' },
    { href: 'admin_manage_users.html', label: 'User Management', icon: 'users' },
    { href: 'labs.html', label: 'Lab Availability', icon: 'flask-conical' },
    { href: 'admin_run_algorithms.html', label: 'Run Optimization Algorithms', icon: 'cpu' },
    { href: 'admin_system_overview.html', label: 'System Overview & Reports', icon: 'activity' },
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
    { href: 'student_my_bookings.html', label: 'My Assigned Tasks/Bookings', icon: 'calendar-check' }, // Assistants use the same page as students for their bookings
  ],
};

const COMMON_NAV_LINKS_CONST = [
  // Profile is accessed via user dropdown in header
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
    if (!dateInput && dateInput !== 0) return '';
    let d;

    if (dateInput instanceof Date) {
        if (isNaN(dateInput.getTime())) {
            console.warn('[constants.js] formatDate: Invalid Date object passed', dateInput);
            return 'Invalid Date Value';
        }
        const year = dateInput.getUTCFullYear();
        const month = String(dateInput.getUTCMonth() + 1).padStart(2, '0');
        const day = String(dateInput.getUTCDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    } else if (typeof dateInput === 'string' || typeof dateInput === 'number') {
        const potentialDate = new Date(dateInput);
        if (!isNaN(potentialDate.getTime())) {
            const year = potentialDate.getUTCFullYear();
            const month = String(potentialDate.getUTCMonth() + 1).padStart(2, '0');
            const day = String(potentialDate.getUTCDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        } else {
            const simpleDateRegex = /^\d{4}-\d{2}-\d{2}$/;
            if (simpleDateRegex.test(String(dateInput))) {
                return String(dateInput);
            }
            console.warn('[constants.js] formatDate: Invalid Date String/Number', dateInput);
            return 'Invalid Date String/Number';
        }
    } else {
        console.warn('[constants.js] formatDate: Invalid Date Type', typeof dateInput, dateInput);
        return 'Invalid Date Type';
    }
}

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

// No longer storing MOCK data here for labs, equipment, bookings, seat statuses.
// This data is now managed by the backend.

// localStorage Keys (Versioned up)
const MOCK_BOOKINGS_STORAGE_KEY = 'mockBookingsV5'; // This key might be fully obsolete now
const LAB_SEAT_STATUSES_STORAGE_KEY = 'labSeatStatusesV4'; // This key might be fully obsolete now

console.log('[constants.js] Assigning constants to window object...');
if (typeof window !== 'undefined') {
    window.API_BASE_URL = API_BASE_URL_CONST;
    console.log('[constants.js] window.API_BASE_URL set to:', window.API_BASE_URL);

    window.USER_ROLES = USER_ROLES_OBJ;
    console.log('[constants.js] window.USER_ROLES set to:', window.USER_ROLES);

    window.ROLES_ARRAY = ROLES_ARRAY_CONST;
    window.USER_ROLE_VALUES = USER_ROLE_VALUES_CONST;

    window.NAV_LINKS = NAV_LINKS_OBJ;
    console.log('[constants.js] window.NAV_LINKS set.');

    window.COMMON_NAV_LINKS = COMMON_NAV_LINKS_CONST;
    window.MOCK_TIME_SLOTS = MOCK_TIME_SLOTS_CONST;
    window.DAYS_OF_WEEK = DAYS_OF_WEEK_CONST;
    window.DEPARTMENTS = DEPARTMENTS_CONST;
    window.EQUIPMENT_STATUSES = EQUIPMENT_STATUSES_CONST;
    window.BOOKING_STATUSES_ARRAY = BOOKING_STATUSES_ARRAY_CONST;
    window.formatDate = formatDate;
} else {
    console.error('[constants.js] CRITICAL: window object not found. This script is intended for browser environment.');
}
console.log('[constants.js] Script end. All constants and functions should be available on window.');
