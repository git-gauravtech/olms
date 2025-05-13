import React from 'react';
import { useRoleGuard } from '@/hooks/use-role-guard';
import { USER_ROLES } from '@/types';
import { FileCheck } from 'lucide-react';

export default function CrRequestsPage() {
  const { isAuthorized, isLoading } = useRoleGuard(USER_ROLES.FACULTY);

  if (isLoading) return <div>Loading...</div>;
  if (!isAuthorized) return null;

  return (
    <div className="custom-card">
      <div className="custom-card-header" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <FileCheck style={{ height: '2rem', width: '2rem', color: '#007BFF' }} />
        <h1 className="custom-card-title" style={{ fontSize: '1.5rem' }}>CR Booking Requests</h1>
      </div>
      <div className="custom-card-content">
        <p>Interface for faculty to review and approve/reject CR booking requests.</p>
      </div>
    </div>
  );
}
