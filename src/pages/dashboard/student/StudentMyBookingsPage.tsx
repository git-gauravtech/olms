import React from 'react';
import { useRoleGuard } from '@/hooks/use-role-guard';
import { USER_ROLES } from '@/types';
import { CalendarClock } from 'lucide-react';

export default function StudentMyBookingsPage() {
  const { isAuthorized, isLoading } = useRoleGuard([USER_ROLES.STUDENT, USER_ROLES.CR]);

  if (isLoading) return <div>Loading...</div>;
  if (!isAuthorized) return null;

  return (
    <div className="custom-card">
      <div className="custom-card-header" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <CalendarClock style={{ height: '2rem', width: '2rem', color: '#007BFF' }} />
        <h1 className="custom-card-title" style={{ fontSize: '1.5rem' }}>My Lab Schedule</h1>
      </div>
      <div className="custom-card-content">
        <p>Student's lab schedule (upcoming and past sessions) will be displayed here.</p>
      </div>
    </div>
  );
}
