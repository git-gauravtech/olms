import React from 'react';
import { useRoleGuard } from '@/hooks/use-role-guard';
import { USER_ROLES } from '@/types';
import { CalendarCheck2 } from 'lucide-react';

export default function FacultyMyBookingsPage() {
  const { isAuthorized, isLoading } = useRoleGuard(USER_ROLES.FACULTY);

  if (isLoading) return <div>Loading...</div>;
  if (!isAuthorized) return null;

  return (
    <div className="custom-card">
      <div className="custom-card-header" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <CalendarCheck2 style={{ height: '2rem', width: '2rem', color: '#007BFF' }} />
        <h1 className="custom-card-title" style={{ fontSize: '1.5rem' }}>My Lab Bookings (Faculty)</h1>
      </div>
      <div className="custom-card-content">
        <p>Faculty's booking history and upcoming sessions will be displayed here.</p>
        {/* Booking cards/list would need custom implementation */}
      </div>
    </div>
  );
}
