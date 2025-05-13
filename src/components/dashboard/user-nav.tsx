import React, { useEffect, useState, useRef } from "react";
import { useNavigate, Link } from "react-router-dom"; // Changed from next/navigation
import type { UserRole } from "@/types";
import { LogOut, UserCircle } from "lucide-react";

// Basic styling - move to CSS file for a real app
const userNavStyle: React.CSSProperties = {
  position: "relative",
  display: "inline-block",
};

const avatarButtonStyle: React.CSSProperties = {
  cursor: "pointer",
  background: "none",
  border: "none",
  padding: 0,
  borderRadius: "50%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  height: "40px",
  width: "40px",
  backgroundColor: "#007BFF", // Primary color
  color: "white",
  fontSize: "1.2rem",
  fontWeight: "bold",
  borderWidth: "2px", // Added for consistency with original Avatar
  borderColor: "#007BFF", // Added
  overflow: 'hidden', // Added
};

const dropdownContentStyle: React.CSSProperties = {
  display: "block",
  position: "absolute",
  right: 0,
  backgroundColor: "white",
  minWidth: "220px", // w-56
  boxShadow: "0px 8px 16px 0px rgba(0,0,0,0.2)",
  zIndex: 1,
  borderRadius: "0.375rem", // rounded-md
  border: "1px solid #e5e7eb", // border
  padding: "0.25rem 0", // p-1
};

const dropdownItemStyle: React.CSSProperties = {
  padding: "0.5rem 1rem", // px-2 py-1.5
  textDecoration: "none",
  display: "flex", // For icon alignment
  alignItems: "center",
  gap: "0.5rem", // gap-2
  color: "black",
  cursor: "pointer",
  fontSize: "0.875rem", // text-sm
};

const dropdownItemHoverStyle: React.CSSProperties = {
  backgroundColor: "#f3f4f6", // bg-accent
};

const dropdownLabelStyle: React.CSSProperties = {
  padding: "0.75rem 1rem", // Similar to DropdownMenuLabel
  borderBottom: "1px solid #e5e7eb", // Separator
  marginBottom: "0.25rem",
};

export function UserNav() {
  const navigate = useNavigate();
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [userInitial, setUserInitial] = useState<string>("U");
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const role = localStorage.getItem('userRole') as UserRole | null;
      setUserRole(role);
      if (role) {
        setUserInitial(role.charAt(0).toUpperCase());
      }
    }
  }, []);

  // Close dropdown if clicked outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownRef]);

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('userRole');
    }
    setIsOpen(false);
    navigate("/login");
  };

  const handleProfileClick = () => {
    setIsOpen(false);
    navigate('/dashboard/profile');
  };
  
  // Basic placeholder image style, replace with actual image handling if needed
  const avatarImageStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  };


  return (
    <div style={userNavStyle} ref={dropdownRef}>
      <button onClick={() => setIsOpen(!isOpen)} style={avatarButtonStyle} title="User menu">
         {/* Basic Avatar Fallback - replace with actual image if available */}
         {/* For simplicity, using initial directly. Add <img /> if you have an image source */}
         {userInitial}
         {/* Example if you had an image: 
         <img src="/placeholder-avatar.jpg" alt="User avatar" style={avatarImageStyle} data-ai-hint="user avatar" /> 
         If image fails to load, the initial would be covered. You'd need more logic for true fallback.
         */}
      </button>
      {isOpen && (
        <div style={dropdownContentStyle}>
          <div style={dropdownLabelStyle}>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
              <p style={{ fontSize: "0.875rem", fontWeight: 500, lineHeight: "1.25" }}>Optimized Lab Management System User</p>
              <p style={{ fontSize: "0.75rem", lineHeight: "1.25", color: "#6b7280" }}>
                {userRole || "Role not set"}
              </p>
            </div>
          </div>
          
          <div 
            onClick={handleProfileClick} 
            style={dropdownItemStyle}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = dropdownItemHoverStyle.backgroundColor}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <UserCircle size={16} /> {/* lucide-react icon */}
            <span>Profile</span>
          </div>

          <hr style={{margin: '0.25rem 0', borderColor: '#e5e7eb'}}/> {/* Separator */}
          
          <div 
            onClick={handleLogout} 
            style={{...dropdownItemStyle, color: 'red'}}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#fee2e2' } // Light red hover
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent' }
          >
            <LogOut size={16} /> {/* lucide-react icon */}
            <span>Log out</span>
          </div>
        </div>
      )}
    </div>
  );
}
