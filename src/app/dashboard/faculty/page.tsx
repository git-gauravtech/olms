
"use client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useRoleGuard } from '@/hooks/use-role-guard';
import { USER_ROLES } from '@/types';
import { Skeleton } from "@/components/ui/skeleton";
import { LayoutDashboard, FlaskConical, CalendarPlus, CalendarCheck, Edit } from "lucide-react";

export default function FacultyDashboardPage() {
  const { isAuthorized, isLoading } = useRoleGuard(USER_ROLES.FACULTY);

  if (isLoading) {
    return (
      <div className="container mx-auto py-10 space-y-6">
        <Skeleton className="h-12 w-1/2 mb-4" />
        <Skeleton className="h-20 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
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
            <CardTitle className="text-3xl font-bold">Faculty Dashboard</CardTitle>
          </div>
          <CardDescription className="text-lg">
            Welcome, Faculty Member! Manage your lab sessions, bookings, and equipment requests.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Utilize the tools below to schedule lab times for your courses or research, view existing bookings, and check lab availability.
            In case of scheduling conflicts for critical sessions, you can request a reschedule via the lab availability grid.
          </p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FeatureCard
          title="Book a Lab Slot"
          description="Schedule individual lab sessions for research, project work, or small group consultations. Request specific equipment during booking."
          icon={<CalendarPlus className="h-10 w-10 text-primary mb-3" />}
          linkHref="/dashboard/book-slot"
          linkLabel="Book a Slot"
        />
        <FeatureCard
          title="View Lab Availability"
          description="Check the real-time availability of all labs. Use this to plan your sessions or find alternative slots. You can also request reschedules for booked slots from here if needed."
          icon={<FlaskConical className="h-10 w-10 text-primary mb-3" />}
          linkHref="/dashboard/labs"
          linkLabel="Check Availability"
        />
        <FeatureCard
          title="My Bookings"
          description="Review and manage all your scheduled lab sessions, including those pending approval or already completed."
          icon={<CalendarCheck className="h-10 w-10 text-primary mb-3" />}
          linkHref="/dashboard/faculty/my-bookings"
          linkLabel="View My Bookings"
        />
         <FeatureCard
          title="Request Reschedule (Feature)"
          description="If a critical lab slot is booked, navigate to 'View Lab Availability', click the booked slot, and use the 'Request Reschedule' option. This will notify admin for conflict resolution."
          icon={<Edit className="h-10 w-10 text-primary mb-3" />}
          linkHref="/dashboard/labs" 
          linkLabel="Access via Lab Availability"
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
