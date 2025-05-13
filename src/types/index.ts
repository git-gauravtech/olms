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
  roomNumber: string; // Added roomNumber
}

export interface Equipment {
  id: string;
  name: string;
  type: string; // e.g., 'Microscope', 'Computer', 'Chemicals'
  labId?: string; // Optional: if specific to a lab
  status: 'available' | 'in-use' | 'maintenance';
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
  equipmentIds: string[]; // Added equipmentIds
  status: 'booked' | 'available' | 'pending' | 'cancelled' | 'rejected'; // Example statuses, added 'cancelled', 'rejected'
  batchIdentifier?: string; // For CR class bookings
  requestedByRole?: UserRole; // To identify who made the booking if needed
}

export type Department = typeof DEPARTMENTS[number];

export interface RescheduleRequest {
  id: string;
  requestingUserId: string; // facultyId
  requestingUserRole: UserRole;
  originalBookingId?: string; // If they are requesting to reschedule an existing booking
  conflictingLabId: string;
  conflictingDate: string; // YYYY-MM-DD
  conflictingTimeSlotId: string;
  reason: string; // faculty provides this
  status: 'pending' | 'reviewed' | 'resolved' | 'rejected';
  requestedAt: string; // ISO date string
}
