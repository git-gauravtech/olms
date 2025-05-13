import React from 'react';
import { useRoleGuard } from '@/hooks/use-role-guard';
import { USER_ROLES } from '@/types';
import { Users } from 'lucide-react';

export default function RequestClassBookingPage() {
  const { isAuthorized, isLoading } = useRoleGuard(USER_ROLES.CR);

  if (isLoading) return <div>Loading...</div>;
  if (!isAuthorized) return null;

  return (
    <div className="custom-card">
      <div className="custom-card-header" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <Users style={{ height: '2rem', width: '2rem', color: '#007BFF' }} />
        <h1 className="custom-card-title" style={{ fontSize: '1.5rem' }}>Request Lab Slot for Class</h1>
      </div>
      <div className="custom-card-content">
        <p>Form for CR to request lab sessions for their class will be here.</p>
        {/* The form itself would need custom implementation */}
         <form>
            {/* Example field */}
            <div style={{marginBottom: '1rem'}}>
                <label htmlFor="batchName" className="custom-label">Batch/Class Name:</label>
                <input type="text" id="batchName" name="batchName" className="custom-input" />
            </div>
            <button type="submit" className="custom-button custom-button-primary">Submit Request</button>
        </form>
      </div>
    </div>
  );
}
