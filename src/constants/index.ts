import type { NavItem, UserRole, Lab, TimeSlot } from '@/types';
import { USER_ROLES } from '@/types';
import { LayoutDashboard, FlaskConical, CalendarPlus, Users, Settings2, CalendarCheck, Users2, UserCircle, LogOut, BookOpen, Home, Wrench, CalendarDays, BrainCircuit, UserCog } from 'lucide-react';

export const NAV_LINKS: Record<UserRole, NavItem[]> = {
  [USER_ROLES.ADMIN]: [
    { href: '/dashboard/admin', label: 'Admin Dashboard', icon: LayoutDashboard },
    { href: '/dashboard/admin/manage-labs', label: 'Manage Labs', icon: Settings2 },
    { href: '/dashboard/admin/manage-equipment', label: 'Manage Equipment', icon: Wrench },
    { href: '/dashboard/admin/manage-users', label: 'Manage Users', icon: UserCog },
    { href: '/dashboard/admin/view-bookings', label: 'Bookings & Conflicts', icon: CalendarDays },
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
    { href: '/dashboard/labs', label: 'Lab Availability', icon: FlaskConical },
    { href: '/dashboard/book-slot', label: 'Book a Slot', icon: CalendarPlus },
    { href: '/dashboard/student/my-bookings', label: 'My Bookings', icon: CalendarCheck },
  ],
  [USER_ROLES.CR]: [
    { href: '/dashboard/cr', label: 'CR Dashboard', icon: LayoutDashboard },
    { href: '/dashboard/labs', label: 'Lab Availability', icon: FlaskConical },
    { href: '/dashboard/book-slot', label: 'Book a Slot', icon: CalendarPlus },
    { href: '/dashboard/cr/class-bookings', label: 'Class Bookings', icon: Users2 },
  ],
};

export const COMMON_NAV_LINKS: NavItem[] = [
  { href: '/dashboard/overview', label: 'Overview', icon: Home },
  { href: '/dashboard/labs', label: 'Lab Availability', icon: BookOpen },
  { href: '/dashboard/book-slot', label: 'Book a Slot', icon: CalendarPlus },
];


export const MOCK_LABS: Lab[] = [
  { id: 'physics_lab', name: 'Physics Lab Alpha', capacity: 20 },
  { id: 'chemistry_lab', name: 'Chemistry Lab Beta', capacity: 15 },
  { id: 'computer_lab', name: 'Computer Lab Gamma', capacity: 30 },
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
