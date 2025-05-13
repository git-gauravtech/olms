import React from 'react';
import { useRoleGuard } from '@/hooks/use-role-guard';
import { USER_ROLES } from '@/types';
import { ClipboardList } from 'lucide-react';

export default function FacultyRequestsPage() {
  const { isAuthorized, isLoading } = useRoleGuard(USER_ROLES.ADMIN);

  if (isLoading) return <div>Loading...</div>;
  if (!isAuthorized) return null;

  return (
    <div className="custom-card">
      <div className="custom-card-header" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <ClipboardList style={{ height: '2rem', width: '2rem', color: '#007BFF' }} />
        <h1 className="custom-card-title" style={{ fontSize: '1.5rem' }}>Faculty Reschedule Requests</h1>
      </div>
      <div className="custom-card-content">
        <p>Interface to manage faculty reschedule requests will be here.</p>
      </div>
    </div>
  );
}
