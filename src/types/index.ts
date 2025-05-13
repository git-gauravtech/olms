import type { DEPARTMENTS } from "@/constants";

export const USER_ROLES = {
  ADMIN: 'Admin',
  FACULTY: 'Faculty',
  STUDENT: 'Student',
  CR: 'CR', // Class Representative
} as const;

export type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES];

export const ROLES_ARRAY = Object.values(USER_ROLES) as UserRole[];


export interface NavItem {
  label: string;
  href: string;
  icon?: React.ComponentType<{ className?: string }>;
  children?: NavItem[];
}

export interface Lab {
  id: string;
  name: string;
  capacity: number;
}

export interface TimeSlot {
  id: string;
  startTime: string; // e.g., "09:00"
  endTime: string;   // e.g., "10:00"
  displayTime: string; // e.g., "09:00 - 10:00 AM"
}

export interface Booking {
  id: string;
  labId: string;
  date: string; // YYYY-MM-DD
  timeSlotId: string;
  userId: string; // or role-specific identifier
  purpose: string;
  status: 'booked' | 'available' | 'pending'; // Example statuses
}

export type Department = typeof DEPARTMENTS[number];
