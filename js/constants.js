
// Global constants for the application

const API_BASE_URL_CONST = 'http://localhost:5001/api';
// console.log('[constants.js] API_BASE_URL_CONST:', API_BASE_URL_CONST);

const USER_ROLES_OBJ = {
  ADMIN: 'Admin',
  FACULTY: 'Faculty',
  STUDENT: 'Student',
  ASSISTANT: 'Assistant',
};
const ROLES_ARRAY_CONST = Object.values(USER_ROLES_OBJ);
const USER_ROLE_VALUES_CONST = Object.values(USER_ROLES_OBJ);

const NAV_LINKS_OBJ = {
  [USER_ROLES_OBJ.ADMIN]: [
    { href: 'admin.html', label: 'Admin Dashboard', icon: 'layout-dashboard' },
    { href: 'admin_manage_labs.html', label: 'Manage Labs', icon: 'settings-2' },
    { href: 'admin_manage_equipment.html', label: 'Manage Equipment', icon: 'wrench' },
    { href: 'labs.html', label: 'Lab Availability', icon: 'flask-conical' },
    { href: 'admin_faculty_requests.html', label: 'Faculty Requests', icon: 'user-check' },
    { href: 'admin_system_overview.html', label: 'System Overview & Reports', icon: 'activity' },
    { href: 'admin_manage_users.html', label: 'User Management', icon: 'users' },
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
  ],
  [USER_ROLES_OBJ.ASSISTANT]: [
    { href: 'assistant.html', label: 'Assistant Dashboard', icon: 'layout-dashboard' },
    { href: 'labs.html', label: 'Lab Availability', icon: 'flask-conical' },
    { href: 'assistant_request_lab.html', label: 'Request Lab Slot', icon: 'user-plus' },
    { href: 'assistant_update_seat_status.html', label: 'Update Seat Status', icon: 'edit-3' },
  ],
};

// Profile is accessed via the user dropdown in the header, not a main sidebar link.
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
    if (!dateInput && dateInput !== 0) return '';
    let d;
    if (dateInput instanceof Date) {
        d = dateInput;
    } else if (typeof dateInput === 'string' || typeof dateInput === 'number') {
        const potentialDate = new Date(dateInput);
        if (String(dateInput).length > 0 && String(dateInput).includes('-') && !isNaN(potentialDate.getTime())) {
            // Handles "YYYY-MM-DD" correctly, ensuring it's not UTC midnight of the previous day
            const parts = String(dateInput).split('T')[0].split('-');
            d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
        } else if (!isNaN(potentialDate.getTime())) {
             d = potentialDate;
        } else {
            return 'Invalid Date String';
        }
    } else {
        return 'Invalid Date Type';
    }

    if (isNaN(d.getTime())) {
        return 'Invalid Date Value';
    }
    let month = '' + (d.getMonth() + 1);
    let day = '' + d.getDate();
    const year = d.getFullYear();
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

const LAB_SEAT_STATUSES_STORAGE_KEY = 'labSeatStatusesV2'; // V2 to avoid conflict if old format exists
const MOCK_BOOKINGS_STORAGE_KEY = 'mockBookingsV5';


// Expose to global window object for access in other scripts
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

// console.log('[constants.js] Constants and mock data definitions complete. API_BASE_URL:', window.API_BASE_URL);
// console.log('[constants.js] window.USER_ROLES:', window.USER_ROLES);
// console.log('[constants.js] window.NAV_LINKS:', window.NAV_LINKS);
// console.log('[constants.js] window.COMMON_NAV_LINKS:', window.COMMON_NAV_LINKS);

// Functions for localStorage interactions
window.loadLabs = function() {
    const storedLabs = localStorage.getItem('labsList');
    return storedLabs ? JSON.parse(storedLabs) : [];
};
window.saveLabs = function(labs) {
    localStorage.setItem('labsList', JSON.stringify(labs));
};
window.loadEquipment = function() {
    const storedEquipment = localStorage.getItem('equipmentList');
    return storedEquipment ? JSON.parse(storedEquipment) : [];
};
window.saveEquipment = function(equipment) {
    localStorage.setItem('equipmentList', JSON.stringify(equipment));
};

window.loadLabSeatStatuses = function(labId) {
    const allStatuses = JSON.parse(localStorage.getItem(LAB_SEAT_STATUSES_STORAGE_KEY) || '{}');
    return allStatuses[labId] || {};
};

window.saveLabSeatStatuses = function(labId, labStatuses) {
    const allStatuses = JSON.parse(localStorage.getItem(LAB_SEAT_STATUSES_STORAGE_KEY) || '{}');
    allStatuses[labId] = labStatuses;
    try {
        localStorage.setItem(LAB_SEAT_STATUSES_STORAGE_KEY, JSON.stringify(allStatuses));
    } catch (e) {
        console.error("Error saving lab seat statuses to localStorage:", e);
    }
};
window.getAllLabSeatStatuses = function() { // Used by assistant_seat_updater.js
    return JSON.parse(localStorage.getItem(LAB_SEAT_STATUSES_STORAGE_KEY) || '{}');
};
window.saveAllLabSeatStatuses = function(allStatuses) { // Used by assistant_seat_updater.js
     try {
        localStorage.setItem(LAB_SEAT_STATUSES_STORAGE_KEY, JSON.stringify(allStatuses));
    } catch (e) {
        console.error("Error saving all lab seat statuses to localStorage:", e);
    }
};
