import React from 'react';
import { LoginForm } from "@/components/auth/login-form";
import { Link } from 'react-router-dom';

export default function LoginPage() {
  const pageStyle: React.CSSProperties = {
    display: 'flex',
    minHeight: '100vh',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    // Basic gradient, replace with actual CSS if needed
    background: 'linear-gradient(to bottom right, rgba(0,123,255,0.1), white, rgba(32,201,151,0.1))',
    padding: '1rem',
  };

  const linkStyle: React.CSSProperties = {
    fontWeight: 600,
    color: '#007BFF', // primary color
    textDecoration: 'none'
  };
  
  const hoverLinkStyle: React.CSSProperties = {
    textDecoration: 'underline'
  };


  return (
    <main style={pageStyle}>
      <LoginForm />
       <p style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.875rem', color: '#6c757d' }}>
        Don&apos;t have an account?{" "}
        <Link 
          to="/signup" 
          style={linkStyle}
          onMouseEnter={(e) => (e.currentTarget.style.textDecoration = hoverLinkStyle.textDecoration)}
          onMouseLeave={(e) => (e.currentTarget.style.textDecoration = linkStyle.textDecoration)}
        >
          Sign up
        </Link>
      </p>
    </main>
  );
}
