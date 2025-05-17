
// Global constants for the application

// Base URL for all API calls to the backend
const API_BASE_URL_CONST = 'http://localhost:5001/api'; // Assuming backend runs on port 5001

const USER_ROLES_OBJ = {
  ADMIN: 'Admin',
  FACULTY: 'Faculty',
  STUDENT: 'Student',
  ASSISTANT: 'Assistant',
};
const ROLES_ARRAY_CONST = Object.values(USER_ROLES_OBJ);

const NAV_LINKS_OBJ = {
  [USER_ROLES_OBJ.ADMIN]: [
    { href: 'admin.html', label: 'Admin Dashboard', icon: 'layout-dashboard' },
    { href: 'admin_manage_labs.html', label: 'Manage Labs', icon: 'settings-2' },
    { href: 'admin_manage_equipment.html', label: 'Manage Equipment', icon: 'wrench' },
    { href: 'labs.html', label: 'Lab Availability', icon: 'flask-conical' },
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

const COMMON_NAV_LINKS_CONST = []; // For links common to all roles, if any

const MOCK_LABS_INITIAL = [
  { id: 1, name: 'Physics Lab Alpha', capacity: 20, roomNumber: 'P-101', location: 'Block A, Floor 1' },
  { id: 2, name: 'Chemistry Lab Beta', capacity: 15, roomNumber: 'C-205', location: 'Block B, Floor 2' },
  { id: 3, name: 'Computer Lab Gamma', capacity: 70, roomNumber: 'CS-302', location: 'Block C, Floor 3' },
  { id: 4, name: 'Electronics Lab Delta', capacity: 18, roomNumber: 'E-110', location: 'Block A, Floor G' },
];

const MOCK_EQUIPMENT_INITIAL = [
  { id: 1, name: 'Olympus Microscope X2000', type: 'Microscope', labId: 2, status: 'available' },
  { id: 2, name: 'Tektronix TDS1000', type: 'Oscilloscope', labId: 4, status: 'available' },
  { id: 3, name: 'High-Performance PC Dell', type: 'Computer', labId: 3, status: 'in-use' },
  { id: 4, name: 'Epson Projector 5000', type: 'Projector', labId: null, status: 'available' },
];
const EQUIPMENT_STATUSES_CONST = ['available', 'in-use', 'maintenance', 'broken'];


const MOCK_LABS_STORAGE_KEY = 'adminManagedLabsV2';
const MOCK_EQUIPMENT_STORAGE_KEY = 'adminManagedEquipmentV2';
const LAB_SEAT_STATUSES_STORAGE_KEY = 'labSeatStatusesV3'; // Incremented
const MOCK_BOOKINGS_STORAGE_KEY = 'mockBookingsV5';


function loadLabs() {
    const storedLabs = localStorage.getItem(MOCK_LABS_STORAGE_KEY);
    if (storedLabs) {
        try {
            return JSON.parse(storedLabs);
        } catch (e) {
            // console.error("Error parsing labs from localStorage:", e);
            localStorage.removeItem(MOCK_LABS_STORAGE_KEY); // Clear corrupted data
        }
    }
    // If nothing in localStorage or parsing failed, save and return initial mock data
    localStorage.setItem(MOCK_LABS_STORAGE_KEY, JSON.stringify(MOCK_LABS_INITIAL));
    return MOCK_LABS_INITIAL;
}

function saveLabs(labs) {
    try {
        localStorage.setItem(MOCK_LABS_STORAGE_KEY, JSON.stringify(labs));
    } catch (e) {
        // console.error("Error saving labs to localStorage:", e);
    }
}

function loadEquipment() {
    const storedEquipment = localStorage.getItem(MOCK_EQUIPMENT_STORAGE_KEY);
    if (storedEquipment) {
         try {
            return JSON.parse(storedEquipment);
        } catch (e) {
            // console.error("Error parsing equipment from localStorage:", e);
            localStorage.removeItem(MOCK_EQUIPMENT_STORAGE_KEY);
        }
    }
    localStorage.setItem(MOCK_EQUIPMENT_STORAGE_KEY, JSON.stringify(MOCK_EQUIPMENT_INITIAL));
    return MOCK_EQUIPMENT_INITIAL;
}

function saveEquipment(equipment) {
     try {
        localStorage.setItem(MOCK_EQUIPMENT_STORAGE_KEY, JSON.stringify(equipment));
    } catch (e) {
        // console.error("Error saving equipment to localStorage:", e);
    }
}

let ALL_LAB_SEAT_STATUSES_CACHE;

function loadLabSeatStatuses() {
    if (ALL_LAB_SEAT_STATUSES_CACHE && Object.keys(ALL_LAB_SEAT_STATUSES_CACHE).length > 0 && arguments.length === 0) {
      return ALL_LAB_SEAT_STATUSES_CACHE;
    }
    
    try {
        const storedStatuses = localStorage.getItem(LAB_SEAT_STATUSES_STORAGE_KEY);
        ALL_LAB_SEAT_STATUSES_CACHE = storedStatuses ? JSON.parse(storedStatuses) : {};
    } catch (e) {
        // console.error("Error parsing labSeatStatuses from localStorage:", e);
        ALL_LAB_SEAT_STATUSES_CACHE = {}; // Reset on error
        localStorage.removeItem(LAB_SEAT_STATUSES_STORAGE_KEY);
    }
    // console.log("Loaded seat statuses from localStorage:", ALL_LAB_SEAT_STATUSES_CACHE);
    return ALL_LAB_SEAT_STATUSES_CACHE;
}

function saveLabSeatStatuses(statusesToSave) {
    if (!statusesToSave) {
        // console.error("Attempted to save undefined statuses to localStorage.");
        return;
    }
    ALL_LAB_SEAT_STATUSES_CACHE = statusesToSave; // Update cache
    try {
        localStorage.setItem(LAB_SEAT_STATUSES_STORAGE_KEY, JSON.stringify(statusesToSave));
        // console.log("Saved seat statuses to localStorage:", statusesToSave);
    } catch (e) {
        // console.error("Error saving labSeatStatuses to localStorage:", e);
    }
}


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

const today = new Date();
const tomorrow = new Date(today);
tomorrow.setDate(today.getDate() + 1);
const dayAfterTomorrow = new Date(today);
dayAfterTomorrow.setDate(today.getDate() + 2);
const yesterday = new Date(today);
yesterday.setDate(today.getDate() - 1);

function formatDate(dateInput) {
    if (!dateInput) return '';
    let d;
    if (dateInput instanceof Date) {
        d = dateInput;
    } else if (typeof dateInput === 'string' || typeof dateInput === 'number') {
        d = new Date(dateInput);
    } else {
        // console.warn("Invalid dateInput type for formatDate:", dateInput);
        return 'Invalid Date';
    }

    if (isNaN(d.getTime())) {
        // console.warn("Invalid date value for formatDate:", dateInput);
        return 'Invalid Date';
    }
    let month = '' + (d.getMonth() + 1);
    let day = '' + d.getDate();
    const year = d.getFullYear();
    if (month.length < 2) month = '0' + month;
    if (day.length < 2) day = '0' + day;
    return [year, month, day].join('-');
}

const MOCK_BOOKINGS_INITIAL = [
    // Existing Bookings for various users
    { id: 'b1', labId: 1, date: formatDate(today), timeSlotId: 'ts_0900_1000', userId: 3, purpose: 'Physics Experiment A', equipmentIds: JSON.stringify([4]), status: 'booked', requestedByRole: USER_ROLES_OBJ.STUDENT, submittedDate: formatDate(yesterday) },
    { id: 'b3', labId: 2, date: formatDate(tomorrow), timeSlotId: 'ts_1400_1500', userId: 2, purpose: 'Chem 101 Class', equipmentIds: JSON.stringify([1]), status: 'booked', requestedByRole: USER_ROLES_OBJ.FACULTY, submittedDate: formatDate(yesterday) },
    { id: 'b4_assistant_booked', labId: 3, date: formatDate(today), timeSlotId: 'ts_1000_1100', userId: 4, purpose: 'Robotics Prep', equipmentIds: JSON.stringify([]), status: 'booked', batchIdentifier: 'Robotics Club', requestedByRole: USER_ROLES_OBJ.ASSISTANT, submittedDate: formatDate(yesterday) },
    { id: 'b5_past', labId: 4, date: formatDate(yesterday), timeSlotId: 'ts_1500_1600', userId: 3, purpose: 'Circuit Design (Completed)', equipmentIds: JSON.stringify([2]), status: 'booked', requestedByRole: USER_ROLES_OBJ.STUDENT, submittedDate: formatDate(new Date(yesterday.getTime() - 24*60*60*1000))},
    
    // Pending Assistant Requests (for Admin to approve/reject)
    { id: 'ar1', labId: 1, date: formatDate(tomorrow), timeSlotId: 'ts_1300_1400', userId: 4, purpose: 'Special Physics Tutoring', equipmentIds: JSON.stringify([4]), status: 'pending', batchIdentifier: 'Physics Honors Group', requestedByRole: USER_ROLES_OBJ.ASSISTANT, submittedDate: formatDate(today) },
    { id: 'ar2', labId: 3, date: formatDate(dayAfterTomorrow), timeSlotId: 'ts_1500_1600', userId: 4, purpose: 'Data Structures Workshop', equipmentIds: JSON.stringify([3]), status: 'pending', batchIdentifier: 'IT Year 1 - Section B', requestedByRole: USER_ROLES_OBJ.ASSISTANT, submittedDate: formatDate(today) },
    { id: 'ar3', labId: 2, date: formatDate(tomorrow), timeSlotId: 'ts_0800_0900', userId: 4, purpose: 'Organic Chem Practicals', equipmentIds: JSON.stringify([]), status: 'pending', batchIdentifier: 'Chemistry Advanced', requestedByRole: USER_ROLES_OBJ.ASSISTANT, submittedDate: formatDate(today) },

    // Faculty Requests for Admin Approval
    { id: 'fr1', labId: 1, date: formatDate(dayAfterTomorrow), timeSlotId: 'ts_1100_1200', userId: 2, purpose: 'Advanced Quantum Mechanics Seminar - Special Booking', equipmentIds: JSON.stringify([]), status: 'pending-admin-approval', requestedByRole: USER_ROLES_OBJ.FACULTY, requestType: 'special_booking', submittedDate: formatDate(yesterday) },
    { id: 'fr2', labId: 3, date: formatDate(tomorrow), timeSlotId: 'ts_1600_1700', userId: 2, purpose: 'Guest Lecture on AI - Needs Projector', equipmentIds: JSON.stringify([3]), status: 'pending-admin-approval', requestedByRole: USER_ROLES_OBJ.FACULTY, requestType: 'guest_lecture_setup', submittedDate: formatDate(today) },
];


let MOCK_BOOKINGS_VAR = [];

function initializeMockBookings() {
    const storedBookings = localStorage.getItem(MOCK_BOOKINGS_STORAGE_KEY);
    if (storedBookings) {
        try {
            MOCK_BOOKINGS_VAR = JSON.parse(storedBookings);
        } catch (e) {
            // console.error("Error parsing mockBookings from localStorage:", e);
            MOCK_BOOKINGS_VAR = MOCK_BOOKINGS_INITIAL; // Fallback to initial if parsing fails
            localStorage.removeItem(MOCK_BOOKINGS_STORAGE_KEY);
            saveMockBookings(); // Save the initial set
        }
    } else {
        MOCK_BOOKINGS_VAR = MOCK_BOOKINGS_INITIAL;
        saveMockBookings();
    }
    // console.log("[constants.js] Initialized MOCK_BOOKINGS_VAR with length:", MOCK_BOOKINGS_VAR.length);
}

function saveMockBookings() {
    try {
        localStorage.setItem(MOCK_BOOKINGS_STORAGE_KEY, JSON.stringify(MOCK_BOOKINGS_VAR));
    } catch (e) {
        // console.error("Error saving mockBookings to localStorage:", e);
    }
}

initializeMockBookings(); // Load bookings on script load

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

// Expose to global window object for access in other scripts
window.API_BASE_URL = API_BASE_URL_CONST;
window.USER_ROLES = USER_ROLES_OBJ;
window.ROLES_ARRAY = ROLES_ARRAY_CONST;
window.NAV_LINKS = NAV_LINKS_OBJ;
window.COMMON_NAV_LINKS = COMMON_NAV_LINKS_CONST;
window.MOCK_LABS_DATA = loadLabs(); // Changed from MOCK_LABS to avoid conflict if one script redefines it
window.MOCK_EQUIPMENT_DATA = loadEquipment(); // Changed from MOCK_EQUIPMENT
window.EQUIPMENT_STATUSES = EQUIPMENT_STATUSES_CONST;
window.saveLabs = saveLabs;
window.saveEquipment = saveEquipment;
window.MOCK_TIME_SLOTS = MOCK_TIME_SLOTS_CONST;
window.MOCK_BOOKINGS = MOCK_BOOKINGS_VAR; // This is the live array
window.saveMockBookings = saveMockBookings;
window.DAYS_OF_WEEK = DAYS_OF_WEEK_CONST;
window.DEPARTMENTS = DEPARTMENTS_CONST;
window.formatDate = formatDate; // Make formatDate globally available
window.loadLabs = loadLabs;
window.loadEquipment = loadEquipment;
window.LAB_SEAT_STATUSES_STORAGE_KEY = LAB_SEAT_STATUSES_STORAGE_KEY;
window.loadLabSeatStatuses = loadLabSeatStatuses;
window.saveLabSeatStatuses = saveLabSeatStatuses;

loadLabSeatStatuses(); // Initialize seat statuses cache on script load
// console.log('[constants.js] Constants and mock data initialized. API_BASE_URL:', window.API_BASE_URL);
// console.log('[constants.js] window.USER_ROLES:', window.USER_ROLES);
// console.log('[constants.js] Initial window.MOCK_BOOKINGS length:', window.MOCK_BOOKINGS ? window.MOCK_BOOKINGS.length : 'undefined');

    