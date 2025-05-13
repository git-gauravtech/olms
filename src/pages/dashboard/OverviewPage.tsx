import React from 'react';
import { CheckCircle, Clock, FlaskConical, Users } from "lucide-react";

// Minimal styles, replace with proper CSS
const containerStyle: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: '2rem' };
const titleStyle: React.CSSProperties = { fontSize: '1.875rem', fontWeight: 'bold', color: '#333' };
const gridStyle: React.CSSProperties = { display: 'grid', gap: '1.5rem', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' };
const cardStyle: React.CSSProperties = { 
    border: '1px solid #ddd', 
    borderRadius: '8px', 
    padding: '1rem', 
    backgroundColor: 'white',
    boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
};
const cardHeaderStyle: React.CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' };
const cardTitleStyle: React.CSSProperties = { fontSize: '0.875rem', fontWeight: 500 };
const cardContentValueStyle: React.CSSProperties = { fontSize: '1.5rem', fontWeight: 'bold' };
const cardContentDescStyle: React.CSSProperties = { fontSize: '0.75rem', color: '#666' };
const iconStyle = { height: '1.25rem', width: '1.25rem' };

export default function OverviewPage() {
  return (
    <div style={containerStyle}>
      <h1 style={titleStyle}>Dashboard Overview</h1>
      
      <div style={gridStyle}>
        <div style={cardStyle}>
          <div style={cardHeaderStyle}>
            <h3 style={cardTitleStyle}>Total Labs</h3>
            <FlaskConical style={{...iconStyle, color: '#007BFF'}} />
          </div>
          <div>
            <div style={cardContentValueStyle}>3</div>
            <p style={cardContentDescStyle}>Available for booking</p>
          </div>
        </div>
        <div style={cardStyle}>
          <div style={cardHeaderStyle}>
            <h3 style={cardTitleStyle}>Upcoming Bookings</h3>
            <Clock style={{...iconStyle, color: '#20C997'}} />
          </div>
          <div>
            <div style={cardContentValueStyle}>5</div>
            <p style={cardContentDescStyle}>In the next 7 days</p>
          </div>
        </div>
        <div style={cardStyle}>
          <div style={cardHeaderStyle}>
            <h3 style={cardTitleStyle}>Active Users</h3>
            <Users style={{...iconStyle, color: '#007BFF'}} />
          </div>
          <div>
            <div style={cardContentValueStyle}>120</div>
            <p style={cardContentDescStyle}>Students and Faculty</p>
          </div>
        </div>
        <div style={cardStyle}>
          <div style={cardHeaderStyle}>
            <h3 style={cardTitleStyle}>System Status</h3>
            <CheckCircle style={{...iconStyle, color: 'green'}} />
          </div>
          <div>
            <div style={cardContentValueStyle}>Operational</div>
            <p style={cardContentDescStyle}>All systems normal</p>
          </div>
        </div>
      </div>

      <div style={cardStyle}>
        <h2 style={{...cardTitleStyle, fontSize: '1.25rem', marginBottom: '0.5rem'}}>Recent Activity</h2>
        <p style={{...cardContentDescStyle, marginBottom: '1rem'}}>Latest bookings and system notifications.</p>
        <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <li style={{ display: 'flex', alignItems: 'center' }}>
            <FlaskConical style={{...iconStyle, marginRight: '0.5rem', color: '#6c757d'}} />
            <span style={{fontSize: '0.875rem'}}>Physics Lab Alpha booked by Student X for 2-3 PM.</span>
          </li>
          <li style={{ display: 'flex', alignItems: 'center' }}>
            <Users style={{...iconStyle, marginRight: '0.5rem', color: '#6c757d'}} />
            <span style={{fontSize: '0.875rem'}}>New user 'Faculty Y' registered.</span>
          </li>
          <li style={{ display: 'flex', alignItems: 'center' }}>
            <FlaskConical style={{...iconStyle, marginRight: '0.5rem', color: '#6c757d'}} />
            <span style={{fontSize: '0.875rem'}}>Computer Lab Gamma booked by CR Z for group study 9-11 AM.</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
