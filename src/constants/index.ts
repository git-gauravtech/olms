import type { NavItem, UserRole, Lab, TimeSlot, Booking, Equipment } from '@/types';
import { USER_ROLES } from '@/types';
import { LayoutDashboard, FlaskConical, CalendarPlus, Users, Settings2, CalendarCheck, Users2, UserCircle, LogOut, BookOpen, Home, Wrench, CalendarDays, BrainCircuit, UserCog, ClipboardList, UserPlus } from 'lucide-react';

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
    { href: '/dashboard/book-slot', label: 'Book a Slot', icon: CalendarPlus }, // Individual booking
    { href: '/dashboard/faculty/my-bookings', label: 'My Bookings', icon: CalendarCheck },
  ],
  [USER_ROLES.STUDENT]: [
    { href: '/dashboard/student', label: 'Student Dashboard', icon: LayoutDashboard },
    { href: '/dashboard/labs', label: 'Lab Availability', icon: FlaskConical },
    { href: '/dashboard/book-slot', label: 'Book a Slot', icon: CalendarPlus }, // Individual booking
    { href: '/dashboard/student/my-bookings', label: 'My Bookings', icon: CalendarCheck },
  ],
  [USER_ROLES.CR]: [
    { href: '/dashboard/cr', label: 'CR Dashboard', icon: LayoutDashboard },
    { href: '/dashboard/labs', label: 'Lab Availability', icon: FlaskConical },
    { href: '/dashboard/book-slot', label: 'My Individual Booking', icon: CalendarPlus }, // Personal booking
    { href: '/dashboard/student/my-bookings', label: 'My Bookings (View)', icon: CalendarCheck }, // CR's personal bookings (uses student page)
    { href: '/dashboard/cr/request-class-booking', label: 'Request Class Slot', icon: UserPlus }, // New page for CR batch booking
    { href: '/dashboard/cr/class-bookings', label: 'View Class Bookings', icon: Users2 }, // Existing page, for viewing class bookings
  ],
};

export const COMMON_NAV_LINKS: NavItem[] = [
  { href: '/dashboard/overview', label: 'Overview', icon: Home },
  // { href: '/dashboard/labs', label: 'Lab Availability', icon: BookOpen }, // Covered by role-specific links
  // { href: '/dashboard/book-slot', label: 'Book a Slot', icon: CalendarPlus }, // Covered by role-specific links
];


export const MOCK_LABS: Lab[] = [
  { id: 'physics_lab_alpha', name: 'Physics Lab Alpha', capacity: 20, roomNumber: 'P-101' },
  { id: 'chemistry_lab_beta', name: 'Chemistry Lab Beta', capacity: 15, roomNumber: 'C-205' },
  { id: 'computer_lab_gamma', name: 'Computer Lab Gamma', capacity: 30, roomNumber: 'CS-302' },
  { id: 'electronics_lab_delta', name: 'Electronics Lab Delta', capacity: 18, roomNumber: 'E-110' },
];

export const MOCK_EQUIPMENT: Equipment[] = [
  { id: 'eq_microscope_01', name: 'Olympus Microscope X2000', type: 'Microscope', labId: 'chemistry_lab_beta', status: 'available' },
  { id: 'eq_oscilloscope_01', name: 'Tektronix TDS1000', type: 'Oscilloscope', labId: 'electronics_lab_delta', status: 'available' },
  { id: 'eq_pc_high_01', name: 'High-Performance PC Dell', type: 'Computer', labId: 'computer_lab_gamma', status: 'in-use' },
  { id: 'eq_projector_01', name: 'Epson Projector 5000', type: 'Projector', status: 'available' }, // General pool
  { id: 'eq_spectrometer_01', name: 'ThermoFisher Spectrometer', type: 'Spectrometer', labId: 'physics_lab_alpha', status: 'maintenance'},
  { id: 'eq_chemical_set_01', name: 'Basic Chemical Set A', type: 'Chemicals', labId: 'chemistry_lab_beta', status: 'available' },
];

export const MOCK_TIME_SLOTS: TimeSlot[] = [
  { id: 'ts_0900_1000', startTime: '09:00', endTime: '10:00', displayTime: '09:00 AM - 10:00 AM' },
  { id: 'ts_1000_1100', startTime: '10:00', endTime: '11:00', displayTime: '10:00 AM - 11:00 AM' },
  { id: 'ts_1100_1200', startTime: '11:00', endTime: '12:00', displayTime: '11:00 AM - 12:00 PM' },
  { id: 'ts_1300_1400', startTime: '13:00', endTime: '14:00', displayTime: '01:00 PM - 02:00 PM' },
  { id: 'ts_1400_1500', startTime: '14:00', endTime: '15:00', displayTime: '02:00 PM - 03:00 PM' },
  { id: 'ts_1500_1600', startTime: '15:00', endTime: '16:00', displayTime: '03:00 PM - 04:00 PM' },
  { id: 'ts_1600_1700', startTime: '16:00', endTime: '17:00', displayTime: '04:00 PM - 05:00 PM' },
];

// Mock bookings data
export const MOCK_BOOKINGS: Booking[] = [
  { 
    id: 'b1', 
    labId: 'physics_lab_alpha', 
    date: '2024-07-29', // Example: use a dynamic date for "today" or "this week" for better demo
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
    date: '2024-07-29', 
    timeSlotId: 'ts_1000_1100', 
    userId: 'student2', 
    purpose: 'Quantum Entanglement Study', 
    equipmentIds: [],
    status: 'pending',
    requestedByRole: USER_ROLES.STUDENT,
  },
  { 
    id: 'b3', 
    labId: 'chemistry_lab_beta', 
    date: '2024-07-30', 
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
    date: '2024-07-31',
    timeSlotId: 'ts_1100_1200',
    userId: 'cr_cse_year2',
    purpose: 'AI Project Group Work',
    equipmentIds: ['eq_pc_high_01'],
    status: 'booked',
    batchIdentifier: 'CSE Year 2 - Section A',
    requestedByRole: USER_ROLES.CR,
  },
   {
    id: 'b5',
    labId: 'electronics_lab_delta',
    date: '2024-08-01',
    timeSlotId: 'ts_1500_1600',
    userId: 'student5',
    purpose: 'Circuit Design Assignment',
    equipmentIds: ['eq_oscilloscope_01'],
    status: 'cancelled',
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
  'Other',
] as const;
export type Department = typeof DEPARTMENTS[number];
