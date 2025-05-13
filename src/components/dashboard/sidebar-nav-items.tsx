import * as React from "react";
import { Link, useLocation } from "react-router-dom"; // Changed from next/link and next/navigation
import type { NavItem, UserRole } from "@/types";
import { COMMON_NAV_LINKS, NAV_LINKS } from "@/constants";
import { useEffect, useState } from "react";

// Basic styling for nav items - move to a CSS file in a real app
const navListStyle: React.CSSProperties = {
  listStyle: "none",
  padding: 0,
  margin: 0,
};

const navItemStyle: React.CSSProperties = {
  marginBottom: "0.5rem",
};

const navLinkStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  padding: "0.75rem 1rem",
  borderRadius: "0.375rem",
  textDecoration: "none",
  color: "#333", // Default text color
  transition: "background-color 0.2s, color 0.2s",
};

const activeNavLinkStyle: React.CSSProperties = {
  ...navLinkStyle,
  backgroundColor: "#007BFF", // Primary color for active
  color: "white",
  fontWeight: 500,
};

const hoverNavLinkStyle: React.CSSProperties = { // For non-active links
  backgroundColor: "#e9ecef", // Light hover
};

const iconStyle: React.CSSProperties = {
  marginRight: "0.75rem",
  height: "1.25rem",
  width: "1.25rem",
};

const skeletonItemStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  padding: '0.75rem 1rem',
  marginBottom: '0.5rem',
};

const skeletonIconStyle: React.CSSProperties = {
  height: '1.25rem',
  width: '1.25rem',
  marginRight: '0.75rem',
  backgroundColor: '#e0e0e0',
  borderRadius: '4px',
};

const skeletonTextStyle: React.CSSProperties = {
  height: '1rem',
  width: '80px',
  backgroundColor: '#e0e0e0',
  borderRadius: '4px',
};


export function SidebarNavItems() {
  const location = useLocation(); // Changed from usePathname
  const pathname = location.pathname;
  const [currentRole, setCurrentRole] = useState<UserRole | null>(null);
  const [isLoadingRole, setIsLoadingRole] = useState(true);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedRole = localStorage.getItem('userRole') as UserRole | null;
      setCurrentRole(storedRole);
      setIsLoadingRole(false);
    }
  }, []);

  if (isLoadingRole) {
    return (
      <ul style={navListStyle}>
        {[...Array(4)].map((_, i) => (
          <li key={i} style={navItemStyle}>
            <div style={skeletonItemStyle}>
              <div style={skeletonIconStyle} />
              <div style={skeletonTextStyle} />
            </div>
          </li>
        ))}
      </ul>
    );
  }

  const getNavItems = (): NavItem[] => {
    if (currentRole && NAV_LINKS[currentRole]) {
      return NAV_LINKS[currentRole];
    }
    return COMMON_NAV_LINKS; 
  };

  const navItems = getNavItems();

  if (!navItems || navItems.length === 0) {
    return null; 
  }

  return (
    <ul style={navListStyle}>
      {navItems.map((item) => {
        const IconComponent = item.icon;
        const isActive = pathname === item.href || (item.href !== '/dashboard/overview' && pathname.startsWith(item.href));
        
        return (
          <li key={item.href} style={navItemStyle}>
            <Link 
              to={item.href} 
              style={isActive ? activeNavLinkStyle : navLinkStyle}
              onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.backgroundColor = hoverNavLinkStyle.backgroundColor; }}
              onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.backgroundColor = 'transparent'; }}
              title={item.label} // Tooltip
            >
              {IconComponent && <IconComponent style={iconStyle} />}
              <span style={{whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}>{item.label}</span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
