import React from 'react';
import { Link } from 'react-router-dom';
import { useRoleGuard } from '@/hooks/use-role-guard';
import { USER_ROLES } from '@/types';
import { Settings2, Wrench, UserCog, CalendarDays, BrainCircuit, LayoutDashboard, ClipboardList } from "lucide-react";

// Basic styling for cards - move to CSS file in a real app
const cardStyle: React.CSSProperties = {
  border: '1px solid #e2e8f0',
  borderRadius: '0.5rem',
  padding: '1.5rem',
  marginBottom: '1.5rem',
  backgroundColor: 'white',
  boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)',
};

const featureCardContainerStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '1.5rem',
};

const featureCardStyle: React.CSSProperties = {
  ...cardStyle,
  textAlign: 'center',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between',
};

const featureCardIconStyle: React.CSSProperties = {
    marginBottom: '0.75rem',
    color: '#007BFF', // Primary color
};

const featureCardTitleStyle: React.CSSProperties = {
    fontSize: '1.25rem', // text-xl
    fontWeight: 600,
    marginBottom: '0.5rem',
};
const featureCardDescriptionStyle: React.CSSProperties = {
    fontSize: '0.875rem', // text-sm
    color: '#4A5568', // text-muted-foreground
    flexGrow: 1,
    marginBottom: '1rem',
};
const featureCardLinkStyle: React.CSSProperties = {
    display: 'block',
    width: '100%',
    padding: '0.75rem 1rem',
    backgroundColor: '#007BFF', // Primary color
    color: 'white',
    textDecoration: 'none',
    borderRadius: '0.375rem', // rounded-md
    transition: 'background-color 0.2s',
};


interface FeatureCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  linkHref: string;
  linkLabel: string;
}

function FeatureCard({ title, description, icon, linkHref, linkLabel }: FeatureCardProps) {
  return (
    <div style={featureCardStyle}>
      <div>
        <div style={featureCardIconStyle}>{icon}</div>
        <h3 style={featureCardTitleStyle}>{title}</h3>
        <p style={featureCardDescriptionStyle}>{description}</p>
      </div>
      <Link to={linkHref} style={featureCardLinkStyle} 
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#0056b3'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#007BFF'}>
        {linkLabel}
      </Link>
    </div>
  );
}

export default function AdminDashboardPage() {
  const { isAuthorized, isLoading } = useRoleGuard(USER_ROLES.ADMIN);

  if (isLoading) {
    return <div>Loading...</div>; // Replace with a proper skeleton loader if needed
  }

  if (!isAuthorized) {
    return null; 
  }

  return (
    <div style={{ padding: '1rem 0' }}> {/* container py-10 space-y-8 */}
      <div style={cardStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
          <LayoutDashboard style={{ height: '2rem', width: '2rem', color: '#007BFF' }} />
          <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold' }}>Admin Dashboard</h1>
        </div>
        <p style={{ fontSize: '1.125rem', color: '#4A5568', marginBottom: '1rem' }}> {/* text-lg text-muted-foreground */}
          Welcome, Admin! This is your central control panel for managing the Optimized Lab Management System.
        </p>
        <p style={{ color: '#718096' }}> {/* text-muted-foreground */}
          From here, you can oversee all aspects of the lab management system, including lab and equipment configurations, user accounts, bookings, and system optimizations.
        </p>
      </div>

      <div style={featureCardContainerStyle}>
        <FeatureCard
          title="Manage Labs"
          description="Configure lab details, capacities, and room assignments. Add new labs or modify existing ones."
          icon={<Settings2 style={{ height: '2.5rem', width: '2.5rem' }} />}
          linkHref="/dashboard/admin/manage-labs"
          linkLabel="Go to Lab Management"
        />
        <FeatureCard
          title="Manage Equipment"
          description="Oversee laboratory equipment, including inventory, status, and assignments to specific labs or general pool."
          icon={<Wrench style={{ height: '2.5rem', width: '2.5rem' }} />}
          linkHref="/dashboard/admin/manage-equipment"
          linkLabel="Go to Equipment Management"
        />
        <FeatureCard
          title="Manage Users"
          description="Administer user accounts, roles, and permissions for students, faculty, and CRs."
          icon={<UserCog style={{ height: '2.5rem', width: '2.5rem' }} />}
          linkHref="/dashboard/admin/manage-users" // This page needs to be created
          linkLabel="Go to User Management"
        />
        <FeatureCard
          title="View All Bookings"
          description="Monitor all lab bookings across the system. Identify and manage scheduling conflicts."
          icon={<CalendarDays style={{ height: '2.5rem', width: '2.5rem' }} />}
          linkHref="/dashboard/admin/view-bookings"
          linkLabel="Go to Bookings Overview"
        />
         <FeatureCard
          title="Faculty Requests"
          description="Review and manage reschedule or special booking requests submitted by faculty members."
          icon={<ClipboardList style={{ height: '2.5rem', width: '2.5rem' }} />}
          linkHref="/dashboard/admin/faculty-requests"
          linkLabel="View Faculty Requests"
        />
        <FeatureCard
          title="Run Algorithms"
          description="Execute diagnostic and optimization algorithms for scheduling, resource allocation, and lab usage."
          icon={<BrainCircuit style={{ height: '2.5rem', width: '2.5rem' }} />}
          linkHref="/dashboard/admin/run-algorithms"
          linkLabel="Go to Algorithm Console"
        />
      </div>
    </div>
  );
}
