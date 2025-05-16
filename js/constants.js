
const USER_ROLES = {
  ADMIN: 'Admin',
  FACULTY: 'Faculty',
  STUDENT: 'Student',
  ASSISTANT: 'Assistant', // Changed from CR
};

const ROLES_ARRAY = Object.values(USER_ROLES);

const NAV_LINKS = {
  [USER_ROLES.ADMIN]: [
    { href: 'admin.html', label: 'Admin Dashboard', icon: 'layout-dashboard' },
    { href: 'admin_manage_labs.html', label: 'Manage Labs', icon: 'settings-2' },
    { href: 'admin_manage_equipment.html', label: 'Manage Equipment', icon: 'wrench' },
    { href: 'labs.html', label: 'Lab Availability', icon: 'flask-conical' },
    { href: 'admin_view_bookings.html', label: 'View All Bookings', icon: 'calendar-days' },
    { href: 'admin_faculty_requests.html', label: 'Faculty Requests', icon: 'clipboard-list' }, // This might need renaming if it's for Assistant requests to Admin
    { href: 'admin_run_algorithms.html', label: 'Run Algorithms', icon: 'brain-circuit' },
  ],
  [USER_ROLES.FACULTY]: [
    { href: 'faculty.html', label: 'Faculty Dashboard', icon: 'layout-dashboard' },
    { href: 'labs.html', label: 'Lab Availability', icon: 'flask-conical' },
    { href: 'book_slot.html', label: 'Book a Slot', icon: 'calendar-plus' },
    { href: 'faculty_my_bookings.html', label: 'My Bookings', icon: 'calendar-check' },
    { href: 'faculty_assistant_requests.html', label: 'Assistant Lab Requests', icon: 'file-check' }, // Changed from faculty_cr_requests
  ],
  [USER_ROLES.STUDENT]: [
    { href: 'student.html', label: 'Student Dashboard', icon: 'layout-dashboard' },
    { href: 'student_my_bookings.html', label: 'View Schedule', icon: 'calendar-check' },
  ],
  [USER_ROLES.ASSISTANT]: [ // Changed from CR
    { href: 'assistant.html', label: 'Assistant Dashboard', icon: 'layout-dashboard' },
    { href: 'labs.html', label: 'Lab Availability', icon: 'flask-conical' },
    { href: 'student_my_bookings.html', label: 'View My Schedule', icon: 'calendar-check' }, // Assuming assistant also sees their schedule here
    { href: 'assistant_request_lab.html', label: 'Request Lab Slot', icon: 'user-plus' }, // Changed from cr_request_class_booking
    { href: 'assistant_update_seat_status.html', label: 'Update Seat Status', icon: 'edit-3' } // New page
  ],
};

const COMMON_NAV_LINKS = [];

const MOCK_LABS_INITIAL = [
  { id: 'physics_lab_alpha', name: 'Physics Lab Alpha', capacity: 20, roomNumber: 'P-101' },
  { id: 'chemistry_lab_beta', name: 'Chemistry Lab Beta', capacity: 15, roomNumber: 'C-205' },
  { id: 'computer_lab_gamma', name: 'Computer Lab Gamma', capacity: 70, roomNumber: 'CS-302' }, // Set one to 70 for testing layout
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
const EQUIPMENT_STATUSES = ['available', 'in-use', 'maintenance', 'broken'];


const MOCK_LABS_STORAGE_KEY = 'adminManagedLabs';
const MOCK_EQUIPMENT_STORAGE_KEY = 'adminManagedEquipment';
const LAB_SEAT_STATUSES_STORAGE_KEY = 'labSeatStatuses'; // New key for seat statuses

function loadLabs() {
    const storedLabs = localStorage.getItem(MOCK_LABS_STORAGE_KEY);
    if (storedLabs) {
        return JSON.parse(storedLabs);
    }
    localStorage.setItem(MOCK_LABS_STORAGE_KEY, JSON.stringify(MOCK_LABS_INITIAL));
    return MOCK_LABS_INITIAL;
}

function saveLabs(labs) {
    localStorage.setItem(MOCK_LABS_STORAGE_KEY, JSON.stringify(labs));
}

function loadEquipment() {
    const storedEquipment = localStorage.getItem(MOCK_EQUIPMENT_STORAGE_KEY);
    if (storedEquipment) {
        return JSON.parse(storedEquipment);
    }
    localStorage.setItem(MOCK_EQUIPMENT_STORAGE_KEY, JSON.stringify(MOCK_EQUIPMENT_INITIAL));
    return MOCK_EQUIPMENT_INITIAL;
}

function saveEquipment(equipment) {
    localStorage.setItem(MOCK_EQUIPMENT_STORAGE_KEY, JSON.stringify(equipment));
}

function loadLabSeatStatuses() {
    const storedStatuses = localStorage.getItem(LAB_SEAT_STATUSES_STORAGE_KEY);
    return storedStatuses ? JSON.parse(storedStatuses) : {};
}

function saveLabSeatStatuses(statuses) {
    localStorage.setItem(LAB_SEAT_STATUSES_STORAGE_KEY, JSON.stringify(statuses));
}


const MOCK_TIME_SLOTS = [
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
const yesterday = new Date(today);
yesterday.setDate(today.getDate() - 1);

function formatDate(date) {
    const d = new Date(date);
    let month = '' + (d.getMonth() + 1);
    let day = '' + d.getDate();
    const year = d.getFullYear();
    if (month.length < 2) month = '0' + month;
    if (day.length < 2) day = '0' + day;
    return [year, month, day].join('-');
}

const MOCK_BOOKINGS_STORAGE_KEY = 'mockBookings';
let MOCK_BOOKINGS = []; 

function initializeMockBookings() {
    const storedBookings = localStorage.getItem(MOCK_BOOKINGS_STORAGE_KEY);
    if (storedBookings) {
        MOCK_BOOKINGS = JSON.parse(storedBookings);
    } else {
        MOCK_BOOKINGS = [
            { id: 'b1', labId: 'physics_lab_alpha', date: formatDate(today), timeSlotId: 'ts_0900_1000', userId: 'student1@example.com', purpose: 'Physics Experiment A', equipmentIds: ['eq_spectrometer_01'], status: 'booked', requestedByRole: USER_ROLES.STUDENT},
            { id: 'b2', labId: 'physics_lab_alpha', date: formatDate(today), timeSlotId: 'ts_1000_1100', userId: 'student2@example.com', purpose: 'Quantum Study', equipmentIds: [], status: 'pending', requestedByRole: USER_ROLES.STUDENT},
            { id: 'b3', labId: 'chemistry_lab_beta', date: formatDate(tomorrow), timeSlotId: 'ts_1400_1500', userId: 'faculty1@example.com', purpose: 'Chem 101 Class', equipmentIds: ['eq_microscope_01'], status: 'booked', requestedByRole: USER_ROLES.FACULTY},
            { id: 'b4', labId: 'computer_lab_gamma', date: formatDate(new Date(new Date().setDate(new Date().getDate() + 2))), timeSlotId: 'ts_1100_1200', userId: 'assistant@example.com', purpose: 'AI Project Work', equipmentIds: ['eq_pc_high_01'], status: 'pending', batchIdentifier: 'CSE Year 2 - Section A', requestedByRole: USER_ROLES.ASSISTANT }, // Changed to ASSISTANT
            { id: 'b5', labId: 'electronics_lab_delta', date: formatDate(yesterday), timeSlotId: 'ts_1500_1600', userId: 'student1@example.com', purpose: 'Circuit Design (Completed)', equipmentIds: ['eq_oscilloscope_01'], status: 'booked', requestedByRole: USER_ROLES.STUDENT },
        ];
        saveMockBookings();
    }
}

function saveMockBookings() {
    localStorage.setItem(MOCK_BOOKINGS_STORAGE_KEY, JSON.stringify(MOCK_BOOKINGS));
}

initializeMockBookings();


const DAYS_OF_WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];


const DEPARTMENTS = [
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

window.USER_ROLES = USER_ROLES;
window.ROLES_ARRAY = ROLES_ARRAY;
window.NAV_LINKS = NAV_LINKS;
window.COMMON_NAV_LINKS = COMMON_NAV_LINKS;
window.MOCK_LABS = loadLabs(); 
window.MOCK_EQUIPMENT = loadEquipment(); 
window.EQUIPMENT_STATUSES = EQUIPMENT_STATUSES;
window.saveLabs = saveLabs; 
window.saveEquipment = saveEquipment;
window.MOCK_TIME_SLOTS = MOCK_TIME_SLOTS;
window.MOCK_BOOKINGS = MOCK_BOOKINGS;
window.saveMockBookings = saveMockBookings;
window.DAYS_OF_WEEK = DAYS_OF_WEEK;
window.DEPARTMENTS = DEPARTMENTS;
window.formatDate = formatDate;
window.loadLabs = loadLabs; 
window.loadEquipment = loadEquipment;
window.LAB_SEAT_STATUSES_STORAGE_KEY = LAB_SEAT_STATUSES_STORAGE_KEY; // Expose new key
window.loadLabSeatStatuses = loadLabSeatStatuses; // Expose new functions
window.saveLabSeatStatuses = saveLabSeatStatuses;
