import React from 'react';
import { useRoleGuard } from '@/hooks/use-role-guard';
import { USER_ROLES } from '@/types';
import { Wrench } from 'lucide-react';

export default function ManageEquipmentPage() {
  const { isAuthorized, isLoading } = useRoleGuard(USER_ROLES.ADMIN);

  if (isLoading) return <div>Loading...</div>;
  if (!isAuthorized) return null;

  return (
    <div className="custom-card">
      <div className="custom-card-header" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <Wrench style={{ height: '2rem', width: '2rem', color: '#007BFF' }} />
        <h1 className="custom-card-title" style={{ fontSize: '1.5rem' }}>Manage Equipment</h1>
      </div>
      <div className="custom-card-content">
        <p>Equipment management interface will be here. (Add, Edit, Delete Equipment)</p>
        <button className="custom-button custom-button-primary" style={{marginTop: '1rem'}}>Add New Equipment (Placeholder)</button>
      </div>
    </div>
  );
}
