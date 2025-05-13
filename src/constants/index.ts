
import type { NavItem, UserRole, Lab, TimeSlot, Booking, Equipment } from '@/types';
import { USER_ROLES } from '@/types';
import { LayoutDashboard, FlaskConical, CalendarPlus, Users, Settings2, CalendarCheck, Users2, UserCircle, LogOut, BookOpen, Home, Wrench, CalendarDays, BrainCircuit, UserCog, ClipboardList, UserPlus } from 'lucide-react';
import { addDays, subDays, format, startOfWeek } from 'date-fns';

const today = new Date();
const tomorrow = addDays(today, 1);
const yesterday = subDays(today, 1);
const nextMonday = startOfWeek(addDays(today, 7), { weekStartsOn: 1 });


export const NAV_LINKS: Record<UserRole, NavItem[]> = {
  [USER_ROLES.ADMIN]: [
    { href: '/dashboard/admin', label: 'Admin Dashboard', icon: LayoutDashboard },
    { href: '/dashboard/admin/manage-labs', label: 'Manage Labs', icon: Settings2 },
    { href: '/dashboard/admin/manage-equipment', label: 'Manage Equipment', icon: Wrench },
    { href: '/dashboard/admin/manage-users', label: 'Manage Users', icon: UserCog },
    { href: '/dashboard/admin/view-bookings', label: 'View All Bookings', icon: CalendarDays },
    { href: '/dashboard/admin/run-algorithms', label: 'Run Algorithms', icon: BrainCircuit },
  ],
  [USER_ROLES.FACULTY]: [
    { href: '/dashboard/faculty', label: 'Faculty Dashboard', icon: LayoutDashboard },
    { href: '/dashboard/labs', label: 'Lab Availability', icon: FlaskConical },
    { href: '/dashboard/book-slot', label: 'Book a Slot', icon: CalendarPlus },
    { href: '/dashboard/faculty/my-bookings', label: 'My Bookings', icon: CalendarCheck },
  ],
  [USER_ROLES.STUDENT]: [
    { href: '/dashboard/student', label: 'Student Dashboard', icon: LayoutDashboard },
    { href: '/dashboard/student/my-bookings', label: 'View Schedule', icon: CalendarCheck },
  ],
  [USER_ROLES.CR]: [
    { href: '/dashboard/cr', label: 'CR Dashboard', icon: LayoutDashboard },
    { href: '/dashboard/labs', label: 'Lab Availability', icon: FlaskConical },
    { href: '/dashboard/student/my-bookings', label: 'My Individual Schedule', icon: CalendarCheck }, 
    { href: '/dashboard/cr/request-class-booking', label: 'Request Class Slot', icon: UserPlus },
    { href: '/dashboard/cr/class-bookings', label: 'View Class Bookings', icon: Users2 },
  ],
};

// Common navigation links are now empty as per the refined requirement where each role's dashboard serves as their overview.
// Profile and Logout are handled by UserNav dropdown.
export const COMMON_NAV_LINKS: NavItem[] = [];


export const MOCK_LABS: Lab[] = [
  { id: 'physics_lab_alpha', name: 'Physics Lab Alpha', capacity: 20, roomNumber: 'P-101' },
  { id: 'chemistry_lab_beta', name: 'Chemistry Lab Beta', capacity: 15, roomNumber: 'C-205' },
  { id: 'computer_lab_gamma', name: 'Computer Lab Gamma', capacity: 30, roomNumber: 'CS-302' },
  { id: 'electronics_lab_delta', name: 'Electronics Lab Delta', capacity: 18, roomNumber: 'E-110' },
  { id: 'biology_lab_epsilon', name: 'Biology Lab Epsilon', capacity: 25, roomNumber: 'B-G03'},
  { id: 'robotics_lab_zeta', name: 'Robotics Lab Zeta', capacity: 12, roomNumber: 'R-401'},
];

export const MOCK_EQUIPMENT: Equipment[] = [
  { id: 'eq_microscope_01', name: 'Olympus Microscope X2000', type: 'Microscope', labId: 'chemistry_lab_beta', status: 'available' },
  { id: 'eq_oscilloscope_01', name: 'Tektronix TDS1000', type: 'Oscilloscope', labId: 'electronics_lab_delta', status: 'available' },
  { id: 'eq_pc_high_01', name: 'High-Performance PC Dell', type: 'Computer', labId: 'computer_lab_gamma', status: 'in-use' },
  { id: 'eq_projector_01', name: 'Epson Projector 5000', type: 'Projector', status: 'available' }, // General pool
  { id: 'eq_spectrometer_01', name: 'ThermoFisher Spectrometer', type: 'Spectrometer', labId: 'physics_lab_alpha', status: 'maintenance'},
  { id: 'eq_chemical_set_01', name: 'Basic Chemical Set A', type: 'Chemicals', labId: 'chemistry_lab_beta', status: 'available' },
  { id: 'eq_dna_sequencer_01', name: 'Illumina MiSeq', type: 'DNA Sequencer', labId: 'biology_lab_epsilon', status: 'available' },
  { id: 'eq_robot_arm_01', name: 'UR5e Robotic Arm', type: 'Robotics', labId: 'robotics_lab_zeta', status: 'in-use' },
  { id: 'eq_soldering_station_01', name: 'Hakko FX-888D', type: 'Soldering Station', labId: 'electronics_lab_delta', status: 'available' },
  { id: 'eq_whiteboard_01', name: 'Mobile Whiteboard', type: 'Furniture', status: 'available' }, // General pool
  { id: 'eq_laser_module_01', name: 'He-Ne Laser Module', type: 'Laser', labId: 'physics_lab_alpha', status: 'available' },
  { id: 'eq_centrifuge_01', name: 'Eppendorf Centrifuge 5424', type: 'Centrifuge', labId: 'biology_lab_epsilon', status: 'maintenance' },
];

export const MOCK_TIME_SLOTS: TimeSlot[] = [
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

// Mock bookings data
export const MOCK_BOOKINGS: Booking[] = [
  { 
    id: 'b1', 
    labId: 'physics_lab_alpha', 
    date: format(today, "yyyy-MM-dd"),
    timeSlotId: 'ts_0900_1000', 
    userId: 'student1', 
    purpose: 'Physics Experiment A', 
    equipmentIds: ['eq_spectrometer_01'],
    status: 'booked',
    requestedByRole: USER_ROLES.STUDENT,
  },
  { 
    id: 'b2', 
    labId: 'physics_lab_alpha', 
    date: format(today, "yyyy-MM-dd"), 
    timeSlotId: 'ts_1000_1100', 
    userId: 'student2', 
    purpose: 'Quantum Entanglement Study', 
    equipmentIds: ['eq_laser_module_01'],
    status: 'pending',
    requestedByRole: USER_ROLES.STUDENT,
  },
  { 
    id: 'b3', 
    labId: 'chemistry_lab_beta', 
    date: format(tomorrow, "yyyy-MM-dd"), 
    timeSlotId: 'ts_1400_1500', 
    userId: 'faculty1', 
    purpose: 'Chem 101 Class Practical', 
    equipmentIds: ['eq_microscope_01', 'eq_chemical_set_01'],
    status: 'booked',
    requestedByRole: USER_ROLES.FACULTY,
  },
  {
    id: 'b4',
    labId: 'computer_lab_gamma',
    date: format(addDays(today, 2), "yyyy-MM-dd"),
    timeSlotId: 'ts_1100_1200',
    userId: 'cr_user', // Matched CR_USER_ID in class-bookings page
    purpose: 'AI Project Group Work',
    equipmentIds: ['eq_pc_high_01'],
    status: 'booked',
    batchIdentifier: 'CSE Year 2 - Section A',
    requestedByRole: USER_ROLES.CR,
  },
   {
    id: 'b5',
    labId: 'electronics_lab_delta',
    date: format(yesterday, "yyyy-MM-dd"), // Past booking
    timeSlotId: 'ts_1500_1600',
    userId: 'student1',
    purpose: 'Circuit Design Assignment (Completed)',
    equipmentIds: ['eq_oscilloscope_01'],
    status: 'booked', // Keep as booked for history, UI might show as 'Completed'
    requestedByRole: USER_ROLES.STUDENT,
  },
  { // Conflict with b1
    id: 'b6_conflict', 
    labId: 'physics_lab_alpha', 
    date: format(today, "yyyy-MM-dd"),
    timeSlotId: 'ts_0900_1000', 
    userId: 'student_conflict', 
    purpose: 'Optics Setup', 
    equipmentIds: [],
    status: 'booked',
    requestedByRole: USER_ROLES.STUDENT,
  },
  { 
    id: 'b7', 
    labId: 'biology_lab_epsilon', 
    date: format(addDays(today, 3), "yyyy-MM-dd"),
    timeSlotId: 'ts_1300_1400', 
    userId: 'faculty2', 
    purpose: 'Genetics Research Prep', 
    equipmentIds: ['eq_dna_sequencer_01', 'eq_centrifuge_01'], // Centrifuge is in maintenance
    status: 'pending',
    requestedByRole: USER_ROLES.FACULTY,
  },
  {
    id: 'b8',
    labId: 'robotics_lab_zeta',
    date: format(nextMonday, "yyyy-MM-dd"),
    timeSlotId: 'ts_1600_1700',
    userId: 'cr_user',
    purpose: 'Robotics Club Workshop',
    equipmentIds: ['eq_robot_arm_01'],
    status: 'booked',
    batchIdentifier: 'Robotics Club Members',
    requestedByRole: USER_ROLES.CR,
  },
  {
    id: 'b9_cancelled',
    labId: 'computer_lab_gamma',
    date: format(tomorrow, "yyyy-MM-dd"),
    timeSlotId: 'ts_0800_0900',
    userId: 'student3',
    purpose: 'Cancelled Session',
    equipmentIds: [],
    status: 'cancelled',
    requestedByRole: USER_ROLES.STUDENT,
  },
  {
    id: 'b10_faculty_personal',
    labId: 'physics_lab_alpha',
    date: format(addDays(today, 4), "yyyy-MM-dd"),
    timeSlotId: 'ts_1400_1500',
    userId: 'faculty1', // Match CURRENT_FACULTY_ID for "My Bookings"
    purpose: 'Research Paper Experiment',
    equipmentIds: ['eq_spectrometer_01', 'eq_laser_module_01'],
    status: 'booked',
    requestedByRole: USER_ROLES.FACULTY,
  },
   {
    id: 'b11_student_future',
    labId: 'chemistry_lab_beta',
    date: format(addDays(today, 5), "yyyy-MM-dd"),
    timeSlotId: 'ts_1000_1100',
    userId: 'student1', // Match CURRENT_STUDENT_ID for "My Bookings"
    purpose: 'Titration Practice',
    equipmentIds: ['eq_chemical_set_01'],
    status: 'booked',
    requestedByRole: USER_ROLES.STUDENT,
  }
];


// For Lab Availability Viewer
export const DAYS_OF_WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

export const DEPARTMENTS = [
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
] as const;
export type Department = typeof DEPARTMENTS[number];

