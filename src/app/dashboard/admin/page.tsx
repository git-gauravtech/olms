
"use client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useRoleGuard } from '@/hooks/use-role-guard';
import { USER_ROLES } from '@/types';
import { Skeleton } from "@/components/ui/skeleton";
import { Settings2, Wrench, UserCog, CalendarDays, BrainCircuit, LayoutDashboard } from "lucide-react";

export default function AdminDashboardPage() {
  const { isAuthorized, isLoading } = useRoleGuard(USER_ROLES.ADMIN);

  if (isLoading) {
    return (
      <div className="container mx-auto py-10 space-y-6">
        <Skeleton className="h-12 w-1/2 mb-4" />
        <Skeleton className="h-20 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return null; 
  }

  return (
    <div className="container mx-auto py-10 space-y-8">
      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex items-center space-x-3">
            <LayoutDashboard className="h-8 w-8 text-primary" />
            <CardTitle className="text-3xl font-bold">Admin Dashboard</CardTitle>
          </div>
          <CardDescription className="text-lg">
            Welcome, Admin! This is your central control panel for managing LabLink.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            From here, you can oversee all aspects of the lab management system, including lab and equipment configurations, user accounts, bookings, and system optimizations.
          </p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <FeatureCard
          title="Manage Labs"
          description="Configure lab details, capacities, and room assignments. Add new labs or modify existing ones."
          icon={<Settings2 className="h-10 w-10 text-primary mb-3" />}
          linkHref="/dashboard/admin/manage-labs"
          linkLabel="Go to Lab Management"
        />
        <FeatureCard
          title="Manage Equipment"
          description="Oversee laboratory equipment, including inventory, status, and assignments to specific labs or general pool."
          icon={<Wrench className="h-10 w-10 text-primary mb-3" />}
          linkHref="/dashboard/admin/manage-equipment"
          linkLabel="Go to Equipment Management"
        />
        <FeatureCard
          title="Manage Users"
          description="Administer user accounts, roles, and permissions for students, faculty, and CRs."
          icon={<UserCog className="h-10 w-10 text-primary mb-3" />}
          linkHref="/dashboard/admin/manage-users"
          linkLabel="Go to User Management"
        />
        <FeatureCard
          title="View All Bookings"
          description="Monitor all lab bookings across the system. Identify and manage scheduling conflicts."
          icon={<CalendarDays className="h-10 w-10 text-primary mb-3" />}
          linkHref="/dashboard/admin/view-bookings"
          linkLabel="Go to Bookings Overview"
        />
        <FeatureCard
          title="Run Algorithms"
          description="Execute diagnostic and optimization algorithms for scheduling, resource allocation, and lab usage."
          icon={<BrainCircuit className="h-10 w-10 text-primary mb-3" />}
          linkHref="/dashboard/admin/run-algorithms"
          linkLabel="Go to Algorithm Console"
        />
      </div>
    </div>
  );
}

interface FeatureCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  linkHref: string;
  linkLabel: string;
}

function FeatureCard({ title, description, icon, linkHref, linkLabel }: FeatureCardProps) {
  return (
    <Card className="shadow-md hover:shadow-xl transition-shadow flex flex-col">
      <CardHeader className="items-center text-center">
        {icon}
        <CardTitle className="text-xl">{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex-grow">
        <p className="text-sm text-muted-foreground text-center">{description}</p>
      </CardContent>
      <CardFooter>
        <Button asChild className="w-full bg-primary hover:bg-primary/90">
          <Link href={linkHref}>{linkLabel}</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}

