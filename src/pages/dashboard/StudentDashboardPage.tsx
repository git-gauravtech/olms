import React from 'react';
import { Link } from 'react-router-dom';
import { useRoleGuard } from '@/hooks/use-role-guard';
import { USER_ROLES } from '@/types';
import { LayoutDashboard, CalendarCheck } from "lucide-react";

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

export default function StudentDashboardPage() {
  const { isAuthorized, isLoading } = useRoleGuard([USER_ROLES.STUDENT, USER_ROLES.CR]);

  if (isLoading) return <div>Loading...</div>;
  if (!isAuthorized) return null;

  return (
    <div>
      <div style={cardStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
           <LayoutDashboard style={{ height: '2rem', width: '2rem', color: '#007BFF' }} />
          <h1 style={{ fontSize: '1.75rem', fontWeight: 'bold' }}>Student Dashboard</h1>
        </div>
        <p style={{ color: '#555', marginTop: '0.5rem' }}>Welcome, Student! Here you can view your lab booking schedule.</p>
      </div>
      <div style={{ maxWidth: '500px', margin: '2rem auto 0 auto' }}> {/* Centered single card */}
        <FeatureCard
          title="View Schedule"
          description="Access a view of your upcoming and past lab sessions. Details include lab name, room, and timing."
          icon={<CalendarCheck style={iconStyle} />}
          linkHref="/dashboard/student/my-bookings"
          linkLabel="View Schedule"
        />
      </div>
       <div style={{...cardStyle, marginTop: '2rem'}}>
        <h2 style={{fontSize: '1.25rem', fontWeight: 600}}>Notifications & Announcements</h2>
        <p style={{color: '#555', marginTop: '0.5rem'}}>Important updates regarding lab schedules, maintenance, or other announcements will appear here. (Placeholder)</p>
      </div>
    </div>
  );
}
