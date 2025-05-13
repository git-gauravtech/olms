import React from 'react';
import { useRoleGuard } from '@/hooks/use-role-guard';
import { USER_ROLES } from '@/types';
import { CalendarDays } from 'lucide-react';

export default function ViewBookingsPage() {
  const { isAuthorized, isLoading } = useRoleGuard(USER_ROLES.ADMIN);

  if (isLoading) return <div>Loading...</div>;
  if (!isAuthorized) return null;

  return (
    <div className="custom-card">
      <div className="custom-card-header" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <CalendarDays style={{ height: '2rem', width: '2rem', color: '#007BFF' }} />
        <h1 className="custom-card-title" style={{ fontSize: '1.5rem' }}>View All Bookings</h1>
      </div>
      <div className="custom-card-content">
        <p>Interface to view all bookings and conflicts will be here.</p>
        {/* Table to display bookings would need custom implementation */}
      </div>
    </div>
  );
}
