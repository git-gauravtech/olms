"use client";
import * as React from "react";
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarTrigger,
  SidebarInset,
} from "@/components/ui/sidebar";
import { SidebarNavItems } from "@/components/dashboard/sidebar-nav-items";
import { UserNav } from "@/components/dashboard/user-nav";
import { AtomIcon } from "lucide-react";
import Link from "next/link";
import { useIsMobile } from "@/hooks/use-mobile";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const isMobile = useIsMobile();
  // Default sidebar to open on desktop, closed on mobile unless triggered
  const [defaultOpen, setDefaultOpen] = React.useState(true);

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      setDefaultOpen(window.innerWidth > 768);
    }
  }, []);


  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <Sidebar variant="sidebar" collapsible={isMobile ? "offcanvas" : "icon"} className="border-r bg-card">
        <SidebarHeader className="p-4 border-b border-border">
          <Link href="/dashboard/overview" className="flex items-center gap-2">
            <AtomIcon className="h-8 w-8 text-primary" />
            <span className="text-xl font-semibold text-foreground group-data-[collapsible=icon]:hidden">LabLink</span>
          </Link>
        </SidebarHeader>
        <SidebarContent className="p-2">
          <SidebarNavItems />
        </SidebarContent>
        <SidebarFooter className="p-4 mt-auto border-t border-border">
          {/* Optional: Footer content like settings or help */}
        </SidebarFooter>
      </Sidebar>
      <SidebarInset className="bg-muted/40">
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-background px-4 sm:px-6 shadow-sm">
            <SidebarTrigger className="md:hidden" />
          <div className="flex items-center gap-4 ml-auto">
            <UserNav />
          </div>
        </header>
        <main className="flex-1 p-4 sm:p-6 md:p-8 lg:p-10 overflow-auto">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
