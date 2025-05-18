
// Global constants for the application

const API_BASE_URL_CONST = 'http://localhost:5001/api'; // Assuming backend runs on port 5001
// console.log('[constants.js] API_BASE_URL_CONST:', API_BASE_URL_CONST);

const USER_ROLES_OBJ = {
  ADMIN: 'Admin',
  FACULTY: 'Faculty',
  STUDENT: 'Student',
  ASSISTANT: 'Assistant',
};
const ROLES_ARRAY_CONST = Object.values(USER_ROLES_OBJ);
const USER_ROLE_VALUES_CONST = Object.values(USER_ROLES_OBJ); // For convenience

const NAV_LINKS_OBJ = {
  [USER_ROLES_OBJ.ADMIN]: [
    { href: 'admin.html', label: 'Admin Dashboard', icon: 'layout-dashboard' },
    { href: 'admin_manage_labs.html', label: 'Manage Labs', icon: 'settings-2' },
    { href: 'admin_manage_equipment.html', label: 'Manage Equipment', icon: 'wrench' },
    { href: 'labs.html', label: 'Lab Availability', icon: 'flask-conical' }, // Added for Admin
    { href: 'admin_view_bookings.html', label: 'View All Bookings', icon: 'calendar-days' },
    { href: 'admin_assistant_requests.html', label: 'Assistant Requests', icon: 'clipboard-list' },
    { href: 'admin_faculty_requests.html', label: 'Faculty Requests', icon: 'user-check' },
    { href: 'admin_run_algorithms.html', label: 'Run Algorithms', icon: 'brain-circuit' },
    { href: 'admin_view_logs.html', label: 'View Logs', icon: 'history' },
    { href: 'admin_reports.html', label: 'Generate Reports', icon: 'file-text' },
    { href: 'admin_manage_users.html', label: 'User Management', icon: 'users' },
  ],
  [USER_ROLES_OBJ.FACULTY]: [
    { href: 'faculty.html', label: 'Faculty Dashboard', icon: 'layout-dashboard' },
    { href: 'labs.html', label: 'Lab Availability', icon: 'flask-conical' },
    { href: 'book_slot.html', label: 'Book a Slot', icon: 'calendar-plus' },
    { href: 'faculty_my_bookings.html', label: 'My Bookings', icon: 'calendar-check' },
    // Removed Assistant/CR requests from Faculty sidebar
  ],
  [USER_ROLES_OBJ.STUDENT]: [
    { href: 'student.html', label: 'Student Dashboard', icon: 'layout-dashboard' },
    { href: 'student_my_bookings.html', label: 'My Schedule', icon: 'calendar-check' },
  ],
  [USER_ROLES_OBJ.ASSISTANT]: [
    { href: 'assistant.html', label: 'Assistant Dashboard', icon: 'layout-dashboard' },
    { href: 'labs.html', label: 'Lab Availability', icon: 'flask-conical' },
    { href: 'assistant_request_lab.html', label: 'Request Lab Slot', icon: 'user-plus' },
    { href: 'assistant_update_seat_status.html', label: 'Update Seat Status', icon: 'edit-3' },
    // Removed "View My Schedule" from Assistant sidebar
  ],
};

const COMMON_NAV_LINKS_CONST = [ // For links common to all roles, if any e.g. profile
    { href: 'profile.html', label: 'Profile', icon: 'user-circle' }
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
    if (!dateInput && dateInput !== 0) return ''; // Handle null, undefined, empty string
    let d;
    if (dateInput instanceof Date) {
        d = dateInput;
    } else if (typeof dateInput === 'string' || typeof dateInput === 'number') {
        // Attempt to parse, including simple YYYY-MM-DD or YYYY/MM/DD
        const potentialDate = new Date(dateInput);
        if (!isNaN(potentialDate.getTime())) {
            d = potentialDate;
        } else {
            // Handle cases where new Date() might misinterpret if only date part without time is given
            // and it results in previous day due to timezone. Split and construct.
            const parts = String(dateInput).split(/[-/T\s:]/); // Split by common date/time delimiters
            if (parts.length >= 3) {
                d = new Date(Date.UTC(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2])));
                 if (isNaN(d.getTime())) { // if still invalid
                    // console.warn("Invalid date value for formatDate after UTC attempt:", dateInput);
                    return 'Invalid Date';
                }
            } else {
                // console.warn("Invalid date string format for formatDate:", dateInput);
                return 'Invalid Date String';
            }
        }
    } else {
        // console.warn("Invalid dateInput type for formatDate:", dateInput);
        return 'Invalid Date Type';
    }

    if (isNaN(d.getTime())) {
        // console.warn("Invalid date value for formatDate (final check):", dateInput);
        return 'Invalid Date Value';
    }
    // Use UTC methods to avoid timezone issues when formatting YYYY-MM-DD
    let month = '' + (d.getUTCMonth() + 1);
    let day = '' + d.getUTCDate();
    const year = d.getUTCFullYear();
    if (month.length < 2) month = '0' + month;
    if (day.length < 2) day = '0' + day;
    return [year, month, day].join('-');
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


// Expose to global window object for access in other scripts
window.API_BASE_URL = API_BASE_URL_CONST;
window.USER_ROLES = USER_ROLES_OBJ;
window.ROLES_ARRAY = ROLES_ARRAY_CONST;
window.USER_ROLE_VALUES = USER_ROLE_VALUES_CONST; // Added
window.NAV_LINKS = NAV_LINKS_OBJ;
window.COMMON_NAV_LINKS = COMMON_NAV_LINKS_CONST;
window.MOCK_TIME_SLOTS = MOCK_TIME_SLOTS_CONST;
window.DAYS_OF_WEEK = DAYS_OF_WEEK_CONST;
window.DEPARTMENTS = DEPARTMENTS_CONST;
window.EQUIPMENT_STATUSES = EQUIPMENT_STATUSES_CONST;
window.BOOKING_STATUSES_ARRAY = BOOKING_STATUSES_ARRAY_CONST;
window.formatDate = formatDate;

// console.log('[constants.js] Constants and mock data definitions complete. API_BASE_URL:', window.API_BASE_URL);
// console.log('[constants.js] window.USER_ROLES:', window.USER_ROLES);
// console.log('[constants.js] window.NAV_LINKS:', window.NAV_LINKS);
