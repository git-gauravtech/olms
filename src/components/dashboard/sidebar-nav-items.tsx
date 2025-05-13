"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import type { NavItem, UserRole } from "@/types";
import { COMMON_NAV_LINKS, NAV_LINKS } from "@/constants";
import { SidebarMenu, SidebarMenuItem, SidebarMenuButton } from "@/components/ui/sidebar";
import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";

export function SidebarNavItems() {
  const pathname = usePathname();
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
      <SidebarMenu>
        {[...Array(5)].map((_, i) => (
          <SidebarMenuItem key={i}>
            <SidebarMenuButton
              variant="default"
              className="w-full justify-start cursor-default"
              disabled
              tooltip="Loading..."
            >
              <Skeleton className="h-5 w-5 mr-2 rounded" />
              <Skeleton className="h-4 w-20 rounded" />
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    );
  }

  const getNavItems = (): NavItem[] => {
    if (currentRole && NAV_LINKS[currentRole]) {
      return NAV_LINKS[currentRole];
    }
    // Fallback if role is not set or not found in NAV_LINKS
    return COMMON_NAV_LINKS; 
  };

  const navItems = getNavItems();

  if (!navItems || navItems.length === 0) {
    return null;
  }

  return (
    <SidebarMenu>
      {navItems.map((item) => {
        const IconComponent = item.icon;
        return (
          <SidebarMenuItem key={item.href}>
            <Link href={item.href} legacyBehavior passHref>
              <SidebarMenuButton
                variant="default"
                className={cn(
                  "w-full justify-start",
                  pathname === item.href
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )}
                isActive={pathname === item.href}
                tooltip={item.label}
              >
                {IconComponent && <IconComponent className="h-5 w-5 mr-2" />}
                <span className="truncate">{item.label}</span>
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
        );
      })}
    </SidebarMenu>
  );
}