import React from 'react';
import { User } from "lucide-react"; // Assuming lucide-react is kept

// Minimal styles, replace with proper CSS
const containerStyle: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: '2rem', maxWidth: '768px', margin: '0 auto' };
const titleStyle: React.CSSProperties = { fontSize: '1.875rem', fontWeight: 'bold', color: '#333' };
const cardStyle: React.CSSProperties = { 
    border: '1px solid #ddd', 
    borderRadius: '8px', 
    padding: '1.5rem', 
    backgroundColor: 'white',
    boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
};
const cardHeaderStyle: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' };
const avatarStyle: React.CSSProperties = { 
    height: '5rem', 
    width: '5rem', 
    borderRadius: '50%', 
    backgroundColor: '#007BFF', 
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '2rem',
    border: '2px solid #007BFF'
};
const cardTitleStyle: React.CSSProperties = { fontSize: '1.5rem', fontWeight: 600 };
const cardDescriptionStyle: React.CSSProperties = { fontSize: '0.875rem', color: '#666' };
const formFieldStyle: React.CSSProperties = { marginBottom: '1rem' };
const labelStyle: React.CSSProperties = { display: 'block', marginBottom: '0.25rem', fontWeight: 500 };
const inputStyle: React.CSSProperties = { 
    width: 'calc(100% - 1.5rem)', 
    padding: '0.5rem 0.75rem', 
    border: '1px solid #ccc', 
    borderRadius: '4px',
    fontSize: '1rem'
};
const buttonStyle: React.CSSProperties = {
    padding: '0.6rem 1.2rem',
    backgroundColor: '#007BFF',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '0.875rem'
};

export default function ProfilePage() {
  return (
    <div style={containerStyle}>
      <h1 style={titleStyle}>User Profile</h1>
      
      <div style={cardStyle}>
        <div style={cardHeaderStyle}>
          <div style={avatarStyle}>
            {/* Placeholder Avatar Image or Fallback */}
            {/* <img src="/placeholder-avatar.jpg" alt="User avatar" style={{width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%'}} data-ai-hint="person avatar" /> */}
             U {/* Fallback Initial */}
          </div>
          <div>
            <h2 style={cardTitleStyle}>Optimized Lab Management System User</h2>
            <p style={cardDescriptionStyle}>user@example.com</p>
          </div>
        </div>
        <div style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
          <div style={formFieldStyle}>
            <label htmlFor="name" style={labelStyle}>Full Name</label>
            <input id="name" defaultValue="Optimized Lab Management System User" style={inputStyle} />
          </div>
          <div style={formFieldStyle}>
            <label htmlFor="email" style={labelStyle}>Email Address</label>
            <input id="email" type="email" defaultValue="user@example.com" disabled style={inputStyle} />
          </div>
          <div style={formFieldStyle}>
            <label htmlFor="role" style={labelStyle}>Role</label>
            <input id="role" defaultValue="Student" disabled style={inputStyle} />
          </div>
          <div style={formFieldStyle}>
            <label htmlFor="department" style={labelStyle}>Department (Optional)</label>
            <input id="department" placeholder="e.g., Computer Science" style={inputStyle} />
          </div>
          <button style={buttonStyle}>
            Update Profile
          </button>
        </div>
      </div>

       <div style={cardStyle}>
        <h2 style={{...cardTitleStyle, marginBottom: '1rem'}}>Security Settings</h2>
        <div style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
           <div>
            <button style={{...buttonStyle, backgroundColor: 'transparent', border: '1px solid #007BFF', color: '#007BFF'}}>Change Password</button>
           </div>
           <div>
             <p style={{fontSize: '0.875rem', color: '#666'}}>Two-Factor Authentication: Not Configured</p>
           </div>
        </div>
      </div>
    </div>
  );
}
