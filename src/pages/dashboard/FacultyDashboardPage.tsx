import React from 'react';
import { Link } from 'react-router-dom';
import { useRoleGuard } from '@/hooks/use-role-guard';
import { USER_ROLES } from '@/types';
import { LayoutDashboard, FlaskConical, CalendarPlus, CalendarCheck, Edit } from "lucide-react";

// Placeholder styles - replace with actual CSS
const cardStyle: React.CSSProperties = { border: '1px solid #ccc', padding: '1rem', marginBottom: '1rem', borderRadius: '8px', backgroundColor: 'white' };
const gridStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' };
const iconStyle = { height: '2.5rem', width: '2.5rem', color: '#007BFF', marginBottom: '0.75rem' };
const featureTitleStyle = { fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem' };
const featureDescStyle = { fontSize: '0.875rem', color: '#555', marginBottom: '1rem', flexGrow: 1 };
const featureLinkStyle = { display: 'block', padding: '0.5rem 1rem', backgroundColor: '#007BFF', color: 'white', textDecoration: 'none', borderRadius: '4px', textAlign: 'center' as 'center' };


interface FeatureCardProps { title: string; description: string; icon: React.ReactNode; linkHref: string; linkLabel: string; }
function FeatureCard({ title, description, icon, linkHref, linkLabel }: FeatureCardProps) {
  return (
    <div style={{...cardStyle, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', textAlign: 'center' as 'center'}}>
      <div>
        <div style={{display: 'flex', justifyContent: 'center'}}>{icon}</div>
        <h3 style={featureTitleStyle}>{title}</h3>
        <p style={featureDescStyle}>{description}</p>
      </div>
      <Link to={linkHref} style={featureLinkStyle}>{linkLabel}</Link>
    </div>
  );
}

export default function FacultyDashboardPage() {
  const { isAuthorized, isLoading } = useRoleGuard(USER_ROLES.FACULTY);

  if (isLoading) return <div>Loading...</div>;
  if (!isAuthorized) return null;

  return (
    <div>
      <div style={cardStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <LayoutDashboard style={{ height: '2rem', width: '2rem', color: '#007BFF' }} />
          <h1 style={{ fontSize: '1.75rem', fontWeight: 'bold' }}>Faculty Dashboard</h1>
        </div>
        <p style={{ color: '#555', marginTop: '0.5rem' }}>Welcome, Faculty Member! Manage your lab sessions, bookings, and equipment requests.</p>
      </div>

      <div style={gridStyle}>
        <FeatureCard
          title="Book a Lab Slot"
          description="Schedule individual lab sessions for research, project work, or small group consultations. Request specific equipment during booking."
          icon={<CalendarPlus style={iconStyle} />}
          linkHref="/dashboard/book-slot"
          linkLabel="Book a Slot"
        />
        <FeatureCard
          title="View Lab Availability"
          description="Check the real-time availability of all labs. Use this to plan your sessions or find alternative slots."
          icon={<FlaskConical style={iconStyle} />}
          linkHref="/dashboard/labs"
          linkLabel="Check Availability"
        />
        <FeatureCard
          title="My Bookings"
          description="Review and manage all your scheduled lab sessions, including those pending approval or already completed."
          icon={<CalendarCheck style={iconStyle} />}
          linkHref="/dashboard/faculty/my-bookings"
          linkLabel="View My Bookings"
        />
         <FeatureCard
          title="CR Booking Requests"
          description="Review and approve/reject lab booking requests submitted by Class Representatives."
          icon={<Edit style={iconStyle} />} // Changed Icon
          linkHref="/dashboard/faculty/cr-requests" 
          linkLabel="Manage CR Requests"
        />
      </div>
    </div>
  );
}
