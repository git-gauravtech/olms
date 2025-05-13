import React from 'react';
import { Link } from 'react-router-dom';
import { useRoleGuard } from '@/hooks/use-role-guard';
import { USER_ROLES } from '@/types';
import { LayoutDashboard, FlaskConical, CalendarCheck, UserPlus } from "lucide-react";

// Placeholder styles
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

export default function CRDashboardPage() {
  const { isAuthorized, isLoading } = useRoleGuard(USER_ROLES.CR);

  if (isLoading) return <div>Loading...</div>;
  if (!isAuthorized) return null;

  return (
    <div>
      <div style={cardStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <LayoutDashboard style={{ height: '2rem', width: '2rem', color: '#007BFF' }} />
          <h1 style={{ fontSize: '1.75rem', fontWeight: 'bold' }}>Class Representative Dashboard</h1>
        </div>
        <p style={{ color: '#555', marginTop: '0.5rem' }}>Welcome, CR! Manage lab bookings for your class and your individual needs.</p>
      </div>

      <div style={gridStyle}>
        <FeatureCard
          title="View My Schedule"
          description="View your personal lab booking history and upcoming individual sessions."
          icon={<CalendarCheck style={iconStyle} />}
          linkHref="/dashboard/student/my-bookings" 
          linkLabel="View My Schedule"
        />
        <FeatureCard
          title="Request Class Lab Slot"
          description="Submit requests for lab sessions for your entire batch, specifying time, lab type, and equipment needs."
          icon={<UserPlus style={iconStyle} />}
          linkHref="/dashboard/cr/request-class-booking"
          linkLabel="Request for Class"
        />
        <FeatureCard
          title="Lab Availability"
          description="Check the weekly schedule for all labs to plan class sessions or individual study time."
          icon={<FlaskConical style={iconStyle} />}
          linkHref="/dashboard/labs"
          linkLabel="Check Lab Availability"
        />
      </div>
    </div>
  );
}
