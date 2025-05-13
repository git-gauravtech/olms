import React from "react";
import { Outlet } from "react-router-dom";
import { SidebarNavItems } from "@/components/dashboard/sidebar-nav-items";
import { UserNav } from "@/components/dashboard/user-nav";
import { AtomIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile"; // Assuming this hook is still valid

// Basic styling for the layout, move to CSS for a real app
const layoutStyle: React.CSSProperties = {
  display: "flex",
  minHeight: "100vh",
};

const sidebarStyle: React.CSSProperties = {
  width: "250px", // Fixed width for sidebar
  borderRight: "1px solid #ccc",
  backgroundColor: "#f8f9fa", // Light grey
  padding: "1rem",
  display: "flex",
  flexDirection: "column",
};

const sidebarHeaderStyle: React.CSSProperties = {
  padding: "1rem",
  borderBottom: "1px solid #ccc",
  marginBottom: "1rem",
};

const sidebarLinkStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "0.5rem",
  textDecoration: "none",
  color: "inherit",
};

const sidebarTitleStyle: React.CSSProperties = {
  fontSize: "1.25rem",
  fontWeight: 600,
};

const mainContentStyle: React.CSSProperties = {
  flex: 1,
  display: "flex",
  flexDirection: "column",
};

const headerStyle: React.CSSProperties = {
  position: "sticky",
  top: 0,
  zIndex: 10,
  height: "4rem", // 64px
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  borderBottom: "1px solid #ddd",
  backgroundColor: "white", // Background for header
  padding: "0 1.5rem",
  boxShadow: "0 1px 2px 0 rgba(0,0,0,0.05)",
};

const contentAreaStyle: React.CSSProperties = {
  flex: 1,
  padding: "2.5rem", // p-10
  overflowY: "auto", // Allow content to scroll
  backgroundColor: "#e9ecef" // Slightly different background for content area
};


export default function DashboardLayout() {
  const isMobile = useIsMobile(); // This hook might need adjustment if it relies on Next.js specifics
  const [sidebarOpen, setSidebarOpen] = React.useState(!isMobile);

  // Simplified sidebar toggle for mobile
  const toggleSidebar = () => {
    if (isMobile) {
      setSidebarOpen(!sidebarOpen);
    }
    // Desktop sidebar might be always open or have a different toggle mechanism
  };
  
  const mobileSidebarStyle: React.CSSProperties = {
    ...sidebarStyle,
    position: 'fixed',
    left: sidebarOpen ? 0 : '-100%',
    top: 0,
    height: '100%',
    zIndex: 20,
    transition: 'left 0.3s ease-in-out',
     boxShadow: '2px 0 5px rgba(0,0,0,0.1)',
  };


  return (
    <div style={layoutStyle}>
      {isMobile && sidebarOpen && (
        <div 
          onClick={toggleSidebar}
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 19 }} 
        />
      )}
      <div style={isMobile ? mobileSidebarStyle : sidebarStyle}>
        <div style={sidebarHeaderStyle}>
          <Link to="/dashboard/overview" style={sidebarLinkStyle}>
            <AtomIcon style={{ height: "2rem", width: "2rem", color: "#007BFF" }} />
            <span style={sidebarTitleStyle}>Optimized Lab Management</span>
          </Link>
        </div>
        <nav style={{ flexGrow: 1, overflowY: 'auto' }}>
          <SidebarNavItems />
        </nav>
        {/* Optional Footer content can go here */}
      </div>

      <main style={mainContentStyle}>
        <header style={headerStyle}>
          {isMobile && (
            <button onClick={toggleSidebar} style={{background: 'none', border: 'none', cursor: 'pointer', padding: '0.5rem'}}>
              {/* Basic Menu Icon (replace with Lucide or SVG if preferred) */}
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
            </button>
          )}
          <div style={{ marginLeft: 'auto' }}> {/* Pushes UserNav to the right */}
            <UserNav />
          </div>
        </header>
        <div style={contentAreaStyle}>
          <Outlet /> {/* This is where nested routes will render */}
        </div>
      </main>
    </div>
  );
}

