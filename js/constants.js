
const USER_ROLES_OBJ = { // Renamed to avoid conflict if USER_ROLES is used as a global var name
  ADMIN: 'Admin',
  FACULTY: 'Faculty',
  STUDENT: 'Student',
  ASSISTANT: 'Assistant',
};

const ROLES_ARRAY_CONST = Object.values(USER_ROLES_OBJ); // Renamed

const NAV_LINKS_OBJ = { // Renamed
  [USER_ROLES_OBJ.ADMIN]: [
    { href: 'admin.html', label: 'Admin Dashboard', icon: 'layout-dashboard' },
    { href: 'admin_manage_labs.html', label: 'Manage Labs', icon: 'settings-2' },
    { href: 'admin_manage_equipment.html', label: 'Manage Equipment', icon: 'wrench' },
    { href: 'labs.html', label: 'Lab Availability', icon: 'flask-conical' },
    { href: 'admin_view_bookings.html', label: 'View All Bookings', icon: 'calendar-days' },
    { href: 'admin_assistant_requests.html', label: 'Assistant Requests', icon: 'clipboard-list' },
    { href: 'admin_faculty_requests.html', label: 'Faculty Requests', icon: 'user-check' },
    { href: 'admin_run_algorithms.html', label: 'Run Algorithms', icon: 'brain-circuit' },
  ],
  [USER_ROLES_OBJ.FACULTY]: [
    { href: 'faculty.html', label: 'Faculty Dashboard', icon: 'layout-dashboard' },
    { href: 'labs.html', label: 'Lab Availability', icon: 'flask-conical' },
    { href: 'book_slot.html', label: 'Book a Slot', icon: 'calendar-plus' },
    { href: 'faculty_my_bookings.html', label: 'My Bookings', icon: 'calendar-check' },
  ],
  [USER_ROLES_OBJ.STUDENT]: [
    { href: 'student.html', label: 'Student Dashboard', icon: 'layout-dashboard' },
    { href: 'student_my_bookings.html', label: 'View Schedule', icon: 'calendar-check' },
  ],
  [USER_ROLES_OBJ.ASSISTANT]: [
    { href: 'assistant.html', label: 'Assistant Dashboard', icon: 'layout-dashboard' },
    { href: 'labs.html', label: 'Lab Availability', icon: 'flask-conical' },
    { href: 'assistant_request_lab.html', label: 'Request Lab Slot', icon: 'user-plus' },
    { href: 'assistant_update_seat_status.html', label: 'Update Seat Status', icon: 'edit-3' }
  ],
};

const COMMON_NAV_LINKS_CONST = []; // Renamed

const MOCK_LABS_INITIAL = [
  { id: 'physics_lab_alpha', name: 'Physics Lab Alpha', capacity: 20, roomNumber: 'P-101' },
  { id: 'chemistry_lab_beta', name: 'Chemistry Lab Beta', capacity: 15, roomNumber: 'C-205' },
  { id: 'computer_lab_gamma', name: 'Computer Lab Gamma', capacity: 70, roomNumber: 'CS-302' },
  { id: 'electronics_lab_delta', name: 'Electronics Lab Delta', capacity: 18, roomNumber: 'E-110' },
  { id: 'biology_lab_epsilon', name: 'Biology Lab Epsilon', capacity: 25, roomNumber: 'B-G03'},
  { id: 'robotics_lab_zeta', name: 'Robotics Lab Zeta', capacity: 12, roomNumber: 'R-401'},
];

const MOCK_EQUIPMENT_INITIAL = [
  { id: 'eq_microscope_01', name: 'Olympus Microscope X2000', type: 'Microscope', labId: 'chemistry_lab_beta', status: 'available' },
  { id: 'eq_oscilloscope_01', name: 'Tektronix TDS1000', type: 'Oscilloscope', labId: 'electronics_lab_delta', status: 'available' },
  { id: 'eq_pc_high_01', name: 'High-Performance PC Dell', type: 'Computer', labId: 'computer_lab_gamma', status: 'in-use' },
  { id: 'eq_projector_01', name: 'Epson Projector 5000', type: 'Projector', status: 'available' },
  { id: 'eq_spectrometer_01', name: 'ThermoFisher Spectrometer', type: 'Spectrometer', labId: 'physics_lab_alpha', status: 'maintenance'},
];
const EQUIPMENT_STATUSES_CONST = ['available', 'in-use', 'maintenance', 'broken']; // Renamed


const MOCK_LABS_STORAGE_KEY = 'adminManagedLabsV1'; // Incremented version
const MOCK_EQUIPMENT_STORAGE_KEY = 'adminManagedEquipmentV1'; // Incremented version
const LAB_SEAT_STATUSES_STORAGE_KEY = 'labSeatStatusesV3'; // Incremented version
const MOCK_BOOKINGS_STORAGE_KEY = 'mockBookingsV3'; // Incremented version

function loadLabs() {
    const storedLabs = localStorage.getItem(MOCK_LABS_STORAGE_KEY);
    if (storedLabs) {
        try {
            return JSON.parse(storedLabs);
        } catch (e) {
            console.error("Error parsing labs from localStorage:", e);
            localStorage.removeItem(MOCK_LABS_STORAGE_KEY); // Remove corrupted data
        }
    }
    localStorage.setItem(MOCK_LABS_STORAGE_KEY, JSON.stringify(MOCK_LABS_INITIAL));
    return MOCK_LABS_INITIAL;
}

function saveLabs(labs) {
    try {
        localStorage.setItem(MOCK_LABS_STORAGE_KEY, JSON.stringify(labs));
    } catch (e) {
        console.error("Error saving labs to localStorage:", e);
    }
}

function loadEquipment() {
    const storedEquipment = localStorage.getItem(MOCK_EQUIPMENT_STORAGE_KEY);
    if (storedEquipment) {
         try {
            return JSON.parse(storedEquipment);
        } catch (e) {
            console.error("Error parsing equipment from localStorage:", e);
            localStorage.removeItem(MOCK_EQUIPMENT_STORAGE_KEY); // Remove corrupted data
        }
    }
    localStorage.setItem(MOCK_EQUIPMENT_STORAGE_KEY, JSON.stringify(MOCK_EQUIPMENT_INITIAL));
    return MOCK_EQUIPMENT_INITIAL;
}

function saveEquipment(equipment) {
     try {
        localStorage.setItem(MOCK_EQUIPMENT_STORAGE_KEY, JSON.stringify(equipment));
    } catch (e) {
        console.error("Error saving equipment to localStorage:", e);
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
        console.error("Error parsing labSeatStatuses from localStorage:", e);
        ALL_LAB_SEAT_STATUSES_CACHE = {}; 
        localStorage.removeItem(LAB_SEAT_STATUSES_STORAGE_KEY);
    }
    return ALL_LAB_SEAT_STATUSES_CACHE;
}

function saveLabSeatStatuses(statuses) { 
    ALL_LAB_SEAT_STATUSES_CACHE = statuses; 
    try {
        localStorage.setItem(LAB_SEAT_STATUSES_STORAGE_KEY, JSON.stringify(statuses));
    } catch (e) {
        console.error("Error saving labSeatStatuses to localStorage:", e);
    }
}


const MOCK_TIME_SLOTS_CONST = [ // Renamed
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
    const d = dateInput instanceof Date ? dateInput : new Date(dateInput); 
    if (isNaN(d.getTime())) {
        // console.warn("formatDate received invalid dateInput:", dateInput);
        return ''; 
    }
    let month = '' + (d.getMonth() + 1);
    let day = '' + d.getDate();
    const year = d.getFullYear();
    if (month.length < 2) month = '0' + month;
    if (day.length < 2) day = '0' + day;
    return [year, month, day].join('-');
}


let MOCK_BOOKINGS_VAR = []; // Renamed

function initializeMockBookings() {
    const storedBookings = localStorage.getItem(MOCK_BOOKINGS_STORAGE_KEY);
    if (storedBookings) {
        try {
            MOCK_BOOKINGS_VAR = JSON.parse(storedBookings);
        } catch (e) {
            console.error("Error parsing mockBookings from localStorage:", e);
            MOCK_BOOKINGS_VAR = []; // Reset if corrupted
            localStorage.removeItem(MOCK_BOOKINGS_STORAGE_KEY);
        }
    } else {
        MOCK_BOOKINGS_VAR = [
            // Existing Bookings
            { id: 'b1', labId: 'physics_lab_alpha', date: formatDate(today), timeSlotId: 'ts_0900_1000', userId: 'student1@example.com', purpose: 'Physics Experiment A', equipmentIds: ['eq_spectrometer_01'], status: 'booked', requestedByRole: USER_ROLES_OBJ.STUDENT}, // Use USER_ROLES_OBJ
            { id: 'b3', labId: 'chemistry_lab_beta', date: formatDate(tomorrow), timeSlotId: 'ts_1400_1500', userId: 'faculty1@example.com', purpose: 'Chem 101 Class', equipmentIds: ['eq_microscope_01'], status: 'booked', requestedByRole: USER_ROLES_OBJ.FACULTY},
            { id: 'b5_assistant_booked', labId: 'robotics_lab_zeta', date: formatDate(today), timeSlotId: 'ts_1000_1100', userId: 'assistant@example.com', purpose: 'Robotics Prep', equipmentIds: [], status: 'booked', batchIdentifier: 'Robotics Club', requestedByRole: USER_ROLES_OBJ.ASSISTANT },
            { id: 'b5_past', labId: 'electronics_lab_delta', date: formatDate(yesterday), timeSlotId: 'ts_1500_1600', userId: 'student1@example.com', purpose: 'Circuit Design (Completed)', equipmentIds: ['eq_oscilloscope_01'], status: 'booked', requestedByRole: USER_ROLES_OBJ.STUDENT },
            
            // Pending Assistant Requests (for Admin to approve/reject)
            { id: 'ar1', labId: 'physics_lab_alpha', date: formatDate(tomorrow), timeSlotId: 'ts_1300_1400', userId: 'assistant_new@example.com', purpose: 'Special Physics Tutoring', equipmentIds: ['eq_spectrometer_01'], status: 'pending', batchIdentifier: 'Physics Honors Group', requestedByRole: USER_ROLES_OBJ.ASSISTANT },
            { id: 'ar2', labId: 'computer_lab_gamma', date: formatDate(dayAfterTomorrow), timeSlotId: 'ts_1500_1600', userId: 'assistant@example.com', purpose: 'Data Structures Workshop', equipmentIds: ['eq_pc_high_01', 'eq_projector_01'], status: 'pending', batchIdentifier: 'IT Year 1 - Section B', requestedByRole: USER_ROLES_OBJ.ASSISTANT },
            { id: 'ar3', labId: 'chemistry_lab_beta', date: formatDate(tomorrow), timeSlotId: 'ts_0800_0900', userId: 'another_assistant@example.com', purpose: 'Organic Chem Practicals', equipmentIds: [], status: 'pending', batchIdentifier: 'Chemistry Advanced', requestedByRole: USER_ROLES_OBJ.ASSISTANT },
            { id: 'ar4', labId: 'biology_lab_epsilon', date: formatDate(dayAfterTomorrow), timeSlotId: 'ts_0900_1000', userId: 'assistant@example.com', purpose: 'Microbiology Prep', equipmentIds: [], status: 'pending', batchIdentifier: 'Biology Majors', requestedByRole: USER_ROLES_OBJ.ASSISTANT },
            { id: 'ar5', labId: 'computer_lab_gamma', date: formatDate(tomorrow), timeSlotId: 'ts_1600_1700', userId: 'assistant_new@example.com', purpose: 'Programming Basics', equipmentIds: ['eq_projector_01'], status: 'pending', batchIdentifier: 'Intro to CS', requestedByRole: USER_ROLES_OBJ.ASSISTANT },

            // Faculty Requests for Admin Approval
            { id: 'fr1', labId: null, date: null, timeSlotId: null, userId: 'faculty1@example.com', purpose: 'Requesting a new XYZ Spectrophotometer for advanced research.', equipmentIds: [], status: 'pending-admin-approval', requestedByRole: USER_ROLES_OBJ.FACULTY, requestType: 'equipment_procurement', submittedDate: formatDate(yesterday) },
            { id: 'fr2', labId: 'physics_lab_alpha', date: null, timeSlotId: null, userId: 'faculty2@example.com', purpose: 'Request for extended lab hours for Project Minerva next Monday.', equipmentIds: [], status: 'pending-admin-approval', requestedByRole: USER_ROLES_OBJ.FACULTY, requestType: 'lab_policy_exception', submittedDate: formatDate(today) },
            { id: 'fr3', labId: null, date: null, timeSlotId: null, userId: 'faculty1@example.com', purpose: 'Budget approval for 5 new Raspberry Pi units for IoT lab.', equipmentIds: [], status: 'pending-admin-approval', requestedByRole: USER_ROLES_OBJ.FACULTY, requestType: 'budget_request', submittedDate: formatDate(tomorrow) },
        ];
        saveMockBookings();
    }
}

function saveMockBookings() {
    try {
        localStorage.setItem(MOCK_BOOKINGS_STORAGE_KEY, JSON.stringify(MOCK_BOOKINGS_VAR));
    } catch (e) {
        console.error("Error saving mockBookings to localStorage:", e);
    }
}

initializeMockBookings();


const DAYS_OF_WEEK_CONST = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']; // Renamed


const DEPARTMENTS_CONST = [ // Renamed
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

// Expose to global window object for access in other JS files
window.USER_ROLES = USER_ROLES_OBJ;
window.ROLES_ARRAY = ROLES_ARRAY_CONST;
window.NAV_LINKS = NAV_LINKS_OBJ;
window.COMMON_NAV_LINKS = COMMON_NAV_LINKS_CONST;
window.MOCK_LABS = loadLabs(); 
window.MOCK_EQUIPMENT = loadEquipment(); 
window.EQUIPMENT_STATUSES = EQUIPMENT_STATUSES_CONST;
window.saveLabs = saveLabs;
window.saveEquipment = saveEquipment;
window.MOCK_TIME_SLOTS = MOCK_TIME_SLOTS_CONST;
window.MOCK_BOOKINGS = MOCK_BOOKINGS_VAR; 
window.saveMockBookings = saveMockBookings;
window.DAYS_OF_WEEK = DAYS_OF_WEEK_CONST;
window.DEPARTMENTS = DEPARTMENTS_CONST;
window.formatDate = formatDate; 
window.loadLabs = loadLabs; 
window.loadEquipment = loadEquipment; 
window.LAB_SEAT_STATUSES_STORAGE_KEY = LAB_SEAT_STATUSES_STORAGE_KEY; // Keep original name if used directly elsewhere
window.loadLabSeatStatuses = loadLabSeatStatuses; 
window.saveLabSeatStatuses = saveLabSeatStatuses; 

// Initialize seat statuses cache on load
loadLabSeatStatuses();
console.log('[constants.js] Constants and mock data initialized and exposed to window.');
console.log('[constants.js] window.USER_ROLES:', window.USER_ROLES);
